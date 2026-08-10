import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  checkText,
  isSweepExcluded,
} from '../scripts/voice-gates.mjs';

test('raw council report is excluded only as generated sweep evidence', () => {
  const exclusion = isSweepExcluded('docs/research/voice-workflow-sourcing-report.json');

  assert.match(exclusion.reason, /^GENERATED:/);
  assert.equal(isSweepExcluded('docs/research/voice-workflow-sourcing-prompt.md'), null);
});

test('repository agent policy passes the voice gates', () => {
  const policy = readFileSync(new URL('../AGENTS.md', import.meta.url), 'utf8');

  assert.deepEqual(checkText(policy), []);
});
