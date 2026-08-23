import test from 'node:test';
import assert from 'node:assert/strict';
import { rgbaToGrayscale, percentileStretch } from '../src/image/grayscale.js';
import { sauvolaThreshold } from '../src/image/adaptive-threshold.js';
import { connectedComponents } from '../src/image/connected-components.js';
import { closeBinary, dilateBinary, erodeBinary } from '../src/image/morphology.js';
import { detectTextCandidates } from '../src/image/text-candidate-detector.js';

function blankImage(width, height, value = 255) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let index = 0; index < width * height; index += 1) {
    data[index * 4] = value;
    data[index * 4 + 1] = value;
    data[index * 4 + 2] = value;
    data[index * 4 + 3] = 255;
  }
  return { width, height, data };
}

function setPixel(image, x, y, value) {
  const index = (y * image.width + x) * 4;
  image.data[index] = value;
  image.data[index + 1] = value;
  image.data[index + 2] = value;
}

function drawHollowGlyph(image, x, y, width = 5, height = 9, value = 0) {
  for (let yy = y; yy < y + height; yy += 1) {
    for (let xx = x; xx < x + width; xx += 1) {
      if (yy === y || yy === y + height - 1 || xx === x || xx === x + width - 1) {
        setPixel(image, xx, yy, value);
      }
    }
  }
}

test('alfa kanalını beyaz arka planla birleştirerek gri tona çevirir', () => {
  const image = { width: 1, height: 1, data: new Uint8ClampedArray([0, 0, 0, 0]) };
  assert.equal(rgbaToGrayscale(image).data[0], 255);
});

test('yüzdelik kontrast germe soluk görüntünün aralığını açar', () => {
  const gray = { width: 4, height: 1, data: new Uint8ClampedArray([100, 110, 120, 130]) };
  const stretched = percentileStretch(gray, { lowPercentile: 0, highPercentile: 1 });
  assert.equal(stretched.data[0], 0);
  assert.equal(stretched.data[3], 255);
});

test('Sauvola hem koyu hem açık yazı polaritesini bulur', () => {
  const dark = { width: 9, height: 9, data: new Uint8ClampedArray(81).fill(240) };
  dark.data[4 * 9 + 4] = 0;
  assert.equal(sauvolaThreshold(dark, { windowSize: 5, polarity: 'dark' }).data[40], 1);

  const light = { width: 9, height: 9, data: new Uint8ClampedArray(81).fill(15) };
  light.data[4 * 9 + 4] = 255;
  assert.equal(sauvolaThreshold(light, { windowSize: 5, polarity: 'light' }).data[40], 1);
});

test('8 bağlantılı bileşenlerin kutu ve doluluk oranını hesaplar', () => {
  const binary = { width: 5, height: 4, data: new Uint8Array(20) };
  binary.data[1 * 5 + 1] = 1;
  binary.data[1 * 5 + 2] = 1;
  binary.data[2 * 5 + 1] = 1;
  const components = connectedComponents(binary);
  assert.equal(components.length, 1);
  assert.deepEqual(components[0].bbox, { x0: 1, y0: 1, x1: 3, y1: 3, width: 2, height: 2 });
  assert.equal(components[0].fillRatio, 0.75);
});

test('morfoloji ince/kopuk karakter vuruşlarını kontrollü biçimde büyütüp birleştirir', () => {
  const binary = { width: 7, height: 3, data: new Uint8Array(21) };
  binary.data[1 * 7 + 2] = 1;
  binary.data[1 * 7 + 4] = 1;
  const dilated = dilateBinary(binary, { radiusX: 1, radiusY: 0 });
  assert.equal(dilated.data[1 * 7 + 3], 1);
  const closed = closeBinary(binary, { radiusX: 1, radiusY: 0 });
  assert.equal(closed.data[1 * 7 + 3], 1);
  const eroded = erodeBinary(dilated, { radiusX: 1, radiusY: 0 });
  assert.equal(eroded.data[1 * 7 + 3], 1);
});

test('OCR çalışmadan iki ayrı metin bölgesi adayı bulur', () => {
  const image = blankImage(180, 90);
  // Sol balon: iki satır, beş glif.
  [20, 29, 38].forEach(x => drawHollowGlyph(image, x, 18));
  [24, 33].forEach(x => drawHollowGlyph(image, x, 32));
  // Sağ balon: iki satır, altı glif.
  [112, 121, 130].forEach(x => drawHollowGlyph(image, x, 20));
  [108, 117, 126].forEach(x => drawHollowGlyph(image, x, 34));

  const result = detectTextCandidates(image, {
    polarities: ['dark'],
    windowSize: 15,
    minimumComponentsPerRegion: 2,
  });
  assert.equal(result.candidates.length, 2);
  assert.ok(result.candidates.every(candidate => candidate.componentCount >= 5));
  assert.ok(result.candidates[0].bbox.x1 < result.candidates[1].bbox.x0);
});

