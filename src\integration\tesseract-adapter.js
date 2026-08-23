import { extractTesseractWords } from '../ocr/normalize.js';
import { analyzePage } from '../pipeline/analyze-page.js';

export function analyzeTesseractResult(tesseractResult, options = {}) {
  const data = tesseractResult?.data ?? tesseractResult;
  return analyzePage(extractTesseractWords(data), options);
}

export function toLegacyBlocks(analysis) {
  return analysis.regions.map(region => ({
    en: region.text,
    fr: '',
    confidence: region.confidence,
    bbox: region.bbox,
    balloonBox: region.balloonBox,
    layout: region.layout,
    ocrPlan: region.ocrPlan,
  }));
}

