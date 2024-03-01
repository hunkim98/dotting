import { Indices } from "../../utils/types";
import { isValidIndicesRange } from "../../utils/validation";

describe("test for validation", () => {
  let indices: Indices = {
    topRowIndex: 0,
    bottomRowIndex: 10,
    leftColumnIndex: 0,
    rightColumnIndex: 10,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("test if is valid indices range returns true", () => {
    expect(isValidIndicesRange(5, 5, indices)).toEqual(true);
  });

  it("test if is valid indices range returns false for row index that is at the top", () => {
    expect(isValidIndicesRange(-5, 5, indices)).toEqual(false);
  });

  it("test if is valid indices range returns false for row index that is at the bottom", () => {
    expect(isValidIndicesRange(15, 5, indices)).toEqual(false);
  });

  it("test if is valid indices range returns false for column index that is at the left", () => {
    expect(isValidIndicesRange(5, -5, indices)).toEqual(false);
  });

  it("test if is valid indices range returns false for column index that is at the right", () => {
    expect(isValidIndicesRange(5, 15, indices)).toEqual(false);
  });
});
