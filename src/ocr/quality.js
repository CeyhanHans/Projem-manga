import { clamp } from '../core/geometry.js';
import { normalizeOcrWords } from './normalize.js';

export function scoreOcrQuality(words, options = {}) {
  const normalized = normalizeOcrWords(words, { minimumConfidence: 0 });
  const characters = normalized.reduce((sum, word) => sum + [...word.text].length, 0);
  const weightedConfidence = characters
    ? normalized.reduce((sum, word) => sum + word.confidence * Math.max(1, [...word.text].length), 0) / characters
    : 0;
  const suspicious = normalized.filter(word => {
    const useful = [...word.text].filter(character => /[\p{L}\p{N}]/u.test(character)).length;
    return useful / Math.max(1, [...word.text].length) < 0.5 || word.confidence < 35;
  }).length;
  const imageArea = Math.max(1, (options.imageWidth ?? 1) * (options.imageHeight ?? 1));
  const coveredArea = normalized.reduce((sum, word) => sum + word.bbox.width * word.bbox.height, 0);
  const confidenceScore = clamp(weightedConfidence / 100, 0, 1);
  const contentScore = clamp(characters / (options.expectedCharacters ?? 40), 0, 1);
  const noiseScore = 1 - suspicious / Math.max(1, normalized.length);
  const coverage = coveredArea / imageArea;
  const score = confidenceScore * 0.55 + contentScore * 0.25 + noiseScore * 0.2;
  return {
    score: Math.round(score * 1000) / 1000,
    wordCount: normalized.length,
    characterCount: characters,
    weightedConfidence: Math.round(weightedConfidence * 10) / 10,
    suspiciousWordCount: suspicious,
    coverage: Math.round(coverage * 100000) / 100000,
    shouldRetry: normalized.length === 0 || weightedConfidence < (options.retryConfidence ?? 76) ||
      suspicious / Math.max(1, normalized.length) > (options.maximumNoiseRatio ?? 0.3),
  };
}

