# LLM Routing: expanded rationale

last_verified: 2026-08-08
notes: Gemini slots are resolved by career-ops' canonical resolver. Strategic Gemini routes use `google:gemini-3.1-pro` → `gemini-3.1-pro-preview`; stable Flash routes use `google:gemini-3.6-flash` → `gemini-3.6-flash`. The old `google:gemini-2.5-pro` and generic `gemini-flash` names are compatibility labels only.

## Automatic provider blocker rule

When a frontier task hits a provider blocker, advance automatically in this
order: Claude subscription models, ChatGPT/OpenAI subscription models through
Codex CLI, Antigravity/Gemini subscription, Grok subscription, then API
compatibility fallbacks. Quota, plan-limit,
credential, timeout, circuit, unavailable-provider, and malformed-response
failures advance. Policy, privacy, input, authorization, and uncertain
mid-edit failures stop. A metered API key is never silently substituted for a
failed subscription seat. Every attempt records the requested slot, resolved
model, provider, account type, and bounded outcome.

Invocation: `node ~/Documents/career-ops/scripts/run-council.mjs` with explicit `--models` (an empty flag silently falls back to Sonnet-only, so always pass the list). API keys live in career-ops `.env`. Typical full-council run: ~$0.20-0.45.

## Per-job routing

| Job | Primary | Fallback | Notes |
|---|---|---|---|
| Drafting, voice, orchestration | Fable 5 (session) | Opus 4.7, then Codex/OpenAI, Antigravity/Gemini, Grok subscription, then API compatibility fallbacks | Never delegate final voice pass; use the automatic blocker rule if the seat is unavailable |
| X pulse / trend saturation | xai:grok-4-x-search | xai:grok-4-20-multi-agent | Grok is the ONLY live-X source; use before timing any X post |
| Reddit scrape + cited synthesis | Apify → perplexity:sonar-deep-research | xai:grok-4-20-multi-agent | Preserve the Apify run receipt and direct Reddit URLs; never present a model-only claim as a scrape |
| Reddit spend guard | Career Ops `reddit-budget.mjs` | none | `$8` per invocation, `$20` per UTC day, two model legs, 12,000 default output tokens, and two Apify acquisitions per UTC day |
| Deep cited research (pillar essays) | perplexity:sonar-deep-research | xai:grok-4-20-multi-agent | 20-40 min async; kick off early |
| Whole-transcript / video-script ingest | google:gemini-3.1-pro → gemini-3.1-pro-preview | Codex/OpenAI, then Grok subscription where the context fits, then API compatibility fallbacks | 1M+ context; feed raw footage transcripts; preserve the automatic blocker rule |
| Contrarian redraft / headline A-B | openai:gpt-5 | xai:grok-4.3 | Different prior = genuine alternative, not paraphrase |
| Bulk tagging / thread summarization | approved bulk route | google:gemini-3.6-flash → gemini-3.6-flash, then Grok subscription | Keep bulk work on its task-specific route; frontier failover still follows the global order |
| Pre-publish adversarial review | council fan-out (3-7 models) | Opus solo | Each model gets ONE audience lens |

## The council-critique pattern (high-stakes pieces)

1. Fable 5 writes master draft (T0).
2. Fan out in parallel, one lens each:
   - GPT-5: "You are a skeptical HN commenter. Find every claim you'd flag."
   - Grok: "Is this take already saturated on X? Who said it first and better?"
   - Gemini: "You are the newly-AI-enabled reader. Mark every sentence that loses you."
3. Fable 5 synthesizes: accept/reject each finding with rationale, revise.
4. `/content-review` gate, then Mitchell.

Cost: ~$0.30-0.60 per pillar piece. Worth it for Substack/HN; skip for daily X posts.

## What NEVER gets delegated
- Final voice pass (Fable 5 + make-it-sound-like-mitchell skill only)
- Publishing decisions (Mitchell only)
- Claims about Mitchell's own experience (his words, verified against his corpus)

Every receipt and preflight must record both `requested_slot` and `resolved_model`; never infer the actual model from the slot label. How to refresh this: T1. Queries: "<vendor> model lineup <current quarter>", "<model> API pricing"; cross-check IDs against career-ops lib/council.mjs PROVIDERS (the runtime source of truth). Refresh whenever a council call errors on a model ID or a vendor ships a new flagship.
