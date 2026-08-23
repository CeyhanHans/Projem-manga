import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateDetection, intersectionOverUnion } from '../src/diagnostics/evaluate-detection.js';

test('aynı kutular için IoU 1 döndürür', () => {
  const box = { x0: 10, y0: 10, x1: 50, y1: 50 };
  assert.equal(intersectionOverUnion(box, box), 1);
});

test('beklenen ve bulunan balonlar için precision/recall ölçer', () => {
  const expected = [
    { id: 'a', bbox: { x0: 0, y0: 0, x1: 100, y1: 100 } },
    { id: 'b', bbox: { x0: 200, y0: 0, x1: 300, y1: 100 } },
  ];
  const detected = [
    { id: 'region-1', balloonBox: { x0: 5, y0: 5, x1: 95, y1: 95 } },
    { id: 'region-noise', balloonBox: { x0: 500, y0: 500, x1: 550, y1: 550 } },
  ];
  const result = evaluateDetection(expected, detected);
  assert.equal(result.matches.length, 1);
  assert.deepEqual(result.missed, ['b']);
  assert.deepEqual(result.falsePositives, ['region-noise']);
  assert.equal(result.precision, 0.5);
  assert.equal(result.recall, 0.5);
  assert.equal(result.f1, 0.5);
});

