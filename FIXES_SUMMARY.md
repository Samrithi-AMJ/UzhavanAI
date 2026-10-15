# UzhavanAI — Complete Debugging & Functional Repair Summary

This covers the language-persistence, translation-completeness, and
Image Search architecture fixes made to the existing project. Nothing was
rewritten from scratch; every change below is a modification to an
existing file (or a small new file alongside existing ones, following the
project's own patterns — e.g. `cropTranslations.ts` already existed, so
`diseaseTranslations.ts` follows the same shape).

## 1. Files modified / added

**Modified:**
- `src/lib/auth.tsx` — language-reset bug (see §2)
- `src/lib/i18n.ts` — added ~25 missing translation keys across all 6 languages
- `src/lib/cropTranslations.ts` — added the 17 crop translations that were missing entirely
- `src/lib/diseaseEngine.ts` — removed the fake `diagnoseImage()`, added `getDiseaseByName()`
- `src/pages/CropAdvisorPage.tsx` — save/delete error handling, double-save race fix, hardcoded label fix
- `src/pages/ImageSearchPage.tsx` — fully rewritten around real backend analysis (see §3)
- `server/index.js` — new `/api/image-diagnosis` route, larger body-size limit for images
- `.env` / `.env.example` — new `VISION_MODEL` config

**Added:**
- `src/lib/diseaseTranslations.ts` — localized versions of all 18 disease/pest reference entries
- `src/lib/imageEngine.ts` — frontend client for the real image-analysis endpoint
- `server/visionModel.js` — Ollama vision-model client (the real analyzer)

## 2. Language reset bug — root cause and fix

**What was wrong:** `auth.tsx`'s `loadProfile()` unconditionally overwrote
the in-memory `language` state with whatever was in the Supabase
`profiles.language` column, every time it ran. The problem: it doesn't
just run at login — Supabase's `onAuthStateChange` fires it again on
token refresh and tab-focus events too. Combined with `setLanguage()`'s
Supabase update call having **no error handling** (a silent failure left
the DB with a stale value, e.g. the `'en'` default from signup), any of
those background auth events could silently snap the language back to
whatever was last successfully written to the database — which explains
"sometimes the selected language displayed but content stayed English"
and "language resets... on refresh."

There was no actual client-side router in this app (page switches are a
local `useState` in `App.tsx`, not URL routes), so pure in-app navigation
between pages was never the direct cause — but a browser refresh (which
*is* one of the explicit test steps) fully remounts `AuthProvider` and
re-triggers exactly this bug.

**The fix (both halves needed):**
1. `loadProfile()` now only adopts the profile's saved language to *seed*
   `localStorage` when this browser/device has no locally-stored
   preference yet (first login on a new device). Once a language is
   chosen locally, no later profile fetch can silently override it.
2. `setLanguage()`'s Supabase write now checks and logs its own errors
   instead of swallowing them, so a real permissions/RLS problem is
   visible in the console during development instead of manifesting only
   as "language randomly resets."

There was already exactly one global language state (via `useAuth()`) —
no competing per-page state existed, so no separate consolidation was
needed there; the codebase was already following the "one source of
truth" pattern correctly. `localStorage` key `agri-lang` was kept as-is
(already existed and already worked) rather than renamed, to avoid
orphaning existing users' saved preference.

## 3. Translation completeness

Two concrete, verifiable gaps were found and fixed:

1. **17 of 29 crops had no translation at all.** A previous session
   expanded `cropEngine.ts`'s crop list from 12 to 29 (using real dataset
   statistics), but `cropTranslations.ts` was never updated to match —
   so any of those 17 crops (pigeon pea, mung bean, mango, coconut, etc.)
   showed fully in English regardless of selected language. This is now
   fixed: all 29 crops have complete name/season/water-requirement/
   growing-period/expected-yield/reason text in all 6 languages.
2. **Disease/pest information had no translation layer at all** — this
   is exactly what the reported screenshot showed ("Brown Spot",
   "Moderate", "Cause", "Prevention" all in English under a Tamil UI).
   `diseaseTranslations.ts` is new: all 18 reference entries, fully
   translated, keyed by the same stable English name used as the lookup
   identity (never a translated string used as identity, per the
   requirement).

Also fixed: `CropAdvisorPage.tsx`'s soil-input slider labels (Nitrogen,
Phosphorus, Potassium, Temperature, Humidity, pH Level, Rainfall) were
hardcoded English literals directly in JSX, never passed through the
translation dictionary — now use `tr.nitrogenLabel` etc.

**What this does NOT change:** technical values themselves (94%, 25°C,
90 kg/ha) were already displayed as raw numbers with unit suffixes, not
translated text — correct behavior, left as-is.

## 4. Image Search — from fake to real (and honest about limits)

**What was wrong (confirmed by reading the code, not assumed):**
`diseaseEngine.ts`'s `diagnoseImage()` computed a hash from the uploaded
image's base64 *characters* — not any visual content — then used
`hash % 4 === 0` to decide "Healthy" (a full 25% of all images,
regardless of what they actually showed), and otherwise picked a disease
*from a list pre-filtered by whatever crop the farmer selected in the
dropdown* with a confidence of `72 + (hash % 23)`. Uploading a photo of a
car, with "Rice" selected, could never return anything but a rice disease
or "Healthy" — the image itself was never examined.

**The fix:** a real analysis pipeline, using a local Ollama vision model
(llava by default, configurable) — the same "never assume a model is
installed" discipline already used for the chat and embedding models
elsewhere in this project:

```
Upload image
   -> server/visionModel.js checks the vision model is actually installed
        -> NOT installed: "image analysis unavailable" (never a fake result)
   -> analyzeImage() sends the real image to the model, asks it to report:
        - is this actually a plant/crop photo?
        - what crop does it look like?
        - healthy / disease-suspected / unclear?
        - what specific issue, if any, and what symptoms are visible?
        - its OWN genuine confidence (never fabricated by our code)
   -> server/index.js derives the UI status from what the model ACTUALLY said:
        NOT_A_PLANT | CROP_MISMATCH | LOW_CONFIDENCE | HEALTHY | DISEASE_DETECTED
   -> if DISEASE_DETECTED and the model's issue name matches one of our
      18 curated reference entries, enrich with full localized detail;
      otherwise show the model's own (still real, still localized) symptom description
```

**Irrelevant-image handling (the specific reported concern):** if the
model reports `isPlantOrCropImage: false`, the status is `NOT_A_PLANT` —
this can never become "Healthy," because "Healthy" is only ever assigned
when the model explicitly reports `visualStatus: "HEALTHY"` on a
confirmed plant image above the confidence floor. Verified directly with
a mock vision server reproducing exactly this case (§6).

**Crop mismatch:** the model identifies what it actually sees,
independent of the dropdown; if the farmer selected "Rice" but the photo
is evidently a different crop, the status is `CROP_MISMATCH`, not a
rice diagnosis forced onto an unrelated photo.

**Confidence:** every confidence value shown is the vision model's own
self-reported number (0-1, from the model's JSON response) — never
computed from a hash or any other fabrication. If the model doesn't
return a usable number, confidence is treated as 0 (lowest), never a
"safe-looking" invented middle value.

## 5. Saved Reports

- **Duplicate saves:** the real cause was a synchronous race, not
  StrictMode or a duplicate `useEffect` — `setSaving(true)` (a React
  state update) doesn't disable the button in the DOM instantly, so a
  fast double-click could fire `saveResults()` twice before the
  `disabled` attribute took effect. Fixed with a `useRef` guard that's
  checked and set *before* any async work starts, closing that window
  regardless of render timing.
- **Silent failures:** `saveResults()`, `deleteHistory()`, and the
  initial history load previously ignored the `{ error }` Supabase
  returns — a failed insert still showed "Saved!", and a failed delete
  still removed the item from the UI as if it had persisted. All three
  now check the error, log full operation/table/user-id/code/message
  detail to the console (never exposed raw to the farmer), and show a
  translated error message; a failed delete rolls the optimistic UI
  update back instead of leaving a false impression.
- **Identity:** reports were already keyed by `rec.id` (React `key`) and
  loaded by the full stored record, not by crop name — this was already
  correct; no change needed there.
- **Schema/RLS:** inspected `crop_recommendations`'s migration —
  `user_id uuid NOT NULL DEFAULT auth.uid()` plus RLS policies scoped to
  `auth.uid() = user_id` on select/insert/update/delete were already
  correctly in place. **No schema or RLS changes were necessary or made.**

## 6. Testing performed

- `npm run typecheck` — **0 errors** (verified after every major change, not just once at the end)
- `npm run lint` — **0 errors** (2 pre-existing, unrelated warnings)
- Backend startup — confirmed clean start; `/api/health` correctly reports
  `imageDiagnosis: { visionModel: "llava", visionModelInstalled: false }`
  in this sandbox (no Ollama here) rather than crashing or faking readiness.
- `/api/image-diagnosis` — tested against a mock vision-capable Ollama
  server covering exactly the required test cases: a diseased-rice photo
  (returns the real identified issue), a genuinely healthy photo (returns
  Healthy), an unrelated non-plant photo (returns `NOT_A_PLANT`, never
  "Healthy"), a wrong-crop photo (returns `CROP_MISMATCH`), a blurry
  low-confidence photo (returns `LOW_CONFIDENCE`, not a guessed diagnosis),
  an empty image field (`EMPTY_IMAGE` error), and malformed JSON
  (`INVALID_JSON` error) — all behaved correctly.
- Vision-model-unavailable path — tested with no mock running at all;
  confirmed a clean `VISION_MODEL_NOT_FOUND` response, never a fabricated
  result.

**Honest limitation:** this sandbox has no Ollama installation at all
(text or vision), so the vision model's actual real-world image
understanding quality (correctly identifying crops, spotting genuine
symptoms) could not be tested end-to-end here — only the *pipeline*
(routing, validation, graceful degradation, translation) was verified,
using a mock that simulates plausible model outputs. **Please install a
vision model and re-run the image tests on your machine** — this is a
capability this sandbox genuinely cannot verify.

## 7. New dependencies

**None.** The vision-analysis feature reuses the same Ollama HTTP API
(`/api/chat` with an `images` field) and the same `@supabase/supabase-js`
client already in the project — no new npm packages were installed.

## 8. Exact commands to run

```bash
# Ollama models (llama3 + nomic-embed-text were already required by the
# existing RAG chatbot; llava is new, for Image Search):
ollama pull llama3
ollama pull nomic-embed-text
ollama pull llava        # or llama3.2-vision / moondream / bakllava

npm install
npm run typecheck   # 0 errors
npm run lint         # 0 errors
npm run server       # backend, port 8787
npm run dev          # frontend, Vite dev server
```

No Supabase migration is required for this round of fixes — the schema
and RLS policies were already correct.

## 8.5 Follow-up fix: overconfident wrong "Healthy" on a non-crop image

After deployment, real testing (with a real `llava` install) surfaced
exactly the kind of failure this architecture is meant to catch but
hadn't yet been guarded against in code: a clearly non-agricultural image
(a stylized city-park rendering) was reported by the vision model as
`isPlantOrCropImage: true`, `visualStatus: HEALTHY`, confidence `0.8` —
**without the model even naming a specific crop** (`identifiedCrop: null`).
The pipeline correctly relayed the model's self-report, but the model's
self-report itself was wrong and overconfident — a known weakness of
smaller/quantized local vision models, which was flagged as a risk in §9
below before this was observed live.

Two changes close this gap:

1. **Stronger prompt** (`server/visionModel.js`) — now asks the model to
   describe the overall scene literally *before* making any judgment
   (chain-of-thought grounding), and gives explicit negative examples for
   exactly this failure mode: parks/gardens/cityscapes with incidental
   greenery, and digital art/AI-generated/stylized renderings, should be
   marked `isPlantOrCropImage: false` even when some greenery is visible.
2. **A real, code-level guardrail** (`server/index.js`) — this is the
   more important fix, because it doesn't depend on the model obeying the
   prompt: if the model couldn't identify a specific crop
   (`identifiedCrop` is null), a `HEALTHY` or `DISEASE_DETECTED` verdict
   is now downgraded to `LOW_CONFIDENCE` regardless of what confidence
   number the model reported. The reasoning: a model that can't even name
   what it's looking at has no real basis for a confident health verdict
   about it, no matter how confident it claims to be.

Verified with a mock reproducing the exact reported failure (same
`identifiedCrop: null`, `visualStatus: HEALTHY`, `confidence: 0.8`
combination) — now correctly returns `LOW_CONFIDENCE` instead of
`HEALTHY`. A control case (genuine healthy rice photo, `identifiedCrop:
"rice"`) was also re-tested to confirm the guardrail doesn't affect
normal, well-grounded results.

**Honest caveat:** this guardrail specifically catches "confident verdict
with no identified subject" — it does not and cannot guarantee the model
never misidentifies an actual crop with a plausible-sounding wrong name,
or never misjudges a real plant's health. That class of error still
depends on the underlying vision model's real-world accuracy, which this
sandbox still cannot evaluate (see §9).

## 8.6 Follow-up fix: "symptom not recognized" was being treated as "healthy"

**Root cause of the bug:** a rice photo with visible yellowing/discoloration
was reported as "Healthy, 70%". Inspecting the pipeline showed this wasn't
a code-level fallback (confirmed by searching the whole project for
patterns like `default status = HEALTHY` or a hardcoded `0.7` confidence —
none existed). The real cause was in the vision model's own reasoning: the
old prompt asked a single binary question ("healthy or diseased?") without
forcing the model to separate "I see no abnormality" from "I see something
but can't name the specific disease." The model was collapsing the second
case into the first — effectively treating "disease not recognized" as
"therefore healthy," which is unsafe for an advisory tool.

**The fix — a symptom-first pipeline with two layers, neither trusted alone:**

1. **Reworked prompt (`server/visionModel.js`)** — now walks the model
   through six explicit steps before it's allowed to answer: confirm it's
   a plant photo, identify the crop, inspect for ~30 specific abnormality
   categories (yellowing, chlorosis, spots, lesions, curling, wilting,
   pest signs, etc.) *before* forming any opinion, describe only what's
   actually visible, suggest causes only when evidence supports them, and
   only then choose a status. The four allowed statuses are now `HEALTHY`,
   `SUSPECTED_ISSUE`, `UNCERTAIN`, and `NOT_A_PLANT` — there is no status
   that means "couldn't identify a disease, so healthy." The prompt states
   the core rule explicitly: finding no specific disease name is NOT the
   same as finding no symptoms.
2. **A genuine second validation pass (`server/diagnosisValidator.js`,
   new)** — this is the part that doesn't depend on the model getting the
   prompt right. It re-reads the model's own `observedSymptoms` and
   `visualEvidence` arrays for the same ~30 abnormality keywords, and if a
   `HEALTHY` verdict is accompanied by symptom evidence in the model's own
   words, the verdict is downgraded to `SUSPECTED_ISSUE` (if a cause was
   identified) or `UNCERTAIN` (if not) — with confidence clamped down
   accordingly. This is a hard code-level check, not a second prompt: a
   model can't talk its way around it by just asserting confidence, the
   same design principle already used for language enforcement
   (`languageGuard.js`) and topic classification (`domainGate.js`)
   elsewhere in this project.

The existing "no identified crop -> don't allow a confident verdict"
guardrail from the previous fix (§8.5) was preserved and now lives inside
`diagnosisValidator.js` alongside the new symptom check, plus a
configurable confidence floor (`VISION_MIN_CONFIDENCE`) that downgrades to
`UNCERTAIN` regardless of status if reported confidence is too low.

**Pipeline order**, matching the requested architecture: the vision model
performs plant-check → crop ID → symptom extraction → possible-cause
identification *in one structured pass* (a local vision model handling
multiple small chat round-trips reliably is not guaranteed the way a larger
hosted model might be, so step-by-step reasoning is enforced within a
single well-ordered prompt rather than across several separate calls);
`server/index.js` then does disease-knowledge lookup (matching
`suspectedIssueName` against the curated 18-entry reference table) *after*
the model's own reasoning, never before it; final validation
(`diagnosisValidator.js`) runs last, before the result ever reaches the
farmer.

**Unknown conditions:** when `SUSPECTED_ISSUE` has no matched database
entry and no specific cause named, the frontend shows a neutral
`unknownIssueLabel` ("Unknown crop health issue — needs closer
inspection", translated) rather than inventing a disease name — this
label lives in the frontend translation dictionary, not hardcoded English
from the backend, consistent with the rest of the app's i18n architecture.

**Language passed to the vision prompt:** `language` is now explicitly
threaded through to `analyzeImage()` and used to ask the model to write
its free-text `recommendation` field directly in the farmer's language
(all other JSON fields stay in stable English, since they're used as
internal identifiers — crop and disease identity are translated for
display via `cropTranslations.ts`/`diseaseTranslations.ts`, never
re-derived from a translated string). A new `translateCropName()` helper
was also added and wired into the Crop Mismatch screen, which was
previously showing the vision model's raw English crop name untranslated
even under a non-English UI.

**Verified** with a mock reproducing the exact reported case
(`status: HEALTHY`, `confidence: 0.7`, `observedSymptoms: ["...yellowing..."]`)
— now correctly returns `UNCERTAIN` with clamped confidence and the
downgrade reason logged. Also re-tested: a genuinely healthy photo with no
symptom evidence still returns `HEALTHY` normally (confirming the fix
targets the unsafe case specifically, not "healthy" claims in general); a
photo with obvious lesions and an identifiable cause returns
`SUSPECTED_ISSUE` with that cause; a photo with visible-but-unidentifiable
spots returns `SUSPECTED_ISSUE` with no fabricated disease name; blurry
and non-plant images still return `UNCERTAIN`/`NOT_A_PLANT` correctly.

**Honest caveat:** the symptom-keyword check can only catch contradictions
the model itself already put into words. If a model reports `HEALTHY` with
an empty `observedSymptoms` array despite genuinely visible symptoms it
simply failed to notice or describe, no code-level check can catch that —
the underlying vision model's perceptual accuracy remains the limiting
factor, same as noted in §9 below. What this fix guarantees is
*consistency*: the system will never present its own model's confidently-worded
symptom description as compatible with a "Healthy" verdict.

## 8.7 Follow-up fix: incomplete Tamil translation + healthy ripening rice misdiagnosed

Two more real bugs, both confirmed from screenshots:

**1. Dynamic diagnosis fields staying in English under Tamil UI.** The
disease name ("Rice Blast"), observed symptoms, possible causes, and
recommendation text were all showing in English even with Tamil selected.
Two separate causes:

- **Disease name matching was exact-string-only.** The vision model
  returned `"Rice Blast"` (crop name + disease name), but the curated
  reference table's key is just `"Blast"` — an exact-match lookup failed,
  so the raw, untranslated model output was shown instead of the fully
  localized curated entry. `getDiseaseByName()` (`diseaseEngine.ts`) now
  falls back to a substring match in either direction when an exact match
  fails, so `"Rice Blast"`, `"Rice blast"`, and `"Blast"` all correctly
  resolve to the same curated, fully-translated entry.
- **The recommendation/symptoms/causes are free text the vision model
  generates itself** — they aren't in the curated table at all, so there
  was nothing to translate them with. The first attempt (§8.6) asked the
  vision model to write its `recommendation` field directly in the target
  language as part of its JSON response. Exactly like the earlier chat
  language-enforcement issue, asking a local model nicely inside a mostly-
  English structured JSON response was not reliable — this is why it kept
  coming back in English. **The fix: a dedicated, separate translation
  pass** (`server/resultTranslator.js`, new) that runs after the vision
  analysis and validation are complete, translating exactly the text the
  model already produced (never adding new content), with per-field
  shape validation (e.g. an array translation is only accepted if it has
  the same number of items as the original) so a garbled or partial
  translation can't silently corrupt the result — any field that doesn't
  validate keeps its original English text instead. `visionModel.js` was
  simplified back to requesting English-only output throughout, since
  translation is no longer its job.

**2. A healthy, ripening rice photo (golden panicles, normal at harvest
time) was diagnosed as "Rice Blast."** This is a real vision-model
perceptual limitation: rice panicles turn golden-yellow as they ripen,
which is completely healthy — but "yellow" is also exactly the kind of
word the STEP-3 symptom inspection (added in §8.6) tells the model to
watch for, so the model was reporting normal ripening color as a disease
symptom. Two changes:

- **Prompt clarification** (`server/visionModel.js`) — STEP 3 now
  explicitly explains that many crops naturally turn golden/yellow/brown
  as grain, fruit, or the plant matures near harvest, and that this is
  healthy, not a symptom. Color change only counts as a possible
  abnormality when it's on leaf tissue in an irregular/patchy/blotchy
  pattern, or accompanied by other real symptoms (spots, lesions,
  curling, wilting) — not a uniformly golden seed head/panicle/fruit with
  otherwise healthy-looking green leaves.
- **A code-level safety net** (`server/diagnosisValidator.js`) — even with
  the improved prompt, if the model still describes something using
  "yellow"/"discolor" in the same phrase as ripening-context words
  ("ripe", "ripening", "matur-", "golden", "harvest"), that specific
  color-change signal is now suppressed from the abnormality check (other
  genuine symptom words like "spot" or "lesion" in the same phrase still
  count normally) — so a description like "golden ripening panicle" no
  longer forces a HEALTHY-with-symptoms downgrade, while "ripening panicle
  with brown spots" still correctly would.

**Verified** with a mock reproducing both exact screenshot scenarios: the
yellowing-rice case now returns fully Tamil-translated symptoms, cause
name (correctly matched to the curated Blast entry), and recommendation;
the golden ripening-rice case now returns `HEALTHY` rather than a forced
disease diagnosis. `npm run typecheck` and `npm run lint` still pass with
0 errors.

**Honest caveat:** the ripening/maturity fix is a prompt-and-heuristic
improvement, not a certainty — it depends on the vision model actually
producing a description that mentions ripening context, and a
weaker/more literal model might still occasionally call ripening color
"yellowing" without qualifying it. This reduces, but cannot fully
eliminate, that specific false-positive pattern. The translation pass
adds one more Ollama call when a `SUSPECTED_ISSUE`, `UNCERTAIN`, or
`HEALTHY`-with-recommendation result needs farmer-facing text translated
(skipped entirely when there's nothing to translate, e.g. no
recommendation and no symptoms).

## 9. Remaining limitations (honest, not glossed over)

- **Vision model quality is only as good as whatever local model you
  install.** `llava` is a reasonable, widely available default, but
  smaller/quantized vision models can misjudge crop identity or miss
  subtle symptoms. The architecture is real and doesn't fabricate, but
  "real" isn't the same as "always correct" — treat results as advisory,
  same as the chat advisor. §8.5 adds a code-level guardrail for the
  specific "confident verdict with no identified crop" failure mode
  observed live, but a model can still confidently misidentify an actual
  crop with a plausible wrong name, or misjudge a real plant's condition
  — that class of error isn't something server-side logic alone can catch.
- **`suspectedIssueName` matching against the curated 18-entry reference
  table is exact-name-based** (case-insensitive). If the vision model
  names something slightly differently than our table (e.g. "rice blast"
  vs. "Blast"), it won't match and the UI falls back to the model's own
  (still real, still localized... actually not localized — see next
  point) `observedSymptoms` text instead of the richer curated write-up.
- **`observedSymptoms` (the vision model's free-text description) is only
  ever in English** — unlike the curated reference entries, it isn't run
  through a translation pass. For a farmer whose vision-identified issue
  doesn't match the curated table, the "Diagnosis" text under a Tamil UI
  would show English free text. A translation pass (similar to the RAG
  chatbot's `languageGuard.js` corrective-translation pattern) could
  close this gap in a future revision; it wasn't added here to keep this
  round of fixes scoped to what's specified.
- **The saved-report "detail view"** still repopulates the input form +
  results panel (using the exact stored data by `id`) rather than a
  separate dedicated modal/page — this does correctly show the crop,
  match score, season, water requirement, growing period, and yield, all
  localized, but doesn't add a distinct "advisory notes" field beyond
  what's already in the reason text. Functionally it works and opens the
  correct report; a nicer detail-view UI is a possible follow-up, not
  a data-correctness issue.
- Weather translation and the Dashboard's farmer-name display were
  inspected and found to already be correctly implemented (stable
  weather-code → localized-description mapping; real name shown when
  available, translated fallback otherwise) — no changes were needed
  there, and this is noted rather than silently skipped.
