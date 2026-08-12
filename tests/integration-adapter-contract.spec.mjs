import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const contract = fs.readFileSync('docs/worldstage/INTEGRATION_ADAPTER_CONTRACT_DRAFT_2026-08-10.md', 'utf8');

test('adapter contract keeps business truth provider-neutral', () => {
  expect(contract).toContain('Adapters move evidence and actions across boundaries. They do not own business truth.');
  expect(contract).toContain('SourceEnvelope');
  expect(contract).toContain('payload_hash');
  expect(contract).toContain('raw_payload_pointer');
});

test('new adapters are read-only by default and write-back is separately governed', () => {
  expect(contract).toContain('`READ / RECEIVE ONLY`');
  expect(contract).toContain('Write-back requires a separate approved contract');
  expect(contract).toContain('No adapter gets broad `sync everything both ways` authority by default.');
});

test('adapter cannot mint authority, visibility, verified outcomes, or release rights', () => {
  for (const phrase of [
    'create owner authority',
    'assign Cherry-level decision authority',
    'change participant-private data to sponsor-visible',
    'mark an intervention outcome as verified',
    'publish a client claim',
    'invent retention/deletion policy',
    'enable AI eligibility',
    'authorize production release'
  ]) expect(contract).toContain(phrase);
});

test('provider failure preserves provenance and fails closed for consequential actions', () => {
  expect(contract).toContain('visibly mark freshness/staleness');
  expect(contract).toContain('do not fabricate replacement facts');
  expect(contract).toContain('do not convert stale data into an automated decision');
  expect(contract).toContain('fail closed or require human review');
});

test('adapter contract forbids cross-product database coupling', () => {
  expect(contract).toContain("WorldStage adapters must not directly read another Banatao product's application database.");
  expect(contract).toContain('versioned provider/platform contracts with scoped authorization');
});
