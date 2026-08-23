import { normalizeRect } from '../core/geometry.js';

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/g;

export function cleanOcrToken(value) {
  return String(value ?? '')
    .replace(CONTROL_CHARACTERS, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeOcrWords(words, options = {}) {
  const minimumConfidence = options.minimumConfidence ?? 20;
  return (words ?? [])
    .map((word, sourceIndex) => {
      const text = cleanOcrToken(word.text ?? word.symbol ?? word.value);
      const confidence = Number(word.confidence ?? word.conf ?? 0);
      const bbox = normalizeRect(word.bbox ?? word.box ?? word.rect);
      return {
        id: String(word.id ?? `word-${sourceIndex + 1}`),
        sourceIndex,
        text,
        confidence: Number.isFinite(confidence) ? confidence : 0,
        bbox,
      };
    })
    .filter(word =>
      word.text.length > 0 &&
      word.confidence >= minimumConfidence &&
      word.bbox.width > 0 &&
      word.bbox.height > 0
    );
}

export function extractTesseractWords(data) {
  const direct = data?.words;
  if (Array.isArray(direct) && direct.length) return direct;

  const output = [];
  for (const block of data?.blocks ?? []) {
    for (const paragraph of block.paragraphs ?? []) {
      for (const line of paragraph.lines ?? []) {
        for (const word of line.words ?? []) output.push(word);
      }
    }
  }
  return output;
}

