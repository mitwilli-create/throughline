import assert from 'node:assert/strict';
import test from 'node:test';

import {
  gateContentWriting,
  isContentArtifact,
} from '../scripts/writing-craft-gate.mjs';

test('content prose is eligible while notes and render output bypass', () => {
  assert.equal(isContentArtifact('drafts/story/master.md'), true);
  assert.equal(isContentArtifact('drafts/story/linkedin.md'), true);
  assert.equal(isContentArtifact('drafts/story/NOTES.md'), false);
  assert.equal(isContentArtifact('drafts/story/.render/body.md'), false);
  assert.equal(isContentArtifact('.render/body.md'), false);
  assert.equal(isContentArtifact('AGENTS.md'), false);
});

test('content gate is publish-blocking and returns accepted text', () => {
  let request;
  const result = gateContentWriting({
    text: 'The draft.',
    artifactType: 'post',
    artifactId: 'story-linkedin',
    projectRoot: '/tmp/content',
    run: (_command, _args, options) => {
      request = JSON.parse(options.input);
      return {
        status: 0,
        stdout: JSON.stringify({
          decision: 'pass',
          revisedText: 'The stronger draft.',
          lessonPath: '/tmp/content/.writing-coach/inbox/lesson.md',
        }),
        stderr: '',
      };
    },
  });

  assert.equal(request.enforcementMode, 'publish-blocking');
  assert.equal(result.text, 'The stronger draft.');
});

test('content gate fails closed', () => {
  assert.throws(
    () => gateContentWriting({
      text: 'The draft.',
      artifactType: 'article',
      artifactId: 'story-master',
      projectRoot: '/tmp/content',
      run: () => ({
        status: 1,
        stdout: JSON.stringify({ decision: 'failed', revisedText: 'The draft.' }),
        stderr: '',
      }),
    }),
    /writing craft blocked/,
  );
});

test('content gate rejects an unknown success state', () => {
  assert.throws(
    () => gateContentWriting({
      text: 'The draft.',
      artifactType: 'article',
      artifactId: 'story-master',
      projectRoot: '/tmp/content',
      run: () => ({
        status: 0,
        stdout: JSON.stringify({ decision: 'partial', revisedText: 'The draft.' }),
        stderr: '',
      }),
    }),
    /writing craft blocked/,
  );
});
