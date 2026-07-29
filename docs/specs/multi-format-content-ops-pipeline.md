# Spec: Multi-format Content Ops pipeline (article + short video + podcast)

Status: ready-for-agent
Source idea: `~/Documents/content-ops-ideas/docs/FUTURE-IDEAS.md`, entry "Multi-format Content Ops pipeline: one topic to article, short video, and podcast" (Date logged: 2026-07-16)
Companion repos: `~/Documents/content-ops` (this repo), `~/Documents/broll-pipeline` (PictureLock)

## Problem Statement

One topic today produces one Substack article. Turning that same topic into a polished short video and a ten-minute podcast requires Mitchell to hand-carry the source thinking across three separate stacks, rewrite the script twice, and pay for each surface in isolation. Cross-surface consistency (voice, claims, on-screen text, closing CTA) drifts on every hand-off, and the podcast lane has no operator at all: he has ElevenLabs, Veo, Nano Banana 2, AssemblyAI, and PictureLock, and no clear routing between them. The result is a text-only Content Ops that under-uses source thinking and gives PictureLock no recurring internal customer.

## Solution

Extend Content Ops from a single-surface (article) generator to a fan-out that produces three artifacts from one canonical brief: a Substack article, a PictureLock-produced short video, and a ~10-minute podcast cut. The article stays the entry point and canonical source of truth; video and podcast are downstream adapters that read the same brief. Video reuses PictureLock's existing pipeline unchanged (script DSL + cover mode). Podcast reuses ElevenLabs (already in PictureLock) for narration and AssemblyAI for transcription, and adds a thin cut-and-mix step that Mitchell can operate manually before we automate it.

The build order is: (1) formalize the canonical topic-brief seam, (2) wire the article → PictureLock adapter (article to script DSL), (3) wire the article → podcast adapter and produce the first ten-minute cut end-to-end, (4) run a competitor scan to route PictureLock roadmap decisions, decoupled from the pipeline.

## User Stories

1. As Mitchell, I want to start every multi-format piece from one canonical brief so the article, video, and podcast can never disagree on facts, framing, or CTA.
2. As Mitchell, I want the Substack article to always be the entry point and canonical source, so downstream video and podcast adapters are pure reads and never mutate the story.
3. As Mitchell, I want a single command that takes an approved article and produces a PictureLock script DSL file at `input/script.md` in `~/Documents/broll-pipeline`, so I never hand-adapt an article into beats.
4. As Mitchell, I want the PictureLock adapter to preserve voice-rule compliance (no em dashes, no banned words, first-person, one aphorism max), so the video captions and VO never leak an AI tell the article passed.
5. As Mitchell, I want to run PictureLock in `--mock` before spending on live generation, so I can review timing, captions, and cost projection before a paid run.
6. As Mitchell, I want a single command that takes an approved article and produces a `podcast/master.md` script (episode outline + narration blocks + music/SFX markers), so the podcast lane has the same DSL discipline the video lane has.
7. As Mitchell, I want the podcast lane to reuse ElevenLabs for narration (same voice as PictureLock VO), so the two surfaces sound like the same person.
8. As Mitchell, I want the podcast lane to reuse AssemblyAI for word-timed transcription of the produced cut, so I get show notes, chapter marks, and a caption file without a second vendor.
9. As Mitchell, I want the first version of the podcast cut-and-mix step to be a manually-run recipe (documented order of operations) rather than an autonomous job, so I can validate quality before investing in automation.
10. As Mitchell, I want every artifact of every run stored under `drafts/<slug>/` with a fixed subtree (`master.md`, `article.md`, `video/`, `podcast/`, `run-manifest.json`), so I can find any past run by slug and see exactly what was spent where.
11. As Mitchell, I want a per-run cost manifest that sums article-drafting spend + PictureLock spend + podcast narration/transcription spend into one total, so I can answer "cost per topic" without hunting.
12. As Mitchell, I want a hard per-run budget cap enforced at the pipeline level, so an autonomous run cannot silently blow past the ceiling.
13. As Mitchell, I want `--mock` mode to work across all three lanes end-to-end at $0, so I can smoke-test the whole pipeline before every live run.
14. As Mitchell, I want each lane individually skippable (`--skip-video`, `--skip-podcast`), so I can publish an article without paying for the other two surfaces when the topic does not warrant them.
15. As Mitchell, I want a publishable-quality bar defined for the video (PictureLock's existing review-board pass) and the podcast (loudness + no dead air + captions present), and the pipeline to refuse to mark a lane complete without it.
16. As Mitchell, I want nothing published autonomously; every lane stops at "ready to publish" and hands off to me for the send button.
17. As Mitchell, I want a competitor scan of Reelful and other video production/post-production apps as a SEPARATE deliverable that informs PictureLock's roadmap, not a blocker on this pipeline shipping.
18. As Mitchell, I want the podcast platform choice explicitly framed as a decision node inside this spec, so we do not silently commit to one before validating cost and fit against the ElevenLabs + AssemblyAI baseline.
19. As Mitchell, I want the pipeline to log every LLM and API call to `output/<slug>/run-manifest.json` in the same shape PictureLock already uses, so cost auditing is one grep across surfaces.
20. As Mitchell, I want the article → PictureLock adapter to produce a beat sheet whose total runtime targets a configurable ceiling (default 60s), so the short video stays short by construction.
21. As Mitchell, I want the article → podcast adapter to target a configurable episode length (default 10 min, 8-12 min band), so the podcast cut respects the intended surface.
22. As Mitchell, I want to run the whole pipeline against an existing published article (not just a fresh one), so I can backfill video + podcast onto pieces already live on Substack.
23. As Mitchell, I want a documented smoke test that proves end-to-end operation before I trust the pipeline on real spend.
24. As Mitchell, I want the pipeline to fail loud (non-zero exit, structured error) on any voice-rule violation caught by `voice-gates.mjs` at any stage, so a defect never ships downstream.

## Implementation Decisions

### Canonical seam

The canonical seam is `drafts/<slug>/master.md`, a plain-Markdown brief with a small frontmatter contract: `title`, `slug`, `audience`, `substack_url` (optional, for backfill mode), `video_target_seconds` (default 60), `podcast_target_minutes` (default 10), `budget_usd` (per-run cap). Everything downstream reads this file. There is exactly one seam per topic; article, video, and podcast are adapters over it.

### Article lane (unchanged)

Article drafting continues to route through `python3 ~/Documents/voice-os/scripts/draft_long.py --file <brief> --out drafts/<slug>/article.md`. No changes to the article generator. The article lane's completion criterion is unchanged: `voice-gates.mjs` passes + Mitchell approves.

### Video lane (adapter over PictureLock, no fork)

A new script `scripts/adapt-to-picturelock.mjs` reads `drafts/<slug>/master.md` + `drafts/<slug>/article.md` and emits a PictureLock script DSL file at `drafts/<slug>/video/script.md`. That file conforms to the DSL PictureLock already parses (`##` beat headings, `VO:`, `VISUAL:`, `SECONDS:`, `VISUAL-MODE:`, optional `SFX:`, `CAPTION:`; see `~/Documents/broll-pipeline/README.md` § Script DSL). The adapter targets `video_target_seconds` from the frontmatter and produces beats whose SECONDS sum lands within ±10%.

Running the video lane invokes PictureLock in its own repo with an explicit script path:

```
node ~/Documents/broll-pipeline/pipeline.mjs \
  --script drafts/<slug>/video/script.md \
  --budget <video_budget> \
  [--mock | --dry-run | (live)]
```

PictureLock's outputs (short.mp4, short.srt, run-manifest.json) land in its own `output/` per its existing contract; the wrapper copies them into `drafts/<slug>/video/` on success. Nothing about PictureLock is forked, duplicated, or re-implemented. The creative council, review board, Craft Law, and cost logging that PictureLock already ships are the video-lane quality bar.

The adapter enforces content-ops voice rules on `VO:` and `CAPTION:` lines before writing the DSL file: em dashes stripped, banned words fail closed. `voice-gates.mjs` runs on the emitted DSL as a gate.

### Podcast lane (new adapter, thin reuse of ElevenLabs + AssemblyAI)

A new script `scripts/adapt-to-podcast.mjs` reads the same canonical brief and emits a podcast script at `drafts/<slug>/podcast/master.md`. The podcast DSL mirrors PictureLock's beat convention so the same voice-gate applies:

```markdown
## segment 1: cold open
VO: <narration>
MUSIC: <cue name or "under" | "up" | "out">
SFX: <optional prompt or file reference>
SECONDS: 45
```

The lane's stages, in order:

1. Emit `podcast/master.md` from the brief + article.
2. Voice-gate the script (fail closed on violations).
3. Render narration segment-by-segment through ElevenLabs TTS using the same `XI_VOICE_ID` PictureLock uses. Segments cached by content hash.
4. Assemble segments into a single narration track with a documented recipe for music bed + intro/outro; v1 is a documented manual step (ffmpeg command list + a target LUFS), not an automated mixer.
5. Transcribe the final assembled cut through AssemblyAI (word-timed) for show notes, chapter marks, and captions.
6. Emit `podcast/episode.mp3`, `podcast/episode.srt`, `podcast/show-notes.md`, `podcast/run-manifest.json`.

Podcast post-production platform choice is an EXPLICIT decision node, not a decision made in this spec. The v1 stack (ElevenLabs + AssemblyAI + ffmpeg recipe) is the baseline; any candidate (Descript, Adobe Podcast, Riverside, Auphonic, etc.) must beat this baseline on cost per episode AND publishable quality before adoption. That evaluation is a separate task, not a blocker on shipping v1.

### Orchestrator

A top-level `scripts/produce.mjs` accepts:

```
node scripts/produce.mjs --slug <slug> [--only article|video|podcast] \
  [--skip-video] [--skip-podcast] [--mock | --dry-run] [--budget <usd>]
```

It reads `drafts/<slug>/master.md`, runs the requested lanes in sequence (article → video → podcast), aggregates per-lane `run-manifest.json` files into a top-level `drafts/<slug>/run-manifest.json`, and refuses to proceed to a paid run if `voice-gates.mjs` fails on any emitted artifact. The budget cap is enforced at both the orchestrator level (total) and passed through to PictureLock (video sub-cap).

### Backfill mode

`--from-article <path-or-url>` reads an already-published article (local Markdown or a Substack URL fetched with WebFetch) as the canonical article for the topic, skipping the article-drafting stage. This satisfies User Story 22 without a separate code path: it just seeds `drafts/<slug>/article.md` from an external source.

### Publishing

Nothing publishes autonomously. The orchestrator's terminal state is "READY: article + video + podcast staged in `drafts/<slug>/`". Publish uses existing skills (`/publish` for Substack + LinkedIn) plus Mitchell-in-the-loop uploads for the video and podcast surfaces.

### Competitor scan (decoupled)

The Reelful + video production/post-production app scan is a SEPARATE deliverable (`docs/research/pictureLock-competitor-scan-<YYYY-MM-DD>.md`) produced via `/researcher` or a council fan-out. Its output feeds PictureLock's roadmap, not this pipeline. Scoping and cost for the scan are out of scope for this spec.

## Testing Decisions

Good tests here exercise the external contract of each lane at the highest possible seam and never mock PictureLock's internals or ElevenLabs response shapes. The pipeline is I/O and cost-heavy; tests focus on the pure adapters and the orchestrator's plan, not on generative fidelity.

### Modules tested

1. `scripts/adapt-to-picturelock.mjs`: given a fixture `master.md` + `article.md`, emits a PictureLock DSL file that (a) parses under PictureLock's parser without warnings, (b) sums SECONDS within ±10% of `video_target_seconds`, (c) contains no em dashes and no banned words on `VO:` or `CAPTION:` lines, (d) has a `VISUAL:` for every beat with `VISUAL-MODE: gen` and a `MOGRAPH:` for every `VISUAL-MODE: mograph`.
2. `scripts/adapt-to-podcast.mjs`: given the same fixtures, emits a podcast `master.md` that (a) passes `voice-gates.mjs`, (b) has a segment count and total SECONDS within the target band, (c) declares a `MUSIC:` cue on every segment.
3. `scripts/produce.mjs`: given a fixture slug in `--mock` mode with all lanes enabled, produces a `drafts/<slug>/` tree with the exact fixed subtree named above, a top-level `run-manifest.json` with `total_usd: 0`, and exit code 0. With `--skip-podcast`, the `podcast/` dir is absent. With a deliberately-broken fixture (em dash in article body), it exits non-zero before any paid call.

### Prior art

PictureLock's `--mock` and `--dry-run` are the model. All three lanes must support both. Content-ops's `voice-gates.mjs` is the existing voice-rule gate; reuse it, do not re-implement. The `run-manifest.json` shape is PictureLock's; the orchestrator manifest is a superset that references per-lane manifests by relative path.

### Smoke test (names the end-to-end proof)

`npm run smoke:multi-format` runs:

```
node scripts/produce.mjs --slug fixture-smoke --mock --budget 0
```

against a checked-in fixture brief. It passes iff:

1. `drafts/fixture-smoke/article.md` exists, non-empty, passes `voice-gates.mjs`.
2. `drafts/fixture-smoke/video/script.md` exists and parses cleanly under PictureLock's DSL parser.
3. `drafts/fixture-smoke/video/short.mp4` exists (mock output).
4. `drafts/fixture-smoke/podcast/master.md` exists, non-empty, passes `voice-gates.mjs`.
5. `drafts/fixture-smoke/podcast/episode.mp3` exists (mock output: `say`-generated placeholder, same fallback pattern PictureLock uses).
6. `drafts/fixture-smoke/run-manifest.json` exists, valid JSON, `total_usd === 0`, references per-lane manifests.

The smoke test is what a reviewer runs to confirm the pipeline works end-to-end. It is CI-eligible because it makes zero paid calls.

### Acceptance criteria (concrete)

- Given `master.md` with `video_target_seconds: 60`, `podcast_target_minutes: 10`, and a 1,200-word article: `produce --mock` completes in under 5 minutes on Mitchell's laptop, produces all six artifacts above, and reports `total_usd: 0`.
- Given the same brief with `--budget 5` and no `--mock`: the orchestrator refuses to start any paid call whose projected cost would push the running total over $5, and exits with a structured budget-exceeded error.
- Given an article containing an em dash: `voice-gates.mjs` fails at the article stage, and no adapter runs.
- Given `--only video` on a slug whose `article.md` is missing: the orchestrator exits non-zero with "article stage required" before invoking PictureLock.
- Given `--from-article ./drafts/existing/article.md` (an already-published piece): the orchestrator skips article drafting, runs the video and podcast adapters over that article, and emits the same tree.

## Out of Scope

- Publishing anywhere. The `/publish` skill handles Substack + LinkedIn; podcast and video upload remain Mitchell-in-the-loop.
- Autonomous podcast mixing. V1 is a documented ffmpeg recipe; a mixer is a future spec.
- Choosing a podcast post-production SaaS. Evaluated separately against the ElevenLabs + AssemblyAI + ffmpeg baseline.
- The Reelful competitor scan. Produced as a decoupled research deliverable.
- New PictureLock features surfaced by the competitor scan. Those become their own specs against the PictureLock repo.
- Video formats other than the PictureLock short (long-form YouTube, TikTok verticals with different aspect ratios, etc.).
- Multi-language dubbing across all three surfaces. PictureLock's dub flow already exists; wiring the same across the podcast is a follow-on.
- A UI. Everything is CLI + Markdown.

## Further Notes

The strongest lever in this design is that PictureLock is reused as a black box invoked by path. The video lane has one seam (`drafts/<slug>/video/script.md`), and everything downstream of that seam is PictureLock's problem, including cost logging, review-board quality gates, the seven-expert creative council, and the Craft Law. That keeps the content-ops surface small and lets PictureLock evolve independently.

The podcast lane deliberately ships thin. Every hour spent picking a post-production platform before we have a first cut in hand is an hour spent optimizing an unmeasured surface. Ship the ElevenLabs + AssemblyAI + ffmpeg baseline, produce three real episodes, then evaluate SaaS candidates against that measured baseline.

The competitor scan output is genuinely valuable but does not gate this pipeline. Decoupling it here prevents the pipeline from stalling on a research task with an unbounded scope.

Voice-rule enforcement runs at every stage boundary because a defect caught after a paid generation is a defect that cost money. `voice-gates.mjs` at the article, at the video DSL, at the podcast DSL, and at the show notes.

Backfill mode is cheap because the canonical seam is a file. Any existing article that can be dropped into `drafts/<slug>/article.md` becomes eligible for video and podcast production, which means the pipeline can be validated against Mitchell's existing published work before it's used on a fresh topic.
