import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { validateProductionWorkflowPlacement } from '../scripts/worldstage-production-gate-consumption.mjs';

const workflowPath=path.join(process.cwd(),'.github/workflows/vercel-traceable-release.yml');
const workflow=fs.readFileSync(workflowPath,'utf8');
const vercelConfig=JSON.parse(fs.readFileSync(path.join(process.cwd(),'vercel.json'),'utf8'));
function pos(name){return workflow.indexOf(`name: ${name}`);}
test('atomic release workflow preserves adapter -> consumption -> gate -> credential -> build/deploy order',()=>{ const result=validateProductionWorkflowPlacement(workflow); assert.equal(result.accepted,true,JSON.stringify(result.errors)); assert.ok(pos('Assemble production evidence artifact') < pos('Verify production evidence bundle with adapter')); });
test('Vercel production credential/provider operations cannot appear before production governance gate',()=>{ const gate=pos('Run machine-readable production release gate'); for(const name of ['Verify Vercel credential is configured','Pull Vercel project configuration','Build exact source for Vercel','Deploy prebuilt artifact']) assert.ok(pos(name)>gate,`${name} must follow gate`); const before=workflow.slice(0,gate); assert.ok(!before.includes('secrets.VERCEL_TOKEN')); assert.ok(!before.includes('vercel@${VERCEL_CLI_VERSION} pull')); assert.ok(!before.includes('build --prod')); assert.ok(!before.includes('deploy --prebuilt --prod')); });
test('raw bundle schema is not routed directly into production gate step',()=>{ const gateStart=pos('Run machine-readable production release gate'); const credStart=pos('Verify Vercel credential is configured'); const block=workflow.slice(gateStart,credStart); assert.ok(block.includes('consumed-adapter-evidence.json')); assert.ok(!block.includes('production-evidence-artifact.v1')); });
test('typed confirmation remains intent only and is not adjacent substitute for machine-readable gate',()=>{ assert.ok(workflow.includes('DEPLOY_CHERRY_PRODUCTION')); assert.ok(pos('Run machine-readable production release gate')>pos('Validate release intent')); });
test('Git-linked deployments are globally disabled so source changes cannot bypass the gated release workflow',()=>{ assert.equal(vercelConfig.git?.deploymentEnabled,false); });
test('production requires reviewed PR provenance before evidence assembly or provider access',()=>{
  const provenance=pos('Verify reviewed PR and exact-source CI provenance');
  assert.ok(provenance>pos('Capture exact source identity'));
  assert.ok(provenance<pos('Assemble production evidence artifact'));
  assert.ok(provenance<pos('Verify Vercel credential is configured'));
  const block=workflow.slice(provenance,pos('Set up Node'));
  assert.ok(block.includes('listPullRequestsAssociatedWithCommit'));
  assert.ok(block.includes("pr.merged_at && pr.base?.ref === 'main'"));
  assert.ok(block.includes('listWorkflowRunsForRepo'));
  assert.ok(block.includes('head_sha: sourceSha'));
  assert.ok(block.includes("run.conclusion === 'success'"));
  assert.ok(block.includes("run.path === '.github/workflows/mobile-contract.yml'"));
});
test('production fails closed unless native GitHub main protection is active at release time',()=>{
  const provenance=pos('Verify reviewed PR and exact-source CI provenance');
  const block=workflow.slice(provenance,pos('Set up Node'));
  assert.ok(block.includes('github.rest.repos.getBranch'));
  assert.ok(block.includes("branch: 'main'"));
  assert.ok(block.includes('mainBranch.protected !== true'));
  assert.ok(block.includes('native GitHub protection is not active on main'));
  assert.ok(block.indexOf('github.rest.repos.getBranch') < block.indexOf('listPullRequestsAssociatedWithCommit'));
});
