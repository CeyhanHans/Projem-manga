import { clamp } from '../core/geometry.js';

export function validateImageData(imageData) {
  const width = Number(imageData?.width);
  const height = Number(imageData?.height);
  const data = imageData?.data;
  if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) {
    throw new TypeError('ImageData width ve height pozitif tam sayı olmalı.');
  }
  if (!data || data.length !== width * height * 4) {
    throw new TypeError('ImageData.data uzunluğu width × height × 4 olmalı.');
  }
  return { width, height, data };
}

export function rgbaToGrayscale(imageData, options = {}) {
  const { width, height, data } = validateImageData(imageData);
  const background = options.alphaBackground ?? 255;
  const gray = new Uint8ClampedArray(width * height);
  for (let pixel = 0, rgba = 0; pixel < gray.length; pixel += 1, rgba += 4) {
    const alpha = data[rgba + 3] / 255;
    const luminance = 0.299 * data[rgba] + 0.587 * data[rgba + 1] + 0.114 * data[rgba + 2];
    gray[pixel] = Math.round(luminance * alpha + background * (1 - alpha));
  }
  return { width, height, data: gray };
}

export function percentileStretch(grayImage, options = {}) {
  const lowPercentile = clamp(options.lowPercentile ?? 0.02, 0, 1);
  const highPercentile = clamp(options.highPercentile ?? 0.98, 0, 1);
  if (lowPercentile >= highPercentile) throw new RangeError('Alt yüzdelik üst yüzdelikten küçük olmalı.');
  const histogram = new Uint32Array(256);
  for (const value of grayImage.data) histogram[value] += 1;
  const total = grayImage.data.length;
  const percentileValue = percentile => {
    const target = Math.max(0, Math.ceil(total * percentile) - 1);
    let cumulative = 0;
    for (let value = 0; value < histogram.length; value += 1) {
      cumulative += histogram[value];
      if (cumulative > target) return value;
    }
    return 255;
  };
  const low = percentileValue(lowPercentile);
  const high = percentileValue(highPercentile);
  if (high <= low) return { ...grayImage, data: new Uint8ClampedArray(grayImage.data), low, high };
  const scale = 255 / (high - low);
  const output = new Uint8ClampedArray(total);
  for (let index = 0; index < total; index += 1) {
    output[index] = Math.round(clamp((grayImage.data[index] - low) * scale, 0, 255));
  }
  return { width: grayImage.width, height: grayImage.height, data: output, low, high };
}

export function resizeGrayscale(grayImage, scale) {
  if (!(scale > 0 && scale <= 1)) throw new RangeError('Downscale değeri 0 ile 1 arasında olmalı.');
  if (scale === 1) return { ...grayImage, data: new Uint8ClampedArray(grayImage.data), scale };
  const width = Math.max(1, Math.round(grayImage.width * scale));
  const height = Math.max(1, Math.round(grayImage.height * scale));
  const output = new Uint8ClampedArray(width * height);
  for (let y = 0; y < height; y += 1) {
    const sourceY = Math.min(grayImage.height - 1, Math.floor(y / scale));
    for (let x = 0; x < width; x += 1) {
      const sourceX = Math.min(grayImage.width - 1, Math.floor(x / scale));
      output[y * width + x] = grayImage.data[sourceY * grayImage.width + sourceX];
    }
  }
  return { width, height, data: output, scale };
}

export function limitImageSize(grayImage, maximumPixels = 2_500_000) {
  const pixels = grayImage.width * grayImage.height;
  if (pixels <= maximumPixels) return { ...grayImage, data: new Uint8ClampedArray(grayImage.data), scale: 1 };
  return resizeGrayscale(grayImage, Math.sqrt(maximumPixels / pixels));
}

