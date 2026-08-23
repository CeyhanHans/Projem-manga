import { normalizeRect, rectArea } from '../core/geometry.js';

export function intersectionOverUnion(left, right) {
  const a = normalizeRect(left);
  const b = normalizeRect(right);
  const width = Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0));
  const height = Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
  const intersection = width * height;
  const union = rectArea(a) + rectArea(b) - intersection;
  return union > 0 ? intersection / union : 0;
}

export function evaluateDetection(expectedBoxes, detectedRegions, options = {}) {
  const threshold = options.iouThreshold ?? 0.35;
  const expected = expectedBoxes.map((item, index) => ({
    id: item.id ?? `expected-${index + 1}`,
    bbox: normalizeRect(item.bbox ?? item),
  }));
  const detected = detectedRegions.map((item, index) => ({
    id: item.id ?? `detected-${index + 1}`,
    bbox: normalizeRect(item.balloonBox ?? item.bbox ?? item),
  }));
  const candidates = [];
  for (const target of expected) {
    for (const prediction of detected) {
      candidates.push({
        expectedId: target.id,
        detectedId: prediction.id,
        iou: intersectionOverUnion(target.bbox, prediction.bbox),
      });
    }
  }
  candidates.sort((a, b) => b.iou - a.iou);
  const usedExpected = new Set();
  const usedDetected = new Set();
  const matches = [];
  for (const candidate of candidates) {
    if (candidate.iou < threshold) break;
    if (usedExpected.has(candidate.expectedId) || usedDetected.has(candidate.detectedId)) continue;
    usedExpected.add(candidate.expectedId);
    usedDetected.add(candidate.detectedId);
    matches.push(candidate);
  }
  const missed = expected.filter(item => !usedExpected.has(item.id)).map(item => item.id);
  const falsePositives = detected.filter(item => !usedDetected.has(item.id)).map(item => item.id);
  const precision = detected.length ? matches.length / detected.length : expected.length ? 0 : 1;
  const recall = expected.length ? matches.length / expected.length : detected.length ? 0 : 1;
  const f1 = precision + recall ? 2 * precision * recall / (precision + recall) : 0;
  return {
    threshold,
    expectedCount: expected.length,
    detectedCount: detected.length,
    matches,
    missed,
    falsePositives,
    precision: Math.round(precision * 1000) / 1000,
    recall: Math.round(recall * 1000) / 1000,
    f1: Math.round(f1 * 1000) / 1000,
  };
}

