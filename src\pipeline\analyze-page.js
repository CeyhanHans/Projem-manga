import { detectTextRegions } from '../ocr/region-detector.js';
import { createRegionOcrPlan } from '../ocr/preprocess-plan.js';
import { fitTextToBox } from '../layout/text-fit.js';
import { buildFontProfile } from '../layout/font-profile.js';

export function analyzePage(words, options = {}) {
  const detection = detectTextRegions(words, options);
  const regions = detection.regions.map(region => {
    const translatedText = options.translations?.[region.id] ?? region.text;
    return {
      ...region,
      ocrPlan: createRegionOcrPlan(region, options.ocr),
      layout: fitTextToBox(translatedText, region.balloonBox, options.layout),
      font: buildFontProfile(translatedText, options.font),
    };
  });
  return {
    schemaVersion: 1,
    image: {
      width: options.imageWidth ?? null,
      height: options.imageHeight ?? null,
    },
    stats: detection.stats,
    regions,
    warnings: buildWarnings(regions),
  };
}

function buildWarnings(regions) {
  const warnings = [];
  if (!regions.length) warnings.push({ code: 'NO_TEXT', message: 'OCR kelimesi veya metin bölgesi bulunamadı.' });
  for (const region of regions) {
    if (region.confidence < 50) warnings.push({ code: 'LOW_CONFIDENCE', regionId: region.id, message: 'Bölge yeniden OCR yapılmalı.' });
    if (region.layout.overflow) warnings.push({ code: 'TEXT_OVERFLOW', regionId: region.id, message: 'Türkçe metin balona sığmıyor.' });
  }
  return warnings;
}

