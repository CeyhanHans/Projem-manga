import { center, clamp, normalizeRect } from '../core/geometry.js';
import { normalizeOcrWords } from './normalize.js';

function intersectionOverUnion(a, b) {
  const left = normalizeRect(a);
  const right = normalizeRect(b);
  const width = Math.max(0, Math.min(left.x1, right.x1) - Math.max(left.x0, right.x0));
  const height = Math.max(0, Math.min(left.y1, right.y1) - Math.max(left.y0, right.y0));
  const intersection = width * height;
  const union = left.width * left.height + right.width * right.height - intersection;
  return union ? intersection / union : 0;
}

function samePosition(a, b, options) {
  if (intersectionOverUnion(a.bbox, b.bbox) >= options.minimumIou) return true;
  const ca = center(a.bbox);
  const cb = center(b.bbox);
  const scale = Math.max(1, Math.min(a.bbox.height, b.bbox.height));
  return Math.hypot(ca.x - cb.x, ca.y - cb.y) / scale <= options.maximumCenterDistance;
}

function canonicalText(text) {
  return String(text)
    .normalize('NFKC')
    .toLocaleUpperCase('en-US')
    .replace(/[^\p{L}\p{N}]/gu, '');
}

function averageRect(words) {
  const total = words.reduce((sum, word) => sum + Math.max(1, word.confidence), 0);
  const coordinate = key => words.reduce((sum, word) => sum + word.bbox[key] * Math.max(1, word.confidence), 0) / total;
  return normalizeRect({ x0: coordinate('x0'), y0: coordinate('y0'), x1: coordinate('x1'), y1: coordinate('y1') });
}

export function mergeOcrPasses(passResults, options = {}) {
  const config = {
    minimumIou: 0.32,
    maximumCenterDistance: 0.55,
    agreementBonus: 4,
    ...options,
  };
  const words = passResults.flatMap((pass, passIndex) =>
    normalizeOcrWords(pass.words ?? pass.data?.words ?? [], { minimumConfidence: 0 })
      .map(word => ({ ...word, passId: String(pass.id ?? `pass-${passIndex + 1}`) }))
  );
  const parent = words.map((_, index) => index);
  const find = index => {
    while (parent[index] !== index) {
      parent[index] = parent[parent[index]];
      index = parent[index];
    }
    return index;
  };
  const union = (a, b) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent[rootB] = rootA;
  };
  for (let left = 0; left < words.length; left += 1) {
    for (let right = left + 1; right < words.length; right += 1) {
      if (words[left].passId === words[right].passId) continue;
      if (samePosition(words[left], words[right], config)) union(left, right);
    }
  }
  const groups = new Map();
  words.forEach((word, index) => {
    const root = find(index);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(word);
  });
  return [...groups.values()].map((group, index) => {
    const votes = new Map();
    for (const word of group) {
      const key = canonicalText(word.text) || word.text;
      if (!votes.has(key)) votes.set(key, []);
      votes.get(key).push(word);
    }
    const candidates = [...votes.values()].map(voteWords => {
      const best = [...voteWords].sort((a, b) => b.confidence - a.confidence)[0];
      const distinctPasses = new Set(voteWords.map(word => word.passId)).size;
      return {
        text: best.text,
        baseConfidence: best.confidence,
        score: best.confidence + (distinctPasses - 1) * config.agreementBonus,
        distinctPasses,
        words: voteWords,
      };
    }).sort((a, b) => b.score - a.score || b.text.length - a.text.length);
    const winner = candidates[0];
    return {
      id: `merged-${index + 1}`,
      text: winner.text,
      confidence: Math.round(clamp(winner.score, 0, 99.9) * 10) / 10,
      bbox: averageRect(winner.words),
      provenance: {
        agreeingPasses: winner.words.map(word => word.passId),
        observedPasses: [...new Set(group.map(word => word.passId))],
        alternatives: candidates.slice(1).map(candidate => ({
          text: candidate.text,
          confidence: candidate.baseConfidence,
          passes: candidate.words.map(word => word.passId),
        })),
      },
    };
  });
}

