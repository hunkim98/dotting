import {
  compactAlpha,
  createPixelData,
  normalizeAlpha,
} from "../../utils/alpha";

describe("alpha utilities", () => {
  it("clamps alpha to the canvas range", () => {
    expect(normalizeAlpha(-1)).toBe(0);
    expect(normalizeAlpha(0.4)).toBe(0.4);
    expect(normalizeAlpha(2)).toBe(1);
    expect(normalizeAlpha(Number.NaN)).toBe(1);
  });

  it("omits the default alpha while preserving fractional alpha", () => {
    expect(compactAlpha(1)).toBeUndefined();
    expect(createPixelData("red", compactAlpha(1))).toEqual({ color: "red" });
    expect(createPixelData("red", 0.4)).toEqual({ color: "red", alpha: 0.4 });
  });
});
