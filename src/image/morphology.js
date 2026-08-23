function validate(binaryImage) {
  if (!binaryImage?.data || binaryImage.data.length !== binaryImage.width * binaryImage.height) {
    throw new TypeError('Binary image boyutu geçersiz.');
  }
}

export function dilateBinary(binaryImage, options = {}) {
  validate(binaryImage);
  const radiusX = Math.max(0, Math.round(options.radiusX ?? options.radius ?? 1));
  const radiusY = Math.max(0, Math.round(options.radiusY ?? options.radius ?? 1));
  const { width, height, data } = binaryImage;
  const output = new Uint8Array(data.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let found = false;
      for (let dy = -radiusY; dy <= radiusY && !found; dy += 1) {
        const yy = y + dy;
        if (yy < 0 || yy >= height) continue;
        for (let dx = -radiusX; dx <= radiusX; dx += 1) {
          const xx = x + dx;
          if (xx >= 0 && xx < width && data[yy * width + xx]) {
            found = true;
            break;
          }
        }
      }
      output[y * width + x] = Number(found);
    }
  }
  return { width, height, data: output };
}

export function erodeBinary(binaryImage, options = {}) {
  validate(binaryImage);
  const radiusX = Math.max(0, Math.round(options.radiusX ?? options.radius ?? 1));
  const radiusY = Math.max(0, Math.round(options.radiusY ?? options.radius ?? 1));
  const { width, height, data } = binaryImage;
  const output = new Uint8Array(data.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let complete = true;
      for (let dy = -radiusY; dy <= radiusY && complete; dy += 1) {
        const yy = y + dy;
        for (let dx = -radiusX; dx <= radiusX; dx += 1) {
          const xx = x + dx;
          if (xx < 0 || yy < 0 || xx >= width || yy >= height || !data[yy * width + xx]) {
            complete = false;
            break;
          }
        }
      }
      output[y * width + x] = Number(complete);
    }
  }
  return { width, height, data: output };
}

export function openBinary(binaryImage, options = {}) {
  return dilateBinary(erodeBinary(binaryImage, options), options);
}

export function closeBinary(binaryImage, options = {}) {
  return erodeBinary(dilateBinary(binaryImage, options), options);
}

