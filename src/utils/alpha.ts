export const normalizeAlpha = (alpha = 1) =>
  Number.isFinite(alpha) ? Math.min(1, Math.max(0, alpha)) : 1;

export const normalizeOptionalAlpha = (alpha?: number) =>
  alpha === undefined ? undefined : normalizeAlpha(alpha);

export const compactAlpha = (alpha: number) => {
  const normalizedAlpha = normalizeAlpha(alpha);
  return normalizedAlpha === 1 ? undefined : normalizedAlpha;
};

export const createPixelData = (color: string, alpha?: number) =>
  alpha === undefined
    ? { color }
    : { color, alpha: normalizeAlpha(alpha) };
