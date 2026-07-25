#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const DEFAULT_CRAFT_ROOT = resolve(ROOT, '..', 'writing-craft');

export function isContentArtifact(path) {
  const normalized = path.replaceAll('\\', '/');
  return normalized.startsWith('drafts/')
    && normalized.endsWith('.md')
    && basename(normalized).toLowerCase() !== 'notes.md'
    && !normalized.includes('/.render/');
}

export function gateContentWriting({
  text,
  artifactType,
  artifactId,
  projectRoot = ROOT,
  run = spawnSync,
  writingCraftRoot = process.env.WRITING_CRAFT_ROOT || DEFAULT_CRAFT_ROOT,
}) {
  const request = {
    sourceSystem: 'content-ops',
    projectRoot,
    artifactType,
    artifactId,
    audience: 'public',
    stakes: 'high',
    enforcementMode: 'publish-blocking',
    text,
    outputPath: null,
  };
  const result = run(
    process.execPath,
    [join(writingCraftRoot, 'bin', 'writing-craft.mjs'), 'revise'],
    {
      cwd: projectRoot,
      input: JSON.stringify(request),
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
      timeout: 180_000,
    },
  );
  if (result.error || result.signal) {
    throw new Error(`writing craft failed: ${result.error?.message || `terminated by ${result.signal}`}`);
  }
  let payload;
  try {
    payload = JSON.parse(result.stdout);
  } catch {
    throw new Error(`writing craft failed: ${result.stderr?.trim() || 'invalid response'}`);
  }
  if (!payload || typeof payload !== 'object') {
    throw new Error(`writing craft failed: ${result.stderr?.trim() || 'invalid response'}`);
  }
  if (
    result.status !== 0
    || !['pass', 'no-safe-improvement'].includes(payload.decision)
    || typeof payload.revisedText !== 'string'
  ) {
    throw new Error(`writing craft blocked ${artifactId}: ${payload.failure?.message || result.stderr?.trim() || 'gate failure'}`);
  }
  return {
    ...payload,
    text: payload.decision === 'pass' ? payload.revisedText : text,
  };
}

function inferType(path) {
  const name = basename(path).toLowerCase();
  if (name.includes('newsletter') || name === 'master.md') return 'article';
  if (name.includes('script')) return 'script';
  return 'post';
}

async function main() {
  const path = resolve(process.argv[2] || '');
  if (!process.argv[2]) throw new Error('usage: writing-craft-gate.mjs <draft.md> [artifact-type]');
  const local = relative(ROOT, path);
  if (!isContentArtifact(local)) {
    process.stdout.write(`writing-craft: bypassed machine artifact ${local}\n`);
    return;
  }
  const result = gateContentWriting({
    text: readFileSync(path, 'utf8'),
    artifactType: process.argv[3] || inferType(path),
    artifactId: local.replace(/[^a-z0-9]+/gi, '-'),
  });
  if (result.decision === 'pass') writeFileSync(path, result.text, 'utf8');
  process.stdout.write('Writing Coach: 1 new lesson in .writing-coach/inbox/\n');
  process.stdout.write(`${JSON.stringify({ decision: result.decision, lessonPath: result.lessonPath })}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`writing-craft: ${error.message}\n`);
    process.exitCode = 1;
  });
}
