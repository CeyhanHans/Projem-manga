function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function createDebugOverlay(analysis, options = {}) {
  const width = analysis.image.width ?? options.width ?? 1280;
  const height = analysis.image.height ?? options.height ?? 720;
  const boxes = analysis.regions.map(region => {
    const box = region.balloonBox;
    const color = region.confidence >= 75 ? '#22c55e' : region.confidence >= 50 ? '#f59e0b' : '#ef4444';
    return `<g data-region="${escapeXml(region.id)}">
  <rect x="${box.x0}" y="${box.y0}" width="${box.width}" height="${box.height}" fill="none" stroke="${color}" stroke-width="3"/>
  <rect x="${box.x0}" y="${Math.max(0, box.y0 - 24)}" width="150" height="24" fill="${color}" opacity="0.9"/>
  <text x="${box.x0 + 5}" y="${Math.max(16, box.y0 - 7)}" fill="#fff" font-family="Arial" font-size="14">${escapeXml(region.id)} · ${region.confidence}%</text>
</g>`;
  }).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
${boxes}
</svg>`;
}

