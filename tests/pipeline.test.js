import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { analyzePage } from '../src/pipeline/analyze-page.js';
import { createDebugOverlay } from '../src/diagnostics/debug-overlay.js';
import { analyzeTesseractResult, toLegacyBlocks } from '../src/integration/tesseract-adapter.js';

const fixture = JSON.parse(await readFile(new URL('../fixtures/two-balloons.json', import.meta.url)));

test('tek çağrıda bölge, OCR planı, font ve yerleşim üretir', () => {
  const analysis = analyzePage(fixture.words, {
    ...fixture,
    translations: {
      'region-1': 'NEREYE GİDİYORSUN?',
      'region-2': 'HENÜZ BİLMİYORUM.',
    },
  });
  assert.equal(analysis.schemaVersion, 1);
  assert.equal(analysis.regions.length, 2);
  assert.ok(analysis.regions[0].ocrPlan.upscale >= 1.5);
  assert.ok(analysis.regions[0].layout.fontSize > 0);
  assert.ok(analysis.regions[0].font.family.includes('Arial'));
});

test('Tesseract v5 iç içe blok yapısını okuyup eski extension formatına çevirir', () => {
  const nested = {
    data: {
      blocks: [{ paragraphs: [{ lines: [{ words: fixture.words.slice(0, 3) }] }] }],
    },
  };
  const analysis = analyzeTesseractResult(nested, fixture);
  const blocks = toLegacyBlocks(analysis);
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].en, 'WHERE ARE\nYOU?');
  assert.ok(blocks[0].layout);
});

test('tanılama için tarayıcıda gösterilebilir SVG üretir', () => {
  const analysis = analyzePage(fixture.words, fixture);
  const svg = createDebugOverlay(analysis);
  assert.match(svg, /^<svg/);
  assert.match(svg, /region-1/);
  assert.match(svg, /stroke="#22c55e"/);
});

