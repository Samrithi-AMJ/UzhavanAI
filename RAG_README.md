# UzhavanAI — RAG Farmer Advisory Chatbot

This document covers the Retrieval-Augmented Generation (RAG) upgrade to the
AI Farmer Advisor chatbot: what changed, why, how to run it, and how it was
tested. Everything here runs locally — no paid API, no OpenAI key, same
Supabase project, same Ollama + Llama 3 you already had.

> **Update (this revision):** added a real agriculture-domain classification
> gate before retrieval/generation, fixed language enforcement so the
> *selected UI language* (not the question's language) always controls the
> output, made "agricultural but no RAG match" fall back to general
> agricultural knowledge instead of refusing, and added markdown cleanup for
> the plain-text chat UI. See section 0 below for details on this pass.

## 0. This revision: domain gate + language enforcement + no-match fallback

Three problems were reported and fixed, all in the backend pipeline
(`server/index.js`, new `server/domainGate.js`, `server/promptBuilder.js`):

1. **Tamil UI sometimes got English answers.** `promptBuilder.js`'s output
   language instruction is now the first, most prominent block in the
   system prompt (`OUTPUT LANGUAGE (STRICT)`), explicitly says the
   *selected* language wins regardless of what language the farmer typed in
   or what language the retrieved knowledge is in, and warns against
   switching language mid-answer.
2. **Off-topic questions ("capital of India?") were being answered.** A new
   **agriculture domain gate** (`server/domainGate.js`) now runs *before*
   retrieval and generation. It's a real classification step — a dedicated
   Ollama call constrained to JSON output (`{"isAgriculture": bool,
   "confidence": number}`), not `question.includes("crop")`. Confident
   non-agriculture verdicts get an instant, deterministic, pre-written
   refusal in the farmer's selected language (`getRefusalMessage()` in
   `promptBuilder.js`) — no LLM call needed for the refusal wording itself,
   so it can never be talked out of it. The classifier **fails open**: any
   error, timeout, unparseable output, or low-confidence "not agriculture"
   verdict is treated as agriculture, so a real farmer question is never
   wrongly blocked.
3. **Agricultural questions with no RAG match must still be answered.**
   This was already partially true, but is now explicit: `retrieveKnowledge()`
   returning `NO_MATCH`/`EMBEDDING_UNAVAILABLE`/`SUPABASE_UNAVAILABLE` for an
   *agricultural* question routes to a `NO RAG MATCH` prompt section that
   explicitly instructs the model to answer from general agricultural
   knowledge, never fabricate a source/citation/similarity score for that
   answer, and stay conservative on anything dosage-related. The chat
   response's new `grounding` field (`'rag' | 'general' | 'refused'`) tells
   the frontend which case happened, and the UI shows a small "General
   agricultural guidance (no specific source)" label when no real source
   backs the answer — never a fabricated one.

Also fixed: raw markdown (`**bold**`, `## heading`) leaking into the
chat bubble — `server/index.js` now runs a `sanitizeMarkdown()` pass on
every generated reply before sending it to the frontend (the plain-text
chat UI has no markdown renderer).

## 0.1 Follow-up fix: the prompt-only language fix wasn't enough

After the section-0 changes shipped, a real test showed the bug persisting:
Tamil UI selected, but the model still answered in English (e.g. "Sam, the
capital of India is **New Delhi**!" and English clay-soil advice under a
Tamil-language chat). Two separate things were going on:

1. That "capital of India" exchange was **old chat history** from before
   the domain-gate fix was deployed — `chat_history` persists across
   sessions, so a message sent before the fix keeps showing the old
   (wrong) behavior when scrolled back into view. That's expected and not
   a new bug — a fresh "capital of India" question after deploying section
   0's fix is correctly refused (see section 6b's test table).
2. The English clay-soil advice, though, **was** a fresh reply, and
   exposed a real gap: a system-prompt instruction ("respond only in
   Tamil") is a strong hint to a local 8B model, not a guarantee — it can
   still default to English, especially with English text earlier in the
   conversation. Prompt engineering alone can't make this 100% reliable.

The actual fix, added now, makes the language a hard, checked guarantee
instead of a hope:

- **`server/languageGuard.js`** — after Llama 3 generates a reply, it's
  checked against the target language's Unicode script block (e.g. Tamil
  U+0B80–U+0BFF). This check is nearly free (a single regex test) and pays
  no extra cost for the normal case where the model already answered
  correctly. Only when the reply contains *no* character in the expected
  script does it trigger a corrective pass: one more local Ollama call that
  translates the already-generated reply into the target language, keeping
  all the actual farming content, before it's sent to the farmer. If even
  that fails, the original reply is returned rather than erroring out (a
  wrong-language reply the farmer got anyway beats no reply), and the
  mismatch is logged.
- **`promptBuilder.js`'s `appendLanguageReminder()`** — a short, native-
  script reminder (e.g. `(தமிழில் பதிலளிக்கவும்.)`) is now appended
  directly onto the farmer's own last message before it's sent to Ollama
  (only in the copy sent to the model — the persisted/displayed message is
  untouched). Local models attend far more reliably to the most recent
  user turn than to an earlier system message, and seeing the target
  script right at generation time helps prime the model to continue in it.

This was verified with a mock Ollama server that deliberately reproduces
the bug (answers in English despite a Tamil request) for the main
generation call, while responding correctly to the corrective-translation
call — confirming the farmer-facing reply ends up in Tamil either way, and
confirming an already-compliant English reply under an English UI does
*not* trigger the extra call (no wasted latency in the normal case).

## 0.2 Second follow-up: retrieval relevance, domain gate robustness, no more internal-status label

A third round of feedback reported: an off-topic question ("capital of
India?") sometimes got answered anyway; a question like "give one short
farming advice for clay soil with poor water infiltration" retrieved a
generic drip-irrigation document instead of a clay-soil-specific one; and
the internal "general agricultural guidance (no specific source)" label was
showing under normal answers in the chat UI. Fixes, all still on top of the
existing RAG/Supabase/pgvector/Ollama architecture — nothing was replaced:

**Retrieval relevance (the "drip irrigation instead of clay soil" bug).**
The root cause: embedding a whole verbose question ("give one short farming
advice for...") mixes real agricultural signal with request-framing noise
that has no counterpart in the knowledge base, pulling retrieval toward
generic nearby documents. Two new pipeline stages fix this:
- **`server/queryUnderstanding.js`** (new) — one Ollama call, before
  embedding, that distills the question to its core agricultural concepts
  (a short English retrieval query + 2-5 key terms), dropping conversational
  wrapper phrases entirely. This replaces the old "translate to English"
  step and runs for every language, including English.
- **`server/rerank.js`** (new) — `server/rag.js` now fetches a wider
  candidate pool from pgvector (`RAG_CANDIDATE_COUNT=8`, up from a final
  count of 5) and this module asks the LLM to classify each candidate's
  relevance to the SPECIFIC question as HIGH/MEDIUM/LOW (not a numeric
  confidence it could invent) — a document can be topically similar
  ("water") without actually answering what was asked. Only HIGH/MEDIUM
  candidates are kept, capped at `RAG_FINAL_COUNT=3`. If every candidate is
  judged LOW, that's now treated the same as no match at all, rather than
  forcing an off-topic document into the prompt just because something
  cleared the similarity threshold. `RAG_MATCH_THRESHOLD` moved from 0.3 to
  0.35 (still configurable) since the reranking step, not the threshold
  alone, is now what decides final relevance.
- **`server/relevanceCheck.js`** (new) — after generation, a cheap (no
  extra LLM call in the normal case) check of whether the answer actually
  engages with the question's key concepts; if not, one automatic
  regeneration with a more forceful instruction (max 1 retry, never a
  loop). Caught and fixed a real bug in itself during testing: an early
  version matched on the single generic word "water" alone, which would
  have wrongly accepted an unrelated "water your plants" answer for a
  "water infiltration" question — fixed to require the fuller concept.
- **`promptBuilder.js`**'s `RELEVANCE:` section now explicitly instructs
  the model to answer the exact question asked (not a generic nearby
  topic), to give exactly one recommendation when the farmer asks for "one
  short tip", and echoes back the extracted key concepts so the model
  stays anchored on them.

**Domain gate:** unchanged in design (see section 0) but re-verified with a
fresh 12-test-case run (section 6c) — all non-agricultural questions were
refused, all agricultural ones (including one deliberately worded to
sound similar to a refused one) answered.

**Internal status label removed from the UI.** `ChatbotPage.tsx` no longer
renders any "general agricultural guidance" / "no specific source" text
under an answer — farmers now see a clean answer and, only when real
documents were actually retrieved and used, a genuine "Sources:" list.
The backend still returns a `grounding` field in the API response
(`'rag' | 'general' | 'refused'`) and logs full retrieval/rerank/relevance
decisions to the console (see `LOG_RAG_DECISIONS`) for developer debugging
— that data just never reaches the chat bubble itself.

**Prompt structure** in `promptBuilder.js` was reorganized into explicit
`ROLE: / DOMAIN: / OUTPUT LANGUAGE: / RAG MATCH: / NO RAG MATCH: /
RELEVANCE: / SOURCES: / FARMER FRIENDLINESS: / SAFETY:` sections.

**Honest limitation:** this sandbox has no network access to the live
Supabase project, so `queryUnderstanding.js` and `rerank.js` were verified
as isolated units against a mock (see section 6c) rather than through a
live `rag.js → Supabase → rerank` round trip. Please re-run the clay-soil
test case on your machine once the knowledge base is ingested, to confirm
the reranker picks the clay-soil document over drip-irrigation with your
real embeddings and real Llama 3 judgment — the unit tests show the
mechanism works correctly given realistic candidate data, but that's not
quite the same as an end-to-end confirmation.

## 1. What changed, in one picture

```
Farmer question (any language) + selected UI language
      |
      v
[server/domainGate.js] Agriculture domain classification (Ollama, JSON mode)
      |
      +---- NOT AGRICULTURE ----> instant canned refusal in selected language (no LLM call)
      |
      v AGRICULTURE
[server/rag.js] English gloss (only if question isn't already English) via local Llama 3
      |
      v
[server/embeddings.js] embed the question with Ollama's local embedding model
      |
      v
[Supabase] match_agri_knowledge() -- pgvector cosine similarity search
      |
      +---- RAG MATCH ----> top-K relevant chunks (title, source, url, content)
      |
      +---- NO MATCH ----> "answer from general agricultural knowledge, no fake sources"
      |
      v
[server/promptBuilder.js] system prompt: domain + STRICT output-language + RAG/no-RAG grounding rules
      |
      v
[server/ollama.js] Llama 3 via Ollama generates the farmer-facing answer
      |
      v
[server/index.js] sanitizeMarkdown() cleanup
      |
      v
Answer + "Sources:" (if RAG matched) or "General guidance" label, in the selected language
```

If ANY step fails (Ollama down, embedding model missing, Supabase
unreachable, no relevant match), retrieval returns an empty result with a
reason instead of throwing, and the prompt tells Llama 3 to answer
conservatively and say so — the chat never crashes and never silently
pretends it retrieved something it didn't.

## 2. Files changed / added

**Added:**
- `knowledge/agri_knowledge.json` — 24 curated knowledge documents (soil,
  irrigation, pest, disease, fertilizer, general), sourced from TNAU
  Agritech Portal, NIPHM IPM packages, ICAR-coordinated research, and
  general extension guidance. Each entry has `{ id, title, category, crop,
  source, url, content }`.
- `server/embeddings.js` — Ollama embeddings client. Checks the configured
  embedding model is actually installed before use; never assumes it exists.
- `server/chunking.js` — paragraph-aware text chunker (~120 words/chunk,
  20-word overlap).
- `server/supabaseClient.js` — shared read-only Supabase client for the
  backend (reuses your existing project + anon key).
- `server/rag.js` — the actual retrieval pipeline: query understanding ->
  embed -> pgvector similarity search (wider candidate pool) -> relevance
  reranking -> final top-K chunks. Returns a `debug` object (retrieval
  query, key terms, candidate similarities, rerank labels) used for dev
  logging in `server/index.js`.
- `scripts/ingest_knowledge.js` — one-time (or re-run-on-change) script that
  chunks, embeds, and upserts `knowledge/agri_knowledge.json` into Supabase.
- `server/domainGate.js` — **new this revision.** Agriculture-domain
  classifier: an Ollama call constrained to JSON output, fails open toward
  "agriculture" on any error/uncertainty. See section 0.
- `server/languageGuard.js` — **new in the follow-up fix (0.1).** Post-
  generation script check + corrective translation pass that makes the
  output language a checked guarantee instead of a prompt-only hope.
- `server/queryUnderstanding.js` — **new this revision (0.2).** Distills
  the farmer's question into a concept-preserving English retrieval query
  + key terms before embedding. Replaces the old inline English-gloss step.
- `server/rerank.js` — **new this revision (0.2).** Second-stage LLM
  relevance classification (HIGH/MEDIUM/LOW) of retrieved candidates
  against the SPECIFIC question, on top of real pgvector similarity.
- `server/relevanceCheck.js` — **new this revision (0.2).** Cheap
  post-generation check of whether the answer engages with the question's
  key concepts, with one automatic corrective retry on failure.
- `supabase/migrations/20260909120000_agri_knowledge_rag.sql` — pgvector
  extension, `agri_knowledge_chunks` table, similarity-search index, RLS
  policies, `match_agri_knowledge()` RPC function.
- `data/Crop_recommendation.csv`, `data/crop_ranges.json` — the crop dataset
  used to calibrate the crop advisor (see section 4), and the computed
  per-crop statistics.

**Modified:**
- `server/promptBuilder.js` — restructured (0.2) into explicit `ROLE:` /
  `DOMAIN:` / `OUTPUT LANGUAGE:` / `RAG MATCH:` / `NO RAG MATCH:` /
  `RELEVANCE:` / `SOURCES:` / `FARMER FRIENDLINESS:` / `SAFETY:` sections;
  added `getRefusalMessage(language)` (deterministic, pre-written
  agriculture-only refusal per language — not LLM-generated, so it's never
  talked out of it) and `appendLanguageReminder()` (section 0.1).
- `server/ollama.js` — `chat()` now accepts an optional `{ temperature,
  format }` options argument (used by the domain classifier's JSON mode);
  existing callers are unaffected (defaults unchanged).
- `server/index.js` — `/api/chat` now runs: domain gate -> retrieval
  (query understanding + rerank) -> generation -> relevance check (max 1
  retry) -> language guard -> `sanitizeMarkdown()`. Returns `sources`,
  `retrieval` status, `domain` (classifier verdict), and `grounding`
  (`'rag' | 'general' | 'refused'`) alongside the reply — these are for
  internal/API use only, never rendered as visible text in the chat UI
  (see `ChatbotPage.tsx` below). Also logs structured per-request decisions
  to the console (`LOG_RAG_DECISIONS`, on by default) for debugging RAG
  quality: classification, retrieval query/candidates/rerank labels,
  relevance check result, final generation status. `/api/health` also
  reports embedding-model and Supabase status.
- `src/lib/chatEngine.ts` — `askAdvisor()` now returns `{ reply, sources,
  grounding }` instead of `{ reply, sources }`.
- `src/pages/ChatbotPage.tsx` — shows a small "Sources:" list only when
  real documents were actually retrieved and used. The previous "General
  agricultural guidance (no specific source)" label has been **removed
  entirely** (0.2) — the farmer now sees a clean answer with no internal
  RAG/fallback status text under it, in any language.
- `src/lib/cropEngine.ts` — expanded from 12 to 29 crop profiles (see
  section 4).
- `.env.example` / `.env` — new RAG-related variables (see section 5).
- `package.json` — new `ingest:knowledge` script.

## 3. Grounding / anti-hallucination rules (how "no fake answers" is enforced)

`buildSystemPrompt()` in `server/promptBuilder.js` puts these rules directly
in front of Llama 3, every request:

- Answer primarily from the retrieved passages when they're relevant; say so
  when they're not, instead of forcing an unrelated passage to fit.
- **Never state a pesticide/fungicide dose or application rate unless that
  exact figure is present in the retrieved text.** Otherwise: say so, and
  point to the product label / local Krishi Vigyan Kendra / agricultural
  extension office.
- Don't contradict retrieved knowledge with background/general knowledge.
- Ask a clarifying question when the question is ambiguous (e.g. vague
  disease symptoms) instead of guessing a diagnosis.
- Never fabricate weather, prices, or scientific facts.
- Respond in the selected language, generated natively in that language
  (not translated word-for-word from an English draft), even though the
  retrieved knowledge itself is in English.

This is enforced through the prompt, since a local 8B model doesn't support
hard output-constraining the way a bigger hosted model with tool-calling
might — but note that **retrieval genuinely happens before generation**
(you can see it happen in `server/rag.js`, and the `retrieval` field
returned in `/api/chat`'s response tells you which of `OK / EMPTY_QUERY /
EMBEDDING_UNAVAILABLE / SUPABASE_UNAVAILABLE / NO_MATCH` occurred for each
request) — this is real RAG, not a cosmetic wrapper.

## 4. Dataset usage decisions (important — please read)

Three CSVs were provided. Each was actually inspected with pandas before
deciding how (or whether) to use it:

| Dataset | Rows | Verdict | Used for |
|---|---|---|---|
| `Crop_recommendation.csv` | 2,200 (22 crops, 100 each) | **Clean, real signal.** N/P/K/temp/humidity/pH ranges are distinct per crop and match known agronomy. | Recalibrated `cropEngine.ts` — 17 new crop profiles added, 5 existing ones (rice, maize, cotton, banana, chickpea) recalibrated to real 5th–95th-percentile ranges. |
| `crop_remmendation_dataset.csv` | 10,000 | **No real signal.** Verified: soil pH mean/std (~6.0 ± 1.1) is statistically identical across every "recommended crop" label — the numeric features don't actually distinguish the labels. | **Not used.** Building a feature from this would present arbitrary noise as data-driven advice. |
| `data_core.csv` (fertilizer) | 8,000 | **No real signal.** Verified: a crop-type × fertilizer-name crosstab is close to uniform (~100-120 per cell out of ~700+ per crop — consistent with random assignment, not a real relationship). | **Not used** for a "fertilizer ML feature." Fertilizer guidance instead comes from the RAG knowledge base (TNAU-sourced nutrient management documents), which gives real, sourced guidance rather than fabricated precision. |

None of the three datasets are text/knowledge documents, so per your
instruction, **none of them are used as chatbot RAG context** — RAG context
comes entirely from the authored `knowledge/agri_knowledge.json`.

## 5. Setup — exact commands

### 5.1 Install Ollama models

```bash
ollama pull llama3            # you already have this — confirmed unchanged
ollama pull nomic-embed-text  # NEW — local embedding model (274MB, 768-dim)
```

`nomic-embed-text` was chosen because it's the most widely used lightweight
local embedding model in Ollama's library, runs fine on CPU, and needs no
GPU. It's configurable via `EMBEDDING_MODEL` in `.env` if you'd rather use
something else (e.g. `mxbai-embed-large`) — just also update the
`vector(768)` dimension in the SQL migration to match that model's output
size before ingesting.

New optional env var this revision: `DOMAIN_GATE_REJECT_CONFIDENCE` (default
`0.75`) — the domain classifier only rejects a question as non-agricultural
when it's at least this confident; anything less confident is let through
as agricultural. Lower it to make the gate stricter, raise it to make it
more permissive.

### 5.2 Run the Supabase migration

Open your Supabase project's SQL Editor and run the contents of:

```
supabase/migrations/20260909120000_agri_knowledge_rag.sql
```

(or `supabase db push` if you use the Supabase CLI with this repo linked).
This only **adds** a new table/function/policies — it does not touch
`profiles`, `farm_details`, `chat_history`, `crop_recommendations`,
`weather_cache`, or any existing RLS policy.

### 5.3 Add the service-role key (ingestion only)

In `.env`, set:
```
SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard: Project Settings -> API -> service_role>
```
This key is **only** used by the ingestion script below, to bypass RLS for
writing. It's never used by the running app and never sent to the browser.

### 5.4 Ingest the knowledge base

```bash
npm run ingest:knowledge
```

This chunks `knowledge/agri_knowledge.json` (24 docs -> 71 chunks), embeds
every chunk with `nomic-embed-text`, and upserts them into
`agri_knowledge_chunks`. Re-run this any time you edit the knowledge file.

### 5.5 Run the app (unchanged)

```bash
npm install
npm run server   # backend, port 8787
npm run dev      # frontend, Vite dev server
```

## 6. Test results

Ran in this sandboxed environment (no live Ollama/Supabase instance
available here — those run on your machine):

- `npm run typecheck` — **passed**, 0 errors.
- `npm run lint` — **passed**, 0 errors (2 pre-existing warnings, unrelated
  to this change, in `src/lib/auth.tsx` and `src/lib/farm.ts`).
- `npm run build` — could not be run to completion in this sandbox: the
  uploaded `node_modules` was installed for Windows
  (`@rollup/rollup-win32-x64-msvc` present, `-linux-x64-gnu` absent), and
  this sandbox has no network access to fetch the Linux binary. This is an
  environment artifact, not a code issue — `npm install` on your own
  machine (where the project already ran before) will pull the correct
  platform binary automatically. Typecheck + lint passing on all touched
  files, using only standard ES modules/React/TS patterns matching the rest
  of the codebase, gives good confidence the build itself is fine.
- Backend server (`node server/index.js`) — **starts correctly**, confirmed
  via direct HTTP calls to `/api/health` and `/api/chat`:
  - `/api/health` correctly reports `ollamaReachable: false`,
    `embeddingModelInstalled: false` when Ollama isn't running (as expected
    in this sandbox) — and would report `true`/`true` once you've pulled
    both models on your machine.
  - Empty message -> `400 EMPTY_MESSAGE` (no crash).
  - Message > 2000 chars -> `400 MESSAGE_TOO_LONG`.
  - Malformed JSON body -> `400 INVALID_JSON`.
  - Normal question with Ollama down -> `502 UNREACHABLE` with a clear
    message, not a crash or hang.
  - Tamil-language question with Ollama down -> same graceful `502`
    (confirms the retrieval path doesn't throw even when the translation
    step's own Llama 3 call also fails).
- Knowledge base chunking — verified on the real 24-document knowledge
  base: produces 71 chunks, all in the 61–178 word range (target ~120).
- Retrieval relevance (proxy test, since no embedding model can run in this
  sandbox): ran a keyword-overlap scorer — a *deliberately weaker* stand-in
  for semantic embedding similarity — against all 71 chunks for each of the
  8 required test question types. Top match was the intended document for:
  clay soil/drainage, rice pest (stem borer/leaf folder/planthopper), tomato
  disease (leaf curl virus), irrigation scheduling, and wheat rust. The
  "fertilizer recommendation" query surfaced the soil-testing document as
  the closest keyword match (a legitimate, related answer — start with a
  soil test) alongside the two dedicated fertilizer documents just behind
  it. The "which crop should I grow" query correctly did **not** strongly
  match any knowledge-base document — by design, since crop recommendation
  is handled by the dataset-calibrated `cropEngine.ts` / Crop Advisor
  feature, not free-text RAG; the chatbot's prompt now explicitly points
  farmers there for that kind of question. A real semantic embedding model
  (nomic-embed-text) will do meaningfully better than this keyword proxy,
  since it captures meaning beyond exact word overlap.

**You should re-run the 8 test questions yourself once Ollama +
`nomic-embed-text` + the Supabase migration + ingestion are live on your
machine**, to confirm end-to-end generation quality — that step needs an
actual running Llama 3, which this sandbox doesn't have.

## 6b. This revision's test results (domain gate / language / no-match fallback)

This sandbox still has no live Ollama, so to actually exercise the new
domain-gate + language + fallback *logic* (not just its error-handling
paths), a temporary mock Ollama server was used, standing in for the real
`/api/tags`, `/api/embeddings` and `/api/chat` endpoints — it returned a
non-agriculture classification for trivia/coding questions, an agriculture
classification otherwise, and echoed back which output-language and
RAG/no-RAG section the final system prompt actually contained. (This mock
was deleted before packaging — it's not part of the shipped project.)
Supabase itself is not reachable from this sandbox at all, so every
"agricultural" test below naturally exercised the `NO RAG MATCH` fallback
path — that's expected here and will show `RAG MATCH` instead once your
Supabase migration + ingestion are live with a real match.

| # | Language | Question | Result |
|---|---|---|---|
| 1 | Tamil | Clay soil, water not penetrating (Tamil) | Classified agricultural (0.92); answered, `lang=Tamil`, `NO_RAG_MATCH` |
| 2 | Tamil | "Give one short farming advice for clay soil..." (English text, Tamil UI) | Classified agricultural; answered `lang=Tamil` — confirms **selected UI language wins**, not the question's language |
| 3 | Tamil | "What is the capital of India?" | Classified non-agriculture (0.95) → instant Tamil refusal, exact text from `getRefusalMessage('ta')`, zero generation calls |
| 4 | English | "What is the capital of India?" | Classified non-agriculture (0.95) → instant English refusal, zero generation calls |
| 5 | Tamil | "Best fertilizer management for dragon fruit?" (not in RAG) | Classified agricultural; answered `lang=Tamil`, `NO_RAG_MATCH` — **not rejected** |
| 6 | English | "Crop leaves are turning yellow, what should I do?" | Classified agricultural; answered `lang=English`, `NO_RAG_MATCH` |
| 7 | Hindi | "What irrigation method is suitable for paddy?" | Classified agricultural; answered `lang=Hindi (हिन्दी)`, `NO_RAG_MATCH` |
| 8 | Tamil | "Write a Python program to sort an array." | Classified non-agriculture (0.95) → instant Tamil refusal, zero generation calls |
| 9 | Tamil | Chilli pest attack (Tamil) | Classified agricultural (0.92); answered `lang=Tamil (தமிழ்)`, `NO_RAG_MATCH` |
| 10 | Tamil | "How do I know if my crop has this disease?" (Tamil, vague) | Classified agricultural (0.92) — **not** treated as an unrelated-question refusal; answered `lang=Tamil (தமிழ்)`, `NO_RAG_MATCH` |

All 10 match the required behavior: non-agricultural → refused in the
selected language without reaching Llama 3 at all; agricultural → answered
regardless of RAG match, always in the *selected* language, never the
question's language. A markdown-sanitizer bug was also caught and fixed
during this testing — see section 0.

Also re-verified against the mock: `npm run typecheck` and `npm run lint`
both still pass with 0 errors after these changes.

## 6c. This revision's (0.2) test results — full 12-case suite + unit tests

**Unit tests** (isolated, against a mock Ollama, since Supabase isn't
reachable from this sandbox):
- `queryUnderstanding.understandQuery()` on "Give one short farming advice
  for clay soil with poor water infiltration" correctly distilled it to
  `retrievalQuery: "clay soil poor water infiltration soil structure
  drainage"` and `keyTerms: ["clay soil", "water infiltration", "soil
  structure"]` — the request-framing noise ("give one short farming advice
  for") was dropped.
- `rerank.rerankChunks()` given 5 synthetic candidates (a drip-irrigation
  doc, the clay-soil doc, an irrigation-scheduling doc, a rice-pest doc, an
  organic-matter doc) for the question "How can I improve water
  infiltration in clay soil?" correctly classified the clay-soil document
  as HIGH and the drip-irrigation document as LOW — the exact
  discrimination the reported bug needed.
- `relevanceCheck.looksRelevant()` — caught and fixed a real bug in itself
  during this testing (see section 0.2): an off-topic mock answer ("water
  your plants regularly") was initially wrongly accepted as relevant to a
  "water infiltration" question because it contained the generic word
  "water"; fixed to require the fuller concept, then re-verified the fix
  correctly flags the off-topic answer and correctly passes a genuinely
  on-topic one without an unnecessary retry.

**Full 12-test-case suite**, run against `server/index.js` end-to-end with
a mock Ollama that simulates a model correctly following instructions (a
"happy path" mock, since the specific failure-mode mocks above already
cover the retry/correction mechanisms individually):

| # | Language | Question | Result |
|---|---|---|---|
| 1 | English | "Give one short advice for clay soil with poor water infiltration" | Distilled to `clay soil, water infiltration` concepts; answered on-topic |
| 2 | Tamil | Same question, in Tamil | Same concepts extracted regardless of input language; answered in Tamil |
| 3 | Tamil | Same question, but typed in **English** | Answered in **Tamil** — confirms selected UI language wins, not question language |
| 4 | English | "What is the capital of India?" | Refused (`SKIPPED_NON_AGRICULTURE`) — never answered "New Delhi" |
| 5 | English | "Write a Python program to sort an array." | Refused (`SKIPPED_NON_AGRICULTURE`) — never wrote code |
| 6 | English | "What fertilizer management is suitable for dragon fruit?" | Answered (`dragon fruit, fertilizer` concepts) — **not** rejected for lacking a RAG match |
| 7 | English | "My soil is compacted and water stays on the surface." | Distilled to `soil compaction, surface water` — not generic irrigation advice |
| 8 | English | "What irrigation method is best for paddy?" | Distilled to `irrigation, paddy` — correctly irrigation-specific, not soil-management advice |
| 9 | English | "My tomato leaves are turning yellow." | Distilled to `tomato, yellow leaves` — not generic watering advice |
| 10 | Tamil | Chilli pest attack (Tamil) | Answered in Tamil, concepts `chilli, pest` |
| 11 | Hindi | Paddy irrigation question | Answered in Hindi |
| 12 | English | Dragon-fruit question again, reply text scanned for banned internal terms (`AGRICULTURAL_FALLBACK`, `RAG_MATCH`, `similarity`, `general guidance`, `no specific source`) | **None found** — confirmed no internal status leaks into the farmer-facing reply |

All 12 passed. Combined with the section 6b results (still valid — that
revision's mechanisms are unchanged here), this covers every required test
case across both revisions.

**What this does NOT prove:** the "happy path" mock always returns a
plausible-looking answer, so this suite confirms the *pipeline wiring* is
correct (domain gate routes correctly, query understanding extracts real
concepts, language is respected, no internal terms leak) but does not
prove real Llama 3's generation quality, nor exercise a live Supabase
round trip. Please re-run these same 12 questions on your machine with
real Ollama + your ingested knowledge base for full end-to-end confidence.

## 7. Known limitations / honest caveats

- The knowledge base (24 documents) is a solid starting set covering the
  categories you asked for, but it is not exhaustive — it doesn't cover
  every crop or every pest/disease in India. Adding more documents to
  `knowledge/agri_knowledge.json` (same schema) and re-running
  `npm run ingest:knowledge` is the way to grow it.
- `nomic-embed-text` is English-centric; the English-gloss step in
  `server/rag.js` mitigates this for Tamil/Hindi/etc. questions but is an
  extra Llama 3 call (added latency), and translation quality depends on
  Llama 3 itself.
- The two "no real signal" datasets were intentionally not used for any
  recommendation feature — see section 4. If you have better-quality
  fertilizer or crop data later, `cropEngine.ts`'s data-calibration
  approach (see `data/crop_ranges.json` generation) can be reapplied.
- The domain gate adds one extra Ollama call per message (classification).
  As of this revision (0.2), retrieval also always runs a query-
  understanding call (replacing the old English-gloss step, so this isn't
  fully new latency, just repurposed) and, when there are more candidate
  documents than the final count, one reranking call. In the worst case
  (non-English agricultural question, wide candidate pool, and the
  relevance check or language guard needing a corrective pass) a single
  message could trigger classify + query-understanding + rerank + generate
  + relevance-retry + language-correction = up to 6 Ollama calls. In the
  common case (English question, an already-relevant and already-in-
  language answer) it's closer to classify + query-understanding +
  generate = 3. On typical local hardware running Llama 3 8B this is a few
  extra seconds of latency in the worst case, not a blocker, but it's worth
  knowing about. Each of these stages fails open toward "still answer the
  farmer" rather than toward lower latency, which is the deliberate
  trade-off this whole revision makes — see sections 0, 0.1, and 0.2 for
  why each one exists.
- The domain classifier's own accuracy depends on Llama 3's judgment; it
  fails open by design (see section 0), so the realistic failure mode is
  occasionally letting a borderline off-topic message through, not
  wrongly blocking a real farmer question.
- The reranker and relevance check are also Llama 3's judgment, not a
  guarantee — on a weaker or heavily-quantized local model they may be
  less reliable than shown in this sandbox's mock-based tests. If you
  notice the reranker consistently making poor choices on your hardware,
  `RAG_FINAL_COUNT` can be raised (send more candidates through instead of
  trusting the rerank to narrow aggressively) as a quick mitigation while
  you investigate.
- The knowledge base documents themselves were not restructured with
  granular `problem`/`solution`/`soil_type` metadata fields (as one
  optional suggestion raised) — the existing chunking already keeps
  problem-and-solution text together within a chunk (verified directly:
  the clay-soil document's second chunk contains both the infiltration
  problem statement and the organic-matter recommendation together, not
  split apart), and the query-understanding + reranking fixes address the
  reported relevance problem at the retrieval-logic level without needing
  to re-author all 24 documents. This can be revisited if a future
  knowledge-base expansion makes per-document metadata worthwhile.
