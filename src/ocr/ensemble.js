import { extractTesseractWords } from './normalize.js';
import { mergeOcrPasses } from './multi-pass-merge.js';
import { scoreOcrQuality } from './quality.js';

export const DEFAULT_OCR_PASSES = [
  {
    id: 'baseline',
    preprocessing: { grayscale: true, contrastStretch: false, polarity: 'auto' },
    parameters: { tessedit_pageseg_mode: 11 },
  },
  {
    id: 'contrast',
    preprocessing: { grayscale: true, contrastStretch: [2, 98], polarity: 'auto', border: 12 },
    parameters: { tessedit_pageseg_mode: 11 },
  },
  {
    id: 'adaptive-dark',
    preprocessing: { grayscale: true, threshold: 'sauvola', polarity: 'dark', border: 12 },
    parameters: { tessedit_pageseg_mode: 11 },
  },
  {
    id: 'adaptive-light',
    preprocessing: { grayscale: true, threshold: 'sauvola', polarity: 'light', border: 12 },
    parameters: { tessedit_pageseg_mode: 11 },
  },
];

function wordsFromResult(result) {
  if (Array.isArray(result?.words)) return result.words;
  return extractTesseractWords(result?.data ?? result);
}

export async function runAdaptiveOcr(recognize, input, options = {}) {
  if (typeof recognize !== 'function') throw new TypeError('recognize fonksiyonu gerekli.');
  const plans = options.passes ?? DEFAULT_OCR_PASSES;
  const attempts = [];
  const maximumPasses = Math.max(1, options.maximumPasses ?? plans.length);

  for (const plan of plans.slice(0, maximumPasses)) {
    const startedAt = Date.now();
    try {
      const result = await recognize(input, plan);
      const words = wordsFromResult(result);
      const quality = scoreOcrQuality(words, options);
      attempts.push({ id: plan.id, ok: true, plan, words, quality, durationMs: Date.now() - startedAt });
      const enoughPasses = attempts.filter(attempt => attempt.ok).length >= (options.minimumPasses ?? 1);
      if (enoughPasses && !quality.shouldRetry && plan.id !== 'adaptive-light') break;
    } catch (error) {
      attempts.push({
        id: plan.id,
        ok: false,
        plan,
        words: [],
        durationMs: Date.now() - startedAt,
        error: { name: error?.name ?? 'Error', message: error?.message ?? String(error) },
      });
    }
  }
  const successful = attempts.filter(attempt => attempt.ok);
  const words = mergeOcrPasses(successful, options.merge);
  const quality = scoreOcrQuality(words, options);
  return {
    schemaVersion: 1,
    words,
    quality,
    attempts: attempts.map(attempt => ({
      id: attempt.id,
      ok: attempt.ok,
      durationMs: attempt.durationMs,
      quality: attempt.quality,
      wordCount: attempt.words.length,
      error: attempt.error,
    })),
    usedFallback: attempts.length > 1,
    allFailed: successful.length === 0,
  };
}

