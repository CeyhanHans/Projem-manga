export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function normalizeRect(rect) {
  const x0 = Number(rect?.x0 ?? rect?.left ?? rect?.x ?? 0);
  const y0 = Number(rect?.y0 ?? rect?.top ?? rect?.y ?? 0);
  const width = Number(rect?.width ?? ((rect?.x1 ?? x0) - x0));
  const height = Number(rect?.height ?? ((rect?.y1 ?? y0) - y0));
  const x1 = Number(rect?.x1 ?? (x0 + width));
  const y1 = Number(rect?.y1 ?? (y0 + height));
  return {
    x0: Math.min(x0, x1),
    y0: Math.min(y0, y1),
    x1: Math.max(x0, x1),
    y1: Math.max(y0, y1),
    width: Math.abs(x1 - x0),
    height: Math.abs(y1 - y0),
  };
}

export function unionRects(rects) {
  if (!rects.length) return normalizeRect({ x0: 0, y0: 0, x1: 0, y1: 0 });
  const normalized = rects.map(normalizeRect);
  return normalizeRect({
    x0: Math.min(...normalized.map(r => r.x0)),
    y0: Math.min(...normalized.map(r => r.y0)),
    x1: Math.max(...normalized.map(r => r.x1)),
    y1: Math.max(...normalized.map(r => r.y1)),
  });
}

export function expandRect(rect, padding, bounds = null) {
  const source = normalizeRect(rect);
  const px = typeof padding === 'number' ? padding : Number(padding?.x ?? 0);
  const py = typeof padding === 'number' ? padding : Number(padding?.y ?? 0);
  const expanded = normalizeRect({
    x0: source.x0 - px,
    y0: source.y0 - py,
    x1: source.x1 + px,
    y1: source.y1 + py,
  });
  if (!bounds) return expanded;
  const limit = normalizeRect(bounds);
  return normalizeRect({
    x0: clamp(expanded.x0, limit.x0, limit.x1),
    y0: clamp(expanded.y0, limit.y0, limit.y1),
    x1: clamp(expanded.x1, limit.x0, limit.x1),
    y1: clamp(expanded.y1, limit.y0, limit.y1),
  });
}

export function axisOverlap(aStart, aEnd, bStart, bEnd) {
  return Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart));
}

export function overlapRatio(a, b, axis = 'x') {
  const ra = normalizeRect(a);
  const rb = normalizeRect(b);
  if (axis === 'y') {
    const denominator = Math.max(1, Math.min(ra.height, rb.height));
    return axisOverlap(ra.y0, ra.y1, rb.y0, rb.y1) / denominator;
  }
  const denominator = Math.max(1, Math.min(ra.width, rb.width));
  return axisOverlap(ra.x0, ra.x1, rb.x0, rb.x1) / denominator;
}

export function horizontalGap(a, b) {
  const ra = normalizeRect(a);
  const rb = normalizeRect(b);
  if (ra.x1 < rb.x0) return rb.x0 - ra.x1;
  if (rb.x1 < ra.x0) return ra.x0 - rb.x1;
  return 0;
}

export function verticalGap(a, b) {
  const ra = normalizeRect(a);
  const rb = normalizeRect(b);
  if (ra.y1 < rb.y0) return rb.y0 - ra.y1;
  if (rb.y1 < ra.y0) return ra.y0 - rb.y1;
  return 0;
}

export function center(rect) {
  const r = normalizeRect(rect);
  return { x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2 };
}

export function rectArea(rect) {
  const r = normalizeRect(rect);
  return r.width * r.height;
}

