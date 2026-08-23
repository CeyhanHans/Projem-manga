import {
  center,
  expandRect,
  horizontalGap,
  median,
  normalizeRect,
  overlapRatio,
  unionRects,
  verticalGap,
} from '../core/geometry.js';
import { normalizeOcrWords } from './normalize.js';

const DEFAULTS = {
  minimumConfidence: 20,
  lineVerticalOverlap: 0.42,
  lineCenterTolerance: 0.72,
  wordGapFactor: 2.8,
  regionVerticalGapFactor: 1.8,
  regionHorizontalOverlap: 0.18,
  fragmentGapFactor: 2.25,
  balloonPaddingFactor: 0.72,
  readingDirection: 'ltr',
};

function weightedConfidence(words) {
  const weights = words.map(word => Math.max(1, [...word.text].length));
  const total = weights.reduce((sum, value) => sum + value, 0);
  return words.reduce((sum, word, index) => sum + word.confidence * weights[index], 0) / total;
}

function canJoinLine(line, word, stats, options) {
  const box = line.bbox;
  const verticalOverlap = overlapRatio(box, word.bbox, 'y');
  const yDistance = Math.abs(center(box).y - center(word.bbox).y);
  const closeVertically = verticalOverlap >= options.lineVerticalOverlap ||
    yDistance <= stats.medianHeight * options.lineCenterTolerance;
  return closeVertically && horizontalGap(box, word.bbox) <= stats.medianHeight * options.wordGapFactor;
}

function rebuildLine(line) {
  line.words.sort((a, b) => a.bbox.x0 - b.bbox.x0);
  line.bbox = unionRects(line.words.map(word => word.bbox));
  line.text = line.words.map(word => word.text).join(' ');
  line.confidence = weightedConfidence(line.words);
  return line;
}

export function clusterWordsIntoLines(words, options = {}) {
  const config = { ...DEFAULTS, ...options };
  const normalized = normalizeOcrWords(words, config);
  const stats = {
    medianHeight: Math.max(1, median(normalized.map(word => word.bbox.height))),
    medianWidth: Math.max(1, median(normalized.map(word => word.bbox.width))),
  };
  const sorted = [...normalized].sort((a, b) =>
    center(a.bbox).y - center(b.bbox).y || a.bbox.x0 - b.bbox.x0
  );
  const lines = [];

  for (const word of sorted) {
    const candidates = lines
      .filter(line => canJoinLine(line, word, stats, config))
      .sort((a, b) => Math.abs(center(a.bbox).y - center(word.bbox).y) -
        Math.abs(center(b.bbox).y - center(word.bbox).y));
    if (candidates.length) {
      candidates[0].words.push(word);
      rebuildLine(candidates[0]);
    } else {
      lines.push(rebuildLine({ words: [word] }));
    }
  }

  return { lines, stats };
}

function linesBelongTogether(a, b, stats, options) {
  const gapY = verticalGap(a.bbox, b.bbox);
  const gapX = horizontalGap(a.bbox, b.bbox);
  const horizontalOverlap = overlapRatio(a.bbox, b.bbox, 'x');
  const verticallyAdjacent = gapY <= stats.medianHeight * options.regionVerticalGapFactor;
  const aligned = horizontalOverlap >= options.regionHorizontalOverlap;
  const closeFragments = gapY <= stats.medianHeight * 0.55 &&
    gapX <= stats.medianHeight * options.fragmentGapFactor;
  return (verticallyAdjacent && aligned) || closeFragments;
}

function connectedComponents(lines, stats, options) {
  const parent = lines.map((_, index) => index);
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

  for (let left = 0; left < lines.length; left += 1) {
    for (let right = left + 1; right < lines.length; right += 1) {
      if (linesBelongTogether(lines[left], lines[right], stats, options)) union(left, right);
    }
  }

  const groups = new Map();
  lines.forEach((line, index) => {
    const root = find(index);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(line);
  });
  return [...groups.values()];
}

function orderRegions(regions, direction, rowTolerance) {
  const rows = [];
  for (const region of [...regions].sort((a, b) => a.bbox.y0 - b.bbox.y0)) {
    const match = rows.find(row =>
      overlapRatio(row.bbox, region.bbox, 'y') >= 0.2 ||
      Math.abs(center(row.bbox).y - center(region.bbox).y) <= rowTolerance
    );
    if (match) {
      match.items.push(region);
      match.bbox = unionRects(match.items.map(item => item.bbox));
    } else {
      rows.push({ bbox: region.bbox, items: [region] });
    }
  }
  rows.sort((a, b) => a.bbox.y0 - b.bbox.y0);
  return rows.flatMap(row => row.items.sort((a, b) =>
    direction === 'rtl' ? b.bbox.x0 - a.bbox.x0 : a.bbox.x0 - b.bbox.x0
  ));
}

export function detectTextRegions(words, options = {}) {
  const config = { ...DEFAULTS, ...options };
  const { lines, stats } = clusterWordsIntoLines(words, config);
  if (!lines.length) return { regions: [], lines: [], stats };
  const bounds = options.imageWidth && options.imageHeight
    ? normalizeRect({ x0: 0, y0: 0, x1: options.imageWidth, y1: options.imageHeight })
    : null;
  const groups = connectedComponents(lines, stats, config);
  const unordered = groups.map(group => {
    const orderedLines = [...group].sort((a, b) => a.bbox.y0 - b.bbox.y0 || a.bbox.x0 - b.bbox.x0);
    const regionWords = orderedLines.flatMap(line => line.words);
    const textBox = unionRects(regionWords.map(word => word.bbox));
    const padding = Math.max(4, stats.medianHeight * config.balloonPaddingFactor);
    return {
      text: orderedLines.map(line => line.text).join('\n'),
      confidence: Math.round(weightedConfidence(regionWords) * 10) / 10,
      bbox: textBox,
      balloonBox: expandRect(textBox, { x: padding * 1.35, y: padding }, bounds),
      words: regionWords,
      lines: orderedLines,
      wordCount: regionWords.length,
      lineCount: orderedLines.length,
      metrics: {
        medianWordHeight: stats.medianHeight,
        density: regionWords.reduce((sum, word) => sum + word.bbox.width * word.bbox.height, 0) /
          Math.max(1, textBox.width * textBox.height),
      },
    };
  });

  const regions = orderRegions(
    unordered,
    config.readingDirection,
    stats.medianHeight * 1.4,
  ).map((region, index) => ({ ...region, id: `region-${index + 1}`, order: index }));

  return { regions, lines, stats };
}

