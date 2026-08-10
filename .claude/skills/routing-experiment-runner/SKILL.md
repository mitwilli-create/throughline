---
name: routing-experiment-runner
description: Run a reproducible three-tier model-routing experiment against a real git commit, with a baseline-only frontier tier and isolated cheap-cloud and local replays. Use when deciding which model tier should handle a task class, validating a cheap or local model before routing work to it, producing private field-report evidence, or when the user asks to run or grade a routing experiment. Enforces path containment, private-by-default artifacts, explicit cloud-transport authorization, atomic per-tier locks, provider provenance, incremental persistence, and a local-memory preflight.
---

# Routing Experiment Runner

Model-routing claims need reproducible evidence. This skill takes work that already shipped, records the shipped commit as the frontier baseline, replays the same task through eligible candidate tiers, and grades the replayed outputs against that baseline.

The historical 2026-07-16 experiment is provenance, not a current safety baseline. Its ignored artifacts may exist in the private workspace at `drafts/china-llm-routing/experiment/`, but they are not part of this skill package and do not satisfy the current path, privacy, locking, or provider-provenance contract. A new run must satisfy this document from its first artifact.

## Build versus adopt ruling

Official documentation was reviewed on 2026-08-09. [Promptfoo providers](https://www.promptfoo.dev/docs/providers/) and [structured outputs](https://www.promptfoo.dev/docs/configuration/outputs/) cover broad multi-provider evaluations and exportable results. [Inspect](https://inspect.aisi.org.uk/) and its [evaluation logs](https://inspect.aisi.org.uk/eval-logs.html) cover composable evaluations, sandboxing, and structured evaluation logs. [LiteLLM](https://docs.litellm.ai/) covers a unified provider interface, routing, retry, fallback, load balancing, cost tracking, and observability.

The current search also covered official GitHub repository metadata and relevant package registries using sanitized generic terms and no private identifiers. Official GitHub application programming interface (API) metadata recorded on 2026-08-09 Pacific Daylight Time showed [Promptfoo](https://github.com/promptfoo/promptfoo) at 24,091 stars and 2,172 forks, [Inspect AI](https://github.com/UKGovernmentBEIS/inspect_ai) at 2,514 stars and 641 forks, and [LiteLLM](https://github.com/BerriAI/litellm) at 55,981 stars and 10,452 forks. These are bounded adoption signals, not measured ratings or download counts.

The community-first search on 2026-08-09 used only sanitized generic terms such as `large language model evaluation routing framework` and `promptfoo inspect ai litellm large language model evaluation routing`. It searched [X](https://x.com/hashtag/promptfoo), [Reddit](https://www.reddit.com/r/LangChain/comments/1b064fb/), [Hacker News](https://news.ycombinator.com/item?id=40922739), [Discord discovery](https://discord.com/servers/megallm-ai-1311631228453130250), developer forums including [Stack Overflow](https://stackoverflow.com/questions/79600690/how-to-set-a-system-prompt-for-a-litellm-prompt-provider) and Dev.to, and package registries including [npm](https://www.npmjs.com/package/promptfoo), [Inspect on Python Package Index](https://pypi.org/project/inspect-ai/), and [LiteLLM on Python Package Index](https://pypi.org/project/litellm/). No repository name, task text, private identifier, or private artifact entered a query. These surfaces showed active evaluation, routing, and provider-integration tools and discussion. They were used to compare documented capabilities, not to infer ratings, downloads, or a universal absence.

Those signals strengthen the case to adopt established components when they fit. Build this narrow workflow integration because no built-in combination documented in those sources matched the audience-specific boundary required here: a merged git commit as a baseline-only Tier 1, private ignored artifacts, exclusive per-run locks, explicit authorization for private transport, verified OpenRouter selected-endpoint provenance, and a local-memory refusal gate in one skill. This is a scoped integration finding, not a claim that the established tools lack their documented capabilities.

## Tier contract

| Tier | Execution | Result representation |
|---|---|---|
| Tier 1, frontier | Baseline-only. Read the shipped commit locally and do not replay or send the task to a model. | One baseline row per task, labeled `baseline-only`, plus the reference diff and files. |
| Tier 2, cheap cloud | Replay the verbatim task through one runtime-verified OpenRouter model and one explicitly allowed provider. | One replay row per task, with requested and resolved model/provider provenance. |
| Tier 3, local | Replay the same verbatim task through one runtime-verified local Ollama model after the memory preflight. | One replay row per task, or a refused row with the preflight reason. |

Only Tier 2 and Tier 3 are replay tiers. Tier 1 is baseline-only and not replayed. It is never fed a prompt and is never counted as a fresh model run. Its cost, latency, and provider fields are `not_applicable`, not zero.

Web-verify model identifiers, provider identifiers, availability, and price at run time because they change. Record the verification date and sources in the private run log. Never silently substitute a model, provider, quantization, or tier.

## Mandatory boundary before any artifact

Every run must supply exactly the three distinct tiers in the table above. Reject a subset, duplicate, or extra tier before any callback, directory creation, file write, or lock attempt. All three tiers, including Tier 1 baseline-only artifacts, must then cross the same path, privacy, and lock boundary before any artifact is written. Only Tier 2 and Tier 3 may invoke a model. The canonical `outputs` and `.locks` directories are empty boundary infrastructure and may be initialized during this boundary. No `tasks.md`, `log.md`, baseline file, refusal record, tier-result directory, request, or response may be created before the boundary completes.

### 1. Classify transport and publication

1. Treat repository visibility as private unless a live proof callback confirms the exact input commit and every transmitted input are public. A caller-supplied `public` label is not proof.
2. Invoke an available credential scanner over the exact task bytes and source inputs before the live public-proof callback, any other remote request, or any artifact. Snapshot caller byte arrays immediately. For a canonical regular-file location, open without following symbolic links, capture complete bytes once, and require stable device, inode, size, and timestamps across the read. Pass each source's repository, immutable commit identifier, relative path, complete snapshotted bytes, and canonical location when applicable to the scanner callback. Give each callback its own copy so it cannot mutate the canonical snapshot. For private input, this identity and path list must match the separately recorded private-input identity exactly. Require a schema-version-`1` success receipt that repeats the exact task identifier, visibility, task bytes, private-input identity or null, and complete source list. A missing callback, thrown error, Boolean or broad success, omitted source, mismatched receipt, incomplete result, or finding is a hard stop. Never transmit credentials, authentication headers, tokens, personal account data, or unredacted personally identifiable information (PII).
3. Require a nonempty source list for both visibility classes. Each entry must have a valid repository identity, immutable 40- or 64-character hexadecimal commit, contained relative path, and exactly one of complete bytes or a canonical resolvable regular-file location. Reject duplicates, mutable references, traversal, missing content, and mixed byte/location claims.
4. Tier 1 and Tier 3 keep inputs local. Tier 2 accepts public inputs or private inputs with explicit transport authorization only. It may transmit inputs when either:
   - the live public-proof callback returns schema version `1`, visibility `public`, the exact task bytes, and a source list that matches every repository, commit, path, and byte sequence or canonical location; or
   - the user gives a structured authorization record with schema version `1`, the exact private repository, immutable commit identifier, complete relative path list, and destination `OpenRouter`. The record must match the separately recorded private-input identity field-for-field.
5. A missing, thrown, Boolean, broad, incomplete, or mismatched public proof fails closed. A Boolean, broad instruction, record for different content, or private input without its exact authorization also fails closed. Invalid supplied authorization stops the run. Absent private authorization marks Tier 2 as `refused-no-transport` in memory, makes no request, and writes no artifact until the remaining path and lock checks complete.
6. After the complete three-lock boundary, mint one opaque Tier 2 transport capability from the exact successful scan plus public proof or private authorization. Derive the request message from the scanned task and source bytes inside that capability. A caller-supplied transport string, caller-supplied replacement message, forged capability, released or replaced lock, or capability from another run fails before request construction. Keep lock identity in private immutable state rather than mutable objects returned to the caller.
7. Every artifact is private by default, including prompts, repository content, full application programming interface (API) responses, provider metadata, grading notes, latency, and absolute cost. Publication is a separate, later action described below.

### 2. Validate names and containment

Choose one existing, trusted experiment root. Before any `mkdir`, file write, or lock attempt, inspect the supplied root itself with `lstat`, require a real current-user-owned directory with mode `0700`, resolve it with `realpath`, and require the supplied path to equal that canonical value. A failed root check must leave no `outputs`, `.locks`, or artifact side effect. Use the validated canonical value for every later check.

- Task and tier identifiers must match `^[a-z0-9]+(?:-[a-z0-9]+)*$`. Reject, rather than normalize, path separators, dot segments, absolute paths, empty values, Unicode lookalikes, and every other value.
- The output root is the literal direct child `<experiment-root>/outputs`. Create it with mode `0700` only if its canonical parent is the experiment root. Use `lstat` on every existing path component and reject symbolic links (symlinks) or non-directories.
- Resolve each proposed tier directory with the platform path library before acquiring locks. Its parent must equal the canonical output root and its relative path must be exactly one segment. Inspect an existing entry with `lstat` and reject a symbolic link, non-directory, wrong owner, permissive mode, different device, or noncanonical target. Reject an existing directory as a collision unless the user supplied an exact resume run identifier. At this pre-lock stage, validate only the path and resume record structure. Do not trust or hash the manifest yet.
- The lock root is the literal direct child `<experiment-root>/outputs/.locks`. Create it with mode `0700`, then verify with `lstat` that it is a real directory, owned by the current user, not a symbolic link, and canonically contained as that exact direct child. Reject permissive modes, a different owner, a different device, or any containment ambiguity.
- Invoke the real `git check-ignore` command over the experiment root and every proposed artifact before writing. Keep that complete ordered path set in immutable internal state, give the callback a separate copy, and compare its result only with the immutable expectation. Require a schema-version-`1` receipt that repeats the exact canonical root and every checked path in order. A missing callback, Boolean or broad success, error, incomplete or mismatched receipt, path outside a Git worktree, or nonignored path stops the run. Fix the storage location or ignore rule before retrying.

### 3. Acquire crash-safe locks

Pre-acquire one lock for each task/tier pair in a stable sorted order before writing shared artifacts. This includes the Tier 1 baseline. After every lock is acquired and while all remain held, validate each resumed tier's manifest schema, exact run identifier, artifact paths, and hashes. This ordering prevents `ownerForTier`, another runner, or a concurrent filesystem mutation from changing resume artifacts between verification and lock ownership. Release all acquired locks if any later acquisition or boundary check fails.

For `<task>-<tier>`, use final lock `outputs/.locks/<task>-<tier>.lock` and a unique temporary lock in that same directory.

1. Open the temporary file with exclusive creation, no symbolic-link following, and mode `0600`.
2. Write complete owner metadata before exposing the lock: numeric schema version `1`; nonempty string run identifier, task, tier, hostname, and process-start token; positive integer process identifier (PID); nonnegative integer current-user identifier equal to the current user; and a valid Coordinated Universal Time timestamp ending in `Z`. Require the timestamp to round-trip through the date parser to the exact original string so impossible calendar dates cannot normalize into validity. Reject wrong types. End the canonical JavaScript Object Notation (JSON) record with a newline.
3. Flush the complete owner metadata with `fsync`, close the temporary file, and verify it is a regular `0600` file owned by the current user on the same device as `.locks`.
4. Atomically call `link(temp, final)`. A successful hard link owns the lock. `EEXIST` means another owner already holds or held it, so do not start the tier.
5. Flush the `.locks` directory after a successful link. If that flush or any later validation fails before ownership is returned, re-check that the final device and inode still match the just-linked temporary file, unlink only that exact final lock, and include its directory flush in cleanup. On every success or failure path, attempt all applicable temporary-handle close, exact failed-final removal, unique-temporary removal, and directory-flush operations even when one fails. Return one aggregate containing the primary error plus every cleanup error. A crash before `link()` can therefore leave only an unexposed temporary file, never an empty final lock.

Temporary file cleanup is mandatory on every success and failure path.

On `EEXIST`, inspect the final entry without following links. Stop on a symbolic link, non-regular file, wrong owner, permissive mode, remote hostname, or unverifiable process identity. Do not accept a caller's Boolean stale assertion. Compare the recorded hostname with the current host, then use the operating system process lookup to obtain the recorded PID's current start token. The lock is live when the token matches, and proven stale only when the PID is absent or its nonempty token differs. A remote hostname, lookup error, malformed result, or legacy metadata fails closed and is never quarantined automatically.

Never unlink a suspected stale lock. Atomically rename a proven stale lock to `<name>.stale.<timestamp>.<nonce>`, then re-read it without following links and require the device, inode, and run identifier to match the inspected entry. A mismatch is a race and stops reacquisition. Flush `.locks`, then reacquire from a new complete temporary file. If the rename races or fails, stop or retry the entire inspection a bounded number of times. The rule is stale rename, verify, then reacquire, never stale delete then continue.

Keep the acquired lock's device, inode, and run identifier in memory. Before release, verify the final lock still matches them, flush every completed artifact and its directory, unlink only the verified owned lock, and flush `.locks`. Preserve quarantined stale locks as private audit evidence.

If any later boundary step fails, attempt release of every acquired lock in reverse order even when one release fails. Return one aggregate failure containing the original boundary error and every release error. Never abandon later cleanup attempts after the first cleanup error.

## Procedure

### 1. Select and extract ground truth read-only

- Choose a real, already-merged commit with a clear diff and an unambiguous expected result.
- Use only read commands against the real repository:
  - `git show <ground-truth>^:<file>` is the before-state replay input.
  - `git show <ground-truth>:<file>` is the after-state reference.
  - `git show <ground-truth>` is the expected diff.
- Copy those bytes into the private experiment root only after the boundary and Tier 1 lock succeed. Never create replay branches or scratch files in the live repository.
- Record Tier 1 as `baseline-only`, with the commit identifier and reference hashes. Do not invent model, provider, latency, usage, or cost values.

### 2. Design tasks before replay

Write each task once, byte-for-byte, in `tasks.md`. The same task bytes are referenced by the Tier 1 baseline and sent to each authorized replay tier. Tier 1 records the task but does not send it anywhere.

Include at least:

- one mechanical task, such as applying the same markup across multiple files;
- one judgment task with deliberate exceptions; and
- a predeclared watchlist of the exact failure modes that grading will check.

Predict the watchlist before any replay. Post-hoc grading criteria are not evidence.

### 3. Configure and prove OpenRouter routing

Before constructing an authorized Tier 2 request, require the live opaque transport capability described above, then invoke a live OpenRouter route-verification callback. Require a structured schema-version-`1` success record naming destination `OpenRouter`, exactly one nonempty model identifier, exactly one nonempty provider identifier, and a valid Coordinated Universal Time verification timestamp that round-trips to the exact calendar string. The verified identifiers must exactly match the requested identifiers. Missing, thrown, broad, empty, impossible-date, or mismatched verification stops before policy construction. Re-read every captured lock identity after the awaited verification callback and immediately before construction. Construct one immutable request from the snapshotted bytes, omit local absolute locations from the transmitted source records, mark that exact object as runtime verified in private state, and set this exact provider policy:

```json
{
  "provider": {
    "order": ["<provider-id>"],
    "only": ["<provider-id>"],
    "allow_fallbacks": false,
    "data_collection": "deny",
    "zdr": true
  }
}
```

Here, `zdr` requests zero data retention (ZDR). These controls supplement the explicit transport decision; they never replace it. If the requested provider cannot satisfy collection denial and ZDR, the request must fail rather than fall back.

Send `X-OpenRouter-Metadata: enabled` on the Hypertext Transfer Protocol (HTTP) request. Keep the authorization header out of every log and artifact.

Before accepting, applying, grading, or persisting a response as a result:

1. Require `openrouter_metadata.endpoints.available` to be present and require exactly one endpoint entry whose `selected` value is `true`, with nonempty reported model and provider strings.
2. Persist the selected entry's reported display values as `model_resolved` and `provider_used`. Persist the requested slugs separately as `model_requested` and `provider_requested`. Display names and resolved aliases may legitimately differ from requested slugs, so never require string equality between those fields.
3. Prove the allowed route separately. A success receipt requires the same privately branded immutable request returned by the live construction step; a structurally similar caller-built object is not proof. Persist the complete request policy in `route_proof`, including `order`, `only`, `allow_fallbacks`, `data_collection`, and `zdr`. When OpenRouter documents and returns a stable endpoint identity that was constrained in advance, require that identity to match and record it. When no documented stable mapping exists, keep request-policy proof separate from selected display metadata rather than inventing an equality check.
4. Fail closed on absent, malformed, or ambiguous selected metadata; invalid request-policy proof; or a mismatch in any documented stable identity actually used. Do not infer provider identity from model or provider display strings, response price, or aliases.
5. A cache hit that lacks this metadata must fail closed with no receipt. Do not apply or grade its content. After the lock boundary, record only the bounded failure code `provider_metadata_missing`; do not persist the unproved response as a valid result.

### 4. Run only the replay tiers

For Tier 2 and Tier 3 only:

1. Feed the verbatim task to that tier after its boundary and lock succeed.
2. Apply the accepted output to a scratch copy of the before-state files, never the live repository.
3. Grade each file against the Tier 1 reference:
   - `pass`: byte-exact or predeclared semantically exact;
   - `partial`: correct intent with a placement, formatting, or conditional error; or
   - `fail`: missed file, unsafe extra mutation, or inverted exception.
4. Record exact counts plus a plain-language failure mode. Keep refused and failed tiers in the matrix rather than dropping them.

### 5. Persist private artifacts incrementally

After every tier path, privacy decision, lock, and resume check succeeds, mint an unforgeable publication capability for each tier plus a shared root capability backed by all three locks. Snapshot immutable device, inode, run identifier, task, and exact tier values into private capability state, and return only immutable lock handles. Before every artifact publisher runs, require the capability to match the canonical destination scope and re-read the associated final lock or locks without following links. Re-run the same ownership check after the temporary file is flushed and every awaited caller hook returns, immediately before the hard link. Every captured identity field must still match, including each shared capability lock's tier. An absent, forged, mutated, wrong-scope, released, replaced, or revived capability fails before publication.

Within that capability boundary, require the canonical run or tier root and every existing directory component to be real `0700` directories owned by the current user on one device. Use the lock protocol's exclusive publication sequence: create one unique `0600` temporary file without following symbolic links, write and flush the complete bytes, close and validate it, then hard-link it to the destination. `EEXIST` is a collision and leaves the destination unchanged. Flush the destination directory after linking. On every path, attempt temporary close when still open, unique-temporary removal, and directory flush, and aggregate every cleanup failure with the primary error.

Never use an ordinary rename for artifact publication, never unlink or replace an existing destination, and never retry a collision as an overwrite. Direct partial writes are not valid artifacts.

```text
outputs/<task>-tier-1-baseline/
  prompt.md
  reference.patch
  reference/
  grading.md
  meta.json

outputs/<task>-tier-2-cloud/
outputs/<task>-tier-3-local/
  prompt.md
  response_raw.json
  response_content.md
  applied/
  grading.md
  meta.json
```

Directories are mode `0700`; files are mode `0600`. `response_raw.json` is the full accepted response after provider provenance validation, never a credential-bearing request. `meta.json` records tier, execution mode, requested and resolved model/provider, wall-clock duration, usage, private absolute cost, HTTP status, finish reason, transport authorization basis, run identifier, and artifact hashes.

Publish the manifest through the same exclusive hard-link protocol. On resume, acquire all required locks, including any stale-lock reacquisition through the quarantine procedure, before reading or trusting resume contents. While every lock remains held, require the exact run identifier and manifest schema, and inspect every component of the manifest and artifact paths with `lstat`. Reject symbolic links, non-directories in intermediate components, non-regular artifact files, owner or device changes, noncanonical paths, and targets outside the run root. Only then verify every recorded artifact hash and continue from the first missing artifact. Refuse a run-identifier, manifest, path, or hash mismatch. Never overwrite a completed artifact or trust presence without hash validation.

## Local-tier random access memory preflight

Run this hard gate before Tier 3:

1. Read the model's resident size from `ollama list`.
2. Read physical random access memory (RAM) from `sysctl -n hw.memsize`.
3. Read current available memory from `memory_pressure` or `vm_stat`.
4. Reserve 6 to 8 gigabytes (GB) for the operating system and active applications:
   - refuse when the model is larger than physical RAM minus the reserve;
   - warn and require an explicit proceed decision when it fits physical RAM but exceeds currently available memory; or
   - continue when it fits current available memory.
5. Set a 15 to 20 minute wall-clock deadline when the runner does not stream. Stop early if central processing unit (CPU) use collapses while page-ins climb, and record `refused-memory` or `stopped-memory-pressure`.

The historical local run produced no output after sustained memory pressure. That is historical capacity evidence only. The current preflight result is the evidence for a new run.

## Privacy and publication boundary

- Raw prompts, source files, API responses, provider metadata, grading, absolute costs, and logs stay private and ignored.
- Run the credential scanner again over every artifact. A scanner failure or finding blocks completion and publication.
- Redact secrets, personal data, private repository content, raw provider metadata, and absolute costs into a separate sanitized report. Review the sanitized report directly before publication.
- Public copy may use relative cost comparisons and percentages derived from private values. Never publish from `response_raw.json`, `response_content.md`, `grading.md`, `meta.json`, or `log.md` directly.
- Publishing, uploading, or sharing any report requires a separate explicit user action. Completing the experiment does not authorize publication.

## Definition of done

- The exact three-tier set and trusted experiment root are validated with zero side effects. The run then has successful exact-input credential-scan and ignore checks before the three per-tier paths, privacy decisions, and atomic locks complete without artifacts.
- `tasks.md` contains the verbatim tasks and predeclared watchlists.
- Tier 1 has baseline-only artifacts and is not represented as a replay.
- Each authorized replay tier has private incremental artifacts, grading, and provenance. Refused tiers have bounded reasons.
- Tier 2 has a live exact identifier-verification record, one selected endpoint with nonempty resolved display metadata, and separate allowed-route proof from the exact request policy or a documented stable identity. Missing identifier verification, metadata, route proof, or an unproved cache hit has no success receipt.
- `log.md` contains the complete matrix, verification date, sources, durations, exact file counts, and failure modes.
- The credential scan and, for public input, exact live public proof pass. Artifact paths and hashes verify, every publisher holds a matching completed-boundary capability, every owned-lock release is attempted, temporary cleanup failures are aggregated, and verified stale-lock quarantines are retained.
- A one-line routing verdict exists per task class. No public artifact is created without a separate sanitization and publication review.
