import test from 'node:test';
import assert from 'node:assert/strict';
import { fitTextToBox, wrapText } from '../src/layout/text-fit.js';
import { buildFontProfile } from '../src/layout/font-profile.js';

test('Türkçe çeviriyi balon genişliğine göre satırlara böler', () => {
  const result = fitTextToBox('NEREYE GİDİYORSUN?', { width: 180, height: 100 }, {
    minFontSize: 10,
    maxFontSize: 40,
  });
  assert.equal(result.overflow, false);
  assert.ok(result.lines.length >= 2);
  assert.ok(result.fontSize >= 10);
});

test('sığmayan çeviriyi sessizce kesmez ve uyarı üretir', () => {
  const result = fitTextToBox(
    'Bu aşırı uzun Türkçe cümle çok küçük bir konuşma balonuna kesinlikle sığmayacak.',
    { width: 45, height: 22 },
    { minFontSize: 12, maxFontSize: 20 },
  );
  assert.equal(result.overflow, true);
  assert.equal(result.warnings.length, 1);
  assert.match(result.text, /kesinlikle/);
});

test('uzun ve boşluksuz bir kelimeyi taşırmadan parçalar', () => {
  const lines = wrapText('olağanüstüuzunluktabirkelime', 60, value => value.length * 8);
  assert.ok(lines.length > 1);
  assert.ok(lines.every(line => line.length * 8 <= 60));
});

test('yüksek oranda büyük harfli ünleme güçlü font profili verir', () => {
  const profile = buildFontProfile('DUR!!');
  assert.equal(profile.emphatic, true);
  assert.equal(profile.weight, 700);
});

