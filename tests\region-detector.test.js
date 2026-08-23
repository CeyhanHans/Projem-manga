import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { detectTextRegions } from '../src/ocr/region-detector.js';

const fixture = JSON.parse(await readFile(new URL('../fixtures/two-balloons.json', import.meta.url)));

test('yan yana iki konuşma balonunu ayrı bölgeler halinde tutar', () => {
  const result = detectTextRegions(fixture.words, fixture);
  assert.equal(result.regions.length, 2);
  assert.equal(result.regions[0].text, 'WHERE ARE\nYOU?');
  assert.equal(result.regions[1].text, "I DON'T KNOW\nYET");
});

test('manga okuma yönünde sağdaki bölgeyi önce sıralar', () => {
  const result = detectTextRegions(fixture.words, { ...fixture, readingDirection: 'rtl' });
  assert.match(result.regions[0].text, /DON'T/);
  assert.match(result.regions[1].text, /WHERE/);
});

test('balon kutusunu görsel sınırlarının dışına çıkarmaz', () => {
  const edgeWord = [{ text: 'EDGE', confidence: 90, bbox: { x0: 1, y0: 2, x1: 40, y1: 24 } }];
  const { regions } = detectTextRegions(edgeWord, { imageWidth: 100, imageHeight: 100 });
  assert.equal(regions[0].balloonBox.x0, 0);
  assert.equal(regions[0].balloonBox.y0, 0);
});

test('düşük kaliteli boş OCR parçalarını filtreler', () => {
  const noisy = [
    ...fixture.words,
    { text: ' ', confidence: 99, bbox: { x0: 0, y0: 0, x1: 10, y1: 10 } },
    { text: 'noise', confidence: 5, bbox: { x0: 800, y0: 500, x1: 850, y1: 520 } },
  ];
  const result = detectTextRegions(noisy, fixture);
  assert.equal(result.regions.length, 2);
});

