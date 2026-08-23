import { clamp, expandRect, normalizeRect } from '../core/geometry.js';
import { detectTextRegions } from '../ocr/region-detector.js';
import { rgbaToGrayscale, percentileStretch, limitImageSize } from './grayscale.js';
import { binaryDensity, sauvolaThreshold } from './adaptive-threshold.js';
import { connectedComponents } from './connected-components.js';

const DEFAULTS = {
  maximumPixels: 2_500_000,
  minimumComponentHeightRatio: 0.004,
  maximumComponentHeightRatio: 0.16,
  minimumComponentPixels: 4,
  minimumAspectRatio: 0.06,
  maximumAspectRatio: 8,
  minimumFillRatio: 0.035,
  maximumFillRatio: 0.96,
  minimumComponentsPerRegion: 2,
  maximumMaskDensity: 0.42,
  readingDirection: 'ltr',
};

function filterGlyphComponents(components, width, height, options) {
  const minimumHeight = Math.max(2, height * options.minimumComponentHeightRatio);
  const maximumHeight = Math.max(minimumHeight + 1, height * options.maximumComponentHeightRatio);
  const maximumArea = width * height * 0.025;
  return components.filter(component =>
    component.pixels >= options.minimumComponentPixels &&
    component.bbox.height >= minimumHeight &&
    component.bbox.height <= maximumHeight &&
    component.bbox.width * component.bbox.height <= maximumArea &&
    component.aspectRatio >= options.minimumAspectRatio &&
    component.aspectRatio <= options.maximumAspectRatio &&
    component.fillRatio >= options.minimumFillRatio &&
    component.fillRatio <= options.maximumFillRatio
  );
}

function regionScore(region) {
  const componentCountScore = clamp(region.wordCount / 10, 0, 1);
  const densityScore = 1 - clamp(Math.abs((region.metrics?.density ?? 0.25) - 0.25) / 0.5, 0, 1);
  const lineScore = clamp(region.lineCount / 3, 0.35, 1);
  return Math.round((componentCountScore * 0.5 + densityScore * 0.3 + lineScore * 0.2) * 1000) / 1000;
}

function intersectionOverSmaller(a, b) {
  const left = normalizeRect(a);
  const right = normalizeRect(b);
  const width = Math.max(0, Math.min(left.x1, right.x1) - Math.max(left.x0, right.x0));
  const height = Math.max(0, Math.min(left.y1, right.y1) - Math.max(left.y0, right.y0));
  return width * height / Math.max(1, Math.min(left.width * left.height, right.width * right.height));
}

function suppressDuplicates(candidates, threshold = 0.62) {
  const kept = [];
  for (const candidate of [...candidates].sort((a, b) => b.score - a.score)) {
    const duplicate = kept.find(existing => intersectionOverSmaller(existing.bbox, candidate.bbox) >= threshold);
    if (duplicate) {
      if (!duplicate.polarities.includes(candidate.polarity)) duplicate.polarities.push(candidate.polarity);
      continue;
    }
    kept.push({ ...candidate, polarities: [candidate.polarity] });
  }
  return kept;
}

function sortInReadingOrder(candidates, direction) {
  const rows = [];
  for (const candidate of [...candidates].sort((a, b) => a.bbox.y0 - b.bbox.y0)) {
    const centerY = (candidate.bbox.y0 + candidate.bbox.y1) / 2;
    const row = rows.find(item => Math.abs(item.centerY - centerY) <=
      Math.max(item.medianHeight, candidate.bbox.height) * 0.7);
    if (row) {
      row.items.push(candidate);
      row.centerY = row.items.reduce((sum, item) => sum + (item.bbox.y0 + item.bbox.y1) / 2, 0) / row.items.length;
      row.medianHeight = row.items.reduce((sum, item) => sum + item.bbox.height, 0) / row.items.length;
    } else {
      rows.push({ centerY, medianHeight: candidate.bbox.height, items: [candidate] });
    }
  }
  rows.sort((a, b) => a.centerY - b.centerY);
  return rows.flatMap(row => row.items.sort((a, b) =>
    direction === 'rtl' ? b.bbox.x0 - a.bbox.x0 : a.bbox.x0 - b.bbox.x0
  ));
}

function scaleRect(rect, inverseScale, width, height) {
  return expandRect({
    x0: rect.x0 * inverseScale,
    y0: rect.y0 * inverseScale,
    x1: rect.x1 * inverseScale,
    y1: rect.y1 * inverseScale,
  }, 0, { x0: 0, y0: 0, x1: width, y1: height });
}

export function detectTextCandidates(imageData, options = {}) {
  const config = { ...DEFAULTS, ...options };
  const original = rgbaToGrayscale(imageData);
  const limited = limitImageSize(original, config.maximumPixels);
  const stretched = percentileStretch(limited, { lowPercentile: 0.02, highPercentile: 0.98 });
  const polarities = options.polarities ?? ['dark', 'light'];
  const all = [];
  const passes = [];

  for (const polarity of polarities) {
    const binary = sauvolaThreshold(stretched, {
      polarity,
      windowSize: options.windowSize ?? Math.max(15, Math.round(Math.min(limited.width, limited.height) * 0.035) | 1),
      k: options.k ?? 0.22,
    });
    const density = binaryDensity(binary);
    if (density > config.maximumMaskDensity) {
      passes.push({ polarity, density, skipped: true, reason: 'FOREGROUND_TOO_DENSE' });
      continue;
    }
    const components = connectedComponents(binary, { connectivity: 8 });
    const glyphs = filterGlyphComponents(components, limited.width, limited.height, config);
    const pseudoWords = glyphs.map(component => ({
      id: component.id,
      text: '•',
      confidence: 60,
      bbox: component.bbox,
    }));
    const detected = detectTextRegions(pseudoWords, {
      imageWidth: limited.width,
      imageHeight: limited.height,
      readingDirection: config.readingDirection,
      minimumConfidence: 0,
      wordGapFactor: options.glyphGapFactor ?? 2.15,
      regionVerticalGapFactor: options.regionVerticalGapFactor ?? 1.55,
      fragmentGapFactor: options.fragmentGapFactor ?? 1.8,
      balloonPaddingFactor: options.balloonPaddingFactor ?? 0.9,
    });
    const accepted = detected.regions
      .filter(region => region.wordCount >= config.minimumComponentsPerRegion)
      .map(region => ({
        ...region,
        polarity,
        componentCount: region.wordCount,
        score: regionScore(region),
      }));
    all.push(...accepted);
    passes.push({ polarity, density, componentCount: components.length, glyphCount: glyphs.length, regionCount: accepted.length });
  }

  const inverseScale = 1 / limited.scale;
  const scaled = suppressDuplicates(all).map(candidate => ({
    ...candidate,
    bbox: scaleRect(candidate.bbox, inverseScale, original.width, original.height),
    balloonBox: scaleRect(candidate.balloonBox, inverseScale, original.width, original.height),
  }));
  const candidates = sortInReadingOrder(scaled, config.readingDirection).map((candidate, index) => ({
    id: `candidate-${index + 1}`,
    bbox: candidate.bbox,
    balloonBox: candidate.balloonBox,
    componentCount: candidate.componentCount,
    lineCount: candidate.lineCount,
    score: candidate.score,
    polarities: candidate.polarities,
  }));
  return {
    schemaVersion: 1,
    image: { width: original.width, height: original.height, analysisScale: limited.scale },
    preprocessing: { contrastLow: stretched.low, contrastHigh: stretched.high },
    passes,
    candidates,
  };
}

