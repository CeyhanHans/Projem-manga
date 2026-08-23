import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeOcrPasses } from '../src/ocr/multi-pass-merge.js';
import { scoreOcrQuality } from '../src/ocr/quality.js';
import { runAdaptiveOcr } from '../src/ocr/ensemble.js';

const bbox = { x0: 10, y0: 20, x1: 70, y1: 42 };

test('aynı konumdaki çoklu OCR sonuçlarında çoğunluk ve güveni birleştirir', () => {
  const merged = mergeOcrPasses([
    { id: 'baseline', words: [{ text: 'STAYS', confidence: 62, bbox }] },
    { id: 'contrast', words: [{ text: 'STATS', confidence: 84, bbox: { x0: 11, y0: 20, x1: 71, y1: 42 } }] },
    { id: 'adaptive', words: [{ text: 'STATS', confidence: 78, bbox: { x0: 9, y0: 21, x1: 69, y1: 43 } }] },
  ]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].text, 'STATS');
  assert.ok(merged[0].confidence > 84);
  assert.deepEqual(merged[0].provenance.agreeingPasses.sort(), ['adaptive', 'contrast']);
  assert.equal(merged[0].provenance.alternatives[0].text, 'STAYS');
});

test('OCR kalite puanı düşük güven ve sembol gürültüsünde retry ister', () => {
  const quality = scoreOcrQuality([
    { text: '}|!', confidence: 22, bbox },
    { text: 'H3LLO', confidence: 40, bbox: { x0: 80, y0: 20, x1: 130, y1: 42 } },
  ], { imageWidth: 200, imageHeight: 100 });
  assert.equal(quality.shouldRetry, true);
  assert.ok(quality.score < 0.6);
});

test('yüksek kaliteli ilk geçişte pahalı fallbackleri çalıştırmaz', async () => {
  const calls = [];
  const recognize = async (_input, plan) => {
    calls.push(plan.id);
    return { words: [
      { text: 'EVERYTHING', confidence: 94, bbox },
      { text: 'IS', confidence: 92, bbox: { x0: 75, y0: 20, x1: 90, y1: 42 } },
      { text: 'READY', confidence: 95, bbox: { x0: 95, y0: 20, x1: 140, y1: 42 } },
    ] };
  };
  const result = await runAdaptiveOcr(recognize, 'image', { expectedCharacters: 10 });
  assert.deepEqual(calls, ['baseline']);
  assert.equal(result.usedFallback, false);
  assert.equal(result.allFailed, false);
});

test('zayıf ilk geçişte diğer görüntü hazırlama yollarını dener ve sonucu birleştirir', async () => {
  const recognize = async (_input, plan) => {
    if (plan.id === 'baseline') return { words: [{ text: 'H3LLO', confidence: 38, bbox }] };
    if (plan.id === 'contrast') return { words: [{ text: 'HELLO', confidence: 82, bbox }] };
    return { words: [{ text: 'HELLO', confidence: 79, bbox }] };
  };
  const result = await runAdaptiveOcr(recognize, 'image', {
    expectedCharacters: 20,
    maximumPasses: 3,
    minimumPasses: 3,
  });
  assert.ok(result.attempts.length > 1);
  assert.equal(result.words[0].text, 'HELLO');
  assert.ok(result.words[0].provenance.agreeingPasses.length >= 2);
});

test('bir OCR geçişi hata verse bile diğer sonuçları korur', async () => {
  const recognize = async (_input, plan) => {
    if (plan.id === 'baseline') throw new Error('worker crashed');
    return { words: [{ text: 'RECOVERED', confidence: 88, bbox }] };
  };
  const result = await runAdaptiveOcr(recognize, 'image', { expectedCharacters: 5, maximumPasses: 2 });
  assert.equal(result.allFailed, false);
  assert.equal(result.attempts[0].ok, false);
  assert.equal(result.words[0].text, 'RECOVERED');
});

