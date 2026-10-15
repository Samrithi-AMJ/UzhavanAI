// Splits a knowledge document's text into retrieval-sized chunks.
//
// Our curated knowledge base documents (knowledge/agri_knowledge.json) are
// already scoped to a single focused topic, so most of them naturally fit
// in one or two chunks. This function still does real paragraph-aware
// chunking (not "put the whole CSV/file in one blob") so the pipeline
// works correctly if larger documents (e.g. extracted PDF text) are added
// to the knowledge base later.
//
// Target ~120 words per chunk with a small overlap so a fact that falls
// near a chunk boundary isn't lost from retrieval.

const TARGET_WORDS = 120;
const OVERLAP_WORDS = 20;

function splitIntoSentences(paragraph) {
  return paragraph
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function chunkText(text, { targetWords = TARGET_WORDS, overlapWords = OVERLAP_WORDS } = {}) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const sentences = paragraphs.length > 0 ? paragraphs.flatMap(splitIntoSentences) : splitIntoSentences(text);

  const chunks = [];
  let current = [];
  let currentWordCount = 0;

  for (const sentence of sentences) {
    const wordCount = sentence.split(/\s+/).filter(Boolean).length;

    if (currentWordCount > 0 && currentWordCount + wordCount > targetWords) {
      chunks.push(current.join(' '));

      // Start the next chunk with a small overlap from the tail of the
      // previous one, so a sentence right at a boundary still has nearby
      // context in at least one chunk.
      let overlap = [];
      let overlapCount = 0;
      for (let i = current.length - 1; i >= 0 && overlapCount < overlapWords; i--) {
        const w = current[i].split(/\s+/).filter(Boolean).length;
        overlap.unshift(current[i]);
        overlapCount += w;
      }
      current = overlap;
      currentWordCount = overlapCount;
    }

    current.push(sentence);
    currentWordCount += wordCount;
  }

  if (current.length > 0) chunks.push(current.join(' '));

  // Guard against pathological empty input.
  return chunks.filter((c) => c.trim().length > 0);
}
