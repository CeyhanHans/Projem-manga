function buildIntegral(data, width, height, squared = false) {
  const stride = width + 1;
  const integral = new Float64Array(stride * (height + 1));
  for (let y = 1; y <= height; y += 1) {
    let rowSum = 0;
    for (let x = 1; x <= width; x += 1) {
      const value = data[(y - 1) * width + (x - 1)];
      rowSum += squared ? value * value : value;
      integral[y * stride + x] = integral[(y - 1) * stride + x] + rowSum;
    }
  }
  return integral;
}

function areaSum(integral, stride, x0, y0, x1, y1) {
  return integral[y1 * stride + x1] - integral[y0 * stride + x1] -
    integral[y1 * stride + x0] + integral[y0 * stride + x0];
}

export function sauvolaThreshold(grayImage, options = {}) {
  const { width, height, data } = grayImage;
  const requestedWindow = Math.max(3, Math.round(options.windowSize ?? 31));
  const windowSize = requestedWindow % 2 ? requestedWindow : requestedWindow + 1;
  const radius = Math.floor(windowSize / 2);
  const k = options.k ?? 0.22;
  const dynamicRange = options.dynamicRange ?? 128;
  const polarity = options.polarity ?? 'dark';
  const integral = buildIntegral(data, width, height, false);
  const squaredIntegral = buildIntegral(data, width, height, true);
  const stride = width + 1;
  const mask = new Uint8Array(width * height);

  for (let y = 0; y < height; y += 1) {
    const y0 = Math.max(0, y - radius);
    const y1 = Math.min(height, y + radius + 1);
    for (let x = 0; x < width; x += 1) {
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(width, x + radius + 1);
      const count = (x1 - x0) * (y1 - y0);
      const sum = areaSum(integral, stride, x0, y0, x1, y1);
      const squareSum = areaSum(squaredIntegral, stride, x0, y0, x1, y1);
      const mean = sum / count;
      const variance = Math.max(0, squareSum / count - mean * mean);
      const deviation = Math.sqrt(variance);
      const value = data[y * width + x];
      // Açık renkli yazıda görüntüyü matematiksel olarak ters çevirip aynı
      // "koyu foreground" formülünü uygula. Yalnızca sonucu ters çevirmek,
      // yerel ortalamayı yanlış bırakır ve değişken arka planda hatalı maske üretir.
      const workingMean = polarity === 'light' ? 255 - mean : mean;
      const workingValue = polarity === 'light' ? 255 - value : value;
      const threshold = workingMean * (1 + k * (deviation / dynamicRange - 1));
      mask[y * width + x] = Number(workingValue < threshold);
    }
  }
  return { width, height, data: mask, polarity, windowSize, k };
}

export function binaryDensity(binaryImage) {
  let foreground = 0;
  for (const value of binaryImage.data) foreground += value ? 1 : 0;
  return foreground / Math.max(1, binaryImage.data.length);
}

