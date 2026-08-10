# Brief: draft-interview + draft-polish skills (research-first, gate-before-incorporate)

Directive from Mitchell, 2026-07-05 (paraphrased intent): the career-ops `apply-pack-interview` and `apply-pack-polish` skills were built when he was less knowledgeable and he considers them UNRELIABLE as references for this content system. Do NOT adapt or copy them. Instead: investigate, web-search, and use the council of models for deep research to find better-written, more refined skills that serve the same two purposes (conversational interview-driven revision; autonomous polish). Require repository tests, static and security checks, diff checks, and local review skills to pass before implementation or incorporation. Hosted or metered review is neither required nor automatic.

## Pipeline (matches AGENTS.md sourcing policy; no step skipped)

1. **Research (RUNNING):** full 7-model council launched 2026-07-05 ~00:30Z on `docs/research/voice-workflow-sourcing-prompt.md`; output lands at `docs/research/voice-workflow-sourcing-report.json` (deep-research legs can take 20-40 min; log at `docs/research/council-run.log`). Supplement with direct WebSearch during design for anything the council cites that needs verification.
2. **Adjudicate:** run the report through the `dealbreaker` agent (claim classification; unverifiable popularity claims downgraded), producing `docs/research/voice-workflow-sourcing-adjudicated.md`. Verify star counts against the live GitHub Application Programming Interface (API) as was done for the original skill matrix.
3. **Design:** `/agent-architecture` design doc answering, at minimum: adopt vs author per capability; how the interview skill preserves verbatim language (and marks artificial intelligence (AI) bridges); polish-loop termination criteria that structurally prevent the four known failure modes named in the research prompt (runaway loops, fabrication-preserving polish, praise-convergence, voice homogenization); how both integrate with existing surfaces (voice-gates, prompt-eval, /draft-post, /content-review) without duplicating them.
4. **Author** per the design, through the authored-skill flow (AGENTS.md 4b) or community-adoption flow (rule 4) depending on what the evidence says wins.
5. **Test with evidence:** prompt-eval golden cases + a deliberately-pathological fixture per failure mode (e.g., a draft containing a planted fabrication that polish must FLAG not smooth; an interview transcript whose assembly must stay >70% verbatim by diff).
6. **Local quality assurance (QA) gate:** tests, static checks, security checks, diff checks, and local review skills must be clean, or findings remediated, before promotion; ledger rows; Mitchell merges. No hosted or metered reviewer is required.

Generated-audit erratum: `docs/research/voice-workflow-sourcing-report.json` and `docs/skill-sourcing-report.md` preserve the 2026-07-05 council output, including historical Qodo instructions, as audit evidence. Those references are not current policy. This brief and `AGENTS.md` define the current local gate.

## Context the builder session needs

- Mitchell's stated preference ranking for voice control (2026-07-05 conversation): interview-first for pillar pieces (his spoken/typed answers are the raw material; he is an on-camera journalist), draft-first with logged edit-pairs for daily posts, outline mode available. Treat this as the USER REQUIREMENT the research must serve; treat the specific mechanics I sketched earlier this session as a hypothesis for the research to confirm, refine, or replace, not as a decided design.
- Voice hard rules and the publishing gate are unchanged and non-negotiable (CLAUDE.md).
- The career-ops apply-pack skills may be READ to catalog their failure modes (useful as anti-patterns) but must not be used as templates.

## Status

- [x] Research launched (step 1)
- [ ] Report landed + adjudicated
- [ ] Design doc
- [ ] Author + test
- [ ] Local-gate-clean pull request (PR) + Mitchell merge
