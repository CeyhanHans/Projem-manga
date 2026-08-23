import { clamp } from '../core/geometry.js';

function glyphWeight(character) {
  if (/\s/.test(character)) return 0.34;
  if (/[ilIıİ.,'!:;]/.test(character)) return 0.3;
  if (/[mwMW@#%&]/.test(character)) return 0.9;
  if (/[A-ZÇĞİÖŞÜ]/.test(character)) return 0.66;
  return 0.56;
}

export function approximateTextWidth(text, fontSize, letterSpacing = 0) {
  const characters = [...String(text)];
  const glyphs = characters.reduce((sum, character) => sum + glyphWeight(character), 0) * fontSize;
  return glyphs + Math.max(0, characters.length - 1) * letterSpacing;
}

function splitLongToken(token, maxWidth, measure) {
  const parts = [];
  let current = '';
  for (const character of [...token]) {
    if (current && measure(current + character) > maxWidth) {
      parts.push(current);
      current = character;
    } else {
      current += character;
    }
  }
  if (current) parts.push(current);
  return parts;
}

export function wrapText(text, maxWidth, measure) {
  const paragraphs = String(text ?? '').trim().split(/\n+/);
  const lines = [];
  for (const paragraph of paragraphs) {
    const rawTokens = paragraph.split(/\s+/).filter(Boolean);
    const tokens = rawTokens.flatMap(token =>
      measure(token) <= maxWidth ? [token] : splitLongToken(token, maxWidth, measure)
    );
    let current = '';
    for (const token of tokens) {
      const candidate = current ? `${current} ${token}` : token;
      if (current && measure(candidate) > maxWidth) {
        lines.push(current);
        current = token;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
  }
  return lines.length ? lines : [''];
}

function evaluate(text, width, height, fontSize, options) {
  const letterSpacing = options.letterSpacingEm * fontSize;
  const lineHeightPx = options.lineHeight * fontSize;
  const measure = value => options.measureText
    ? options.measureText(value, fontSize, letterSpacing)
    : approximateTextWidth(value, fontSize, letterSpacing);
  const lines = wrapText(text, width, measure);
  const widest = Math.max(...lines.map(measure), 0);
  const usedHeight = lines.length * lineHeightPx;
  return {
    lines,
    widest,
    usedHeight,
    fits: widest <= width + 0.5 && usedHeight <= height + 0.5,
    letterSpacing,
    lineHeightPx,
  };
}

export function fitTextToBox(text, box, options = {}) {
  const config = {
    minFontSize: 9,
    maxFontSize: 42,
    paddingRatio: 0.09,
    lineHeight: 1.08,
    letterSpacingEm: 0,
    measureText: null,
    ...options,
  };
  const padding = clamp(
    Math.min(box.width, box.height) * config.paddingRatio,
    options.minimumPadding ?? 3,
    options.maximumPadding ?? 20,
  );
  const usableWidth = Math.max(1, box.width - padding * 2);
  const usableHeight = Math.max(1, box.height - padding * 2);
  let low = config.minFontSize;
  let high = Math.min(config.maxFontSize, usableHeight);
  let best = evaluate(text, usableWidth, usableHeight, low, config);
  let bestSize = low;

  for (let iteration = 0; iteration < 12 && high - low > 0.2; iteration += 1) {
    const candidate = (low + high) / 2;
    const result = evaluate(text, usableWidth, usableHeight, candidate, config);
    if (result.fits) {
      best = result;
      bestSize = candidate;
      low = candidate;
    } else {
      high = candidate;
    }
  }

  const overflow = !best.fits;
  const scaleX = overflow && best.widest > usableWidth
    ? clamp(usableWidth / best.widest, 0.78, 1)
    : 1;
  return {
    text: String(text ?? ''),
    lines: best.lines,
    fontSize: Math.round(bestSize * 10) / 10,
    lineHeight: Math.round(best.lineHeightPx * 10) / 10,
    letterSpacing: Math.round(best.letterSpacing * 100) / 100,
    padding: Math.round(padding * 10) / 10,
    align: 'center',
    verticalAlign: 'middle',
    scaleX: Math.round(scaleX * 1000) / 1000,
    overflow,
    warnings: overflow
      ? ['Metin minimum font boyutunda dahi kutuya tam sığmıyor; balon genişletilmeli veya çeviri kısaltılmalı.']
      : [],
  };
}

