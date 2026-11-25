function parseHexChannel(hex: string, offset: number): number {
  const srgb = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const normalized = hex.trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error(`Expected 6-digit hex color, received "${hex}"`);
  }
  const r = parseHexChannel(normalized, 1);
  const g = parseHexChannel(normalized, 3);
  const b = parseHexChannel(normalized, 5);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(foregroundHex: string, backgroundHex: string): number {
  const lumA = relativeLuminance(foregroundHex);
  const lumB = relativeLuminance(backgroundHex);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}
