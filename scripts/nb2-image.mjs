#!/usr/bin/env node
// nb2-image.mjs: Nano Banana 2 (Gemini 3.1 Flash Image) generate/edit helper.
// Text-to-image, or image-edit with one or more input images.
// Usage:
//   node scripts/nb2-image.mjs --prompt "..." --out path.png [--in src.jpg ...] [--model ID] [--aspect 16:9]
// Env: GEMINI_API_KEY (required). Never printed.
// Reusable across drafts; keeps image gen in-repo per AGENTS.md tooling convention.

import { readFileSync, writeFileSync } from 'node:fs';
import { extname } from 'node:path';

const args = process.argv.slice(2);
const get = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const getAll = (flag) => args.reduce((a, v, i) => (v === flag ? [...a, args[i + 1]] : a), []);

const prompt = get('--prompt');
const out = get('--out');
const model = get('--model') || 'gemini-3.1-flash-image-preview';
const aspect = get('--aspect') || null;
const ins = getAll('--in');

if (!prompt || !out) { console.error('need --prompt and --out'); process.exit(2); }
const key = process.env.GEMINI_API_KEY;
if (!key) { console.error('NO GEMINI_API_KEY in env'); process.exit(3); }

const mimeOf = (p) => ({ '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }[extname(p).toLowerCase()] || 'image/jpeg');

const parts = [{ text: prompt }];
for (const p of ins) {
  parts.push({ inline_data: { mime_type: mimeOf(p), data: readFileSync(p).toString('base64') } });
}

const body = { contents: [{ parts }] };
if (aspect) body.generationConfig = { imageConfig: { aspectRatio: aspect } };

const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const json = await res.json();
if (!res.ok || json.error) {
  console.error('API error', res.status, json.error?.status, (json.error?.message || '').slice(0, 300));
  process.exit(1);
}
const outParts = json.candidates?.[0]?.content?.parts || [];
const img = outParts.find((p) => p.inlineData || p.inline_data);
const data = img?.inlineData?.data || img?.inline_data?.data;
if (!data) {
  const txt = outParts.map((p) => p.text).filter(Boolean).join(' ').slice(0, 300);
  console.error('no image in response. text:', txt || '(none)');
  process.exit(1);
}
writeFileSync(out, Buffer.from(data, 'base64'));
console.log(`wrote ${out} (${Buffer.from(data, 'base64').length} bytes, model ${model}${aspect ? ', aspect ' + aspect : ''})`);
