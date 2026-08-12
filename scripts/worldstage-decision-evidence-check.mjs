import fs from 'node:fs';
import path from 'node:path';

const REQUIRED_FIELDS = [
  'Decision ID',
  'Status',
  'Decision value',
  'Approved by',
  'Approval date',
  'Evidence/source',
  'Rationale',
  'Exceptions',
  'Implementation impact'
];

export function parseDecisionRows(markdown) {
  const rows = new Map();
  for (const line of markdown.split('\n')) {
    const match = line.match(/^\|\s*(D\d+)\s*\|[^|]*\|\s*(OPEN|RESOLVED)\s*\|/);
    if (match) rows.set(match[1], match[2]);
  }
  return rows;
}

function extractEvidenceBlock(markdown, id) {
  const marker = `Decision ID: ${id}`;
  const start = markdown.indexOf(marker);
  if (start < 0) return null;
  const next = markdown.indexOf('\nDecision ID: D', start + marker.length);
  return markdown.slice(start, next < 0 ? markdown.length : next);
}

function fieldValue(block, field) {
  const match = block.match(new RegExp(`^${field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\s*(.+)$`, 'm'));
  return match?.[1]?.trim() || '';
}

function isPlaceholder(value) {
  if (!value) return true;
  const normalized = value.trim().toUpperCase();
  return normalized === '—' || normalized === '-' || normalized === 'OPEN' || normalized === 'TBD' || normalized === 'TO VALIDATE' || /^<.*>$/.test(value.trim());
}

export function validateLedger(markdown) {
  const rows = parseDecisionRows(markdown);
  const errors = [];

  for (const [id, status] of rows) {
    if (status !== 'RESOLVED') continue;
    const block = extractEvidenceBlock(markdown, id);
    if (!block) {
      errors.push(`${id}: RESOLVED row has no evidence block`);
      continue;
    }

    for (const field of REQUIRED_FIELDS) {
      const value = fieldValue(block, field);
      if (isPlaceholder(value)) errors.push(`${id}: missing or placeholder ${field}`);
    }

    if (fieldValue(block, 'Status') !== 'RESOLVED') {
      errors.push(`${id}: evidence block Status must be RESOLVED`);
    }
  }

  return { rows, errors };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = process.cwd();
  const ledgerPath = path.join(root, 'docs/worldstage/PHASE2_DECISION_EVIDENCE_LEDGER_2026-08-10.md');
  const markdown = fs.readFileSync(ledgerPath, 'utf8');
  const result = validateLedger(markdown);

  console.log(`[worldstage-decision-evidence] decisions=${result.rows.size}`);
  if (result.errors.length) {
    for (const error of result.errors) console.error(`[decision-evidence-error] ${error}`);
    process.exitCode = 2;
  } else {
    console.log('[worldstage-decision-evidence] PASS');
  }
}
