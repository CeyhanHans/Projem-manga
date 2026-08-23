import { clamp } from '../core/geometry.js';

export function createRegionOcrPlan(region, options = {}) {
  const targetCharacterHeight = options.targetCharacterHeight ?? 48;
  const maximumUpscale = options.maximumUpscale ?? 10;
  const minimumUpscale = options.minimumUpscale ?? 1.5;
  const estimatedHeight = Math.max(1, region.metrics?.medianWordHeight ?? region.bbox.height);
  const upscale = clamp(targetCharacterHeight / estimatedHeight, minimumUpscale, maximumUpscale);
  const sparse = region.wordCount <= 3 && region.lineCount <= 2;
  const confidence = region.confidence ?? 0;
  return {
    regionId: region.id,
    crop: region.balloonBox,
    upscale: Math.round(upscale * 100) / 100,
    pageSegmentationMode: sparse ? 11 : region.lineCount === 1 ? 7 : 6,
    polarities: confidence < 76 ? ['normal', 'inverted'] : ['auto'],
    contrastStretch: { lowPercentile: 2, highPercentile: 98 },
    grayscale: true,
    recheck: confidence < 72,
    rationale: [
      `Tahmini karakter yüksekliği ${Math.round(estimatedHeight)} px; hedef ${targetCharacterHeight} px.`,
      sparse ? 'Seyrek metin modu seçildi.' : 'Blok/satır yapısına uygun OCR modu seçildi.',
      confidence < 76 ? 'Düşük güven nedeniyle iki polarite önerildi.' : 'Güven yeterli; tek adaptif geçiş yeterli.',
    ],
  };
}

