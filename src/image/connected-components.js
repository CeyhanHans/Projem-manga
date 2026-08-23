import { normalizeRect } from '../core/geometry.js';

const NEIGHBORS_4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const NEIGHBORS_8 = [...NEIGHBORS_4, [1, 1], [1, -1], [-1, 1], [-1, -1]];

export function connectedComponents(binaryImage, options = {}) {
  const { width, height, data } = binaryImage;
  if (!data || data.length !== width * height) throw new TypeError('Binary image boyutu geçersiz.');
  const neighbors = options.connectivity === 4 ? NEIGHBORS_4 : NEIGHBORS_8;
  const visited = new Uint8Array(data.length);
  const queue = new Int32Array(data.length);
  const components = [];

  for (let seed = 0; seed < data.length; seed += 1) {
    if (!data[seed] || visited[seed]) continue;
    let head = 0;
    let tail = 0;
    queue[tail++] = seed;
    visited[seed] = 1;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let pixels = 0;

    while (head < tail) {
      const index = queue[head++];
      const x = index % width;
      const y = Math.floor(index / width);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      pixels += 1;
      for (const [dx, dy] of neighbors) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const next = ny * width + nx;
        if (data[next] && !visited[next]) {
          visited[next] = 1;
          queue[tail++] = next;
        }
      }
    }

    const bbox = normalizeRect({ x0: minX, y0: minY, x1: maxX + 1, y1: maxY + 1 });
    components.push({
      id: `component-${components.length + 1}`,
      bbox,
      pixels,
      fillRatio: pixels / Math.max(1, bbox.width * bbox.height),
      aspectRatio: bbox.width / Math.max(1, bbox.height),
    });
  }
  return components;
}

