import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const fixtureRoot = path.resolve(process.cwd());
const minimum = ['D1','D2','D3','D5','D6','D7','D8','D9','D10','D15','D16','D17','D18'];
function mkFixture(ledgerText) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'worldstage-preflight-'));
  fs.mkdirSync(path.join(dir, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'config/worldstage'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'docs/worldstage'), { recursive: true });
  fs.copyFileSync(path.join(fixtureRoot, 'scripts/worldstage-staging-preflight.mjs'), path.join(dir, 'scripts/worldstage-staging-preflight.mjs'));
  fs.copyFileSync(path.join(fixtureRoot, 'scripts/worldstage-decision-evidence-check.mjs'), path.join(dir, 'scripts/worldstage-decision-evidence-check.mjs'));
  fs.copyFileSync(path.join(fixtureRoot, 'config/worldstage/phase2-staging-gate.json'), path.join(dir, 'config/worldstage/phase2-staging-gate.json'));
  fs.writeFileSync(path.join(dir, 'docs/worldstage/PHASE2_DECISION_EVIDENCE_LEDGER_2026-08-10.md'), ledgerText);
  return dir;
}
function run(dir, args = []) {
  const result = spawnSync(process.execPath, ['scripts/worldstage-staging-preflight.mjs', ...args], { cwd: dir, encoding: 'utf8', env: { ...process.env, WORLDSTAGE_ENV:'staging', WORLDSTAGE_STAGING_PROJECT_ID:'synthetic-staging-project', WORLDSTAGE_PRODUCTION_PROJECT_ID:'synthetic-production-project', WORLDSTAGE_INTAKE_ENABLED:'false', WORLDSTAGE_SECURE_INTAKE_ENABLED:'false', WORLDSTAGE_SECURE_INTAKE_PERSISTENCE:'', WORLDSTAGE_SECURE_INTAKE_ADAPTER_BOUND:'false', WORLDSTAGE_SOURCE_SHA:'a'.repeat(40) } });
  const reportPath = path.join(dir, 'artifacts/staging-readiness/worldstage-phase2-staging-readiness.json');
  return { result, report: fs.existsSync(reportPath) ? JSON.parse(fs.readFileSync(reportPath, 'utf8')) : null };
}
function ledger(status='RESOLVED', placeholderId=null, includeBlocks=true) {
  const rows=['| ID | Topic | Status | Decision value | Approved by | Date | Evidence/source | Implementation impact |','|---|---|---|---|---|---|---|---|'];
  const blocks=[];
  for (const id of minimum) {
    rows.push(`| ${id} | Synthetic ${id} | ${status} | Synthetic ${id} | Authorized Owner | 2026-08-12 | synthetic:${id} | Synthetic |`);
    if (includeBlocks && status === 'RESOLVED') blocks.push([`Decision ID: ${id}`,'Status: RESOLVED',`Decision value: Synthetic ${id}`,`Approved by: ${id===placeholderId?'TBD':'Authorized Owner'}`,'Approval date: 2026-08-12',`Evidence/source: synthetic:${id}`,'Rationale: Synthetic regression only','Exceptions: NONE','Implementation impact: Synthetic regression only'].join('\n'));
  }
  return `${rows.join('\n')}\n\n${blocks.join('\n\n')}\n`;
}
test('all-open minimum decision rows remain blocked',()=>{ const {result,report}=run(mkFixture(ledger('OPEN'))); assert.equal(result.status,0); assert.equal(report.readiness,'BLOCKED'); assert.ok(report.blockers.some(x=>x.code==='OWNER_SECURITY_DECISIONS_OPEN')); });
test('RESOLVED rows without evidence blocks fail closed',()=>{ const {result,report}=run(mkFixture(ledger('RESOLVED',null,false)),['--require-ready']); assert.equal(result.status,2); assert.ok(report.blockers.some(x=>x.code==='OWNER_SECURITY_DECISION_EVIDENCE_INVALID')); });
test('placeholder approval evidence fails closed',()=>{ const {result,report}=run(mkFixture(ledger('RESOLVED','D1',true)),['--require-ready']); assert.equal(result.status,2); assert.ok(report.ledger.validation_errors.includes('D1: missing or placeholder Approved by')); });
test('complete synthetic evidence crosses only this narrow preflight boundary',()=>{ const {result,report}=run(mkFixture(ledger())); assert.equal(result.status,0); assert.equal(report.readiness,'READY_FOR_ISOLATED_STAGING_EXECUTION'); assert.deepEqual(report.ledger.validation_errors,[]); });
