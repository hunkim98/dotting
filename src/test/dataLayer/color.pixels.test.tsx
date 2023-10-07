import { DefaultPixelDataDimensions } from "../../components/Canvas/config";
import DataLayer from "../../components/Canvas/DataLayer";
import { PixelModifyItem } from "../../components/Canvas/types";

describe("test for color pixel method in data layer", () => {
  let dataLayer: DataLayer;
  beforeEach(() => {
    const defaultNestedArray: Array<Array<PixelModifyItem>> = [];
    const { rowCount, columnCount } = DefaultPixelDataDimensions;
    for (let i = 0; i < rowCount; i++) {
      defaultNestedArray.push([]);
      for (let j = 0; j < columnCount; j++) {
        defaultNestedArray[i].push({
          color: "",
          rowIndex: i,
          columnIndex: j,
        });
      }
    }
    const dataCanvas = document.createElement("canvas");
    dataCanvas.width = 800;
    dataCanvas.height = 800;
    dataLayer = new DataLayer({
      canvas: dataCanvas,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * TODO:
   * 1. test colorPixels method for single item
   * 2. test colorPixels method for multiple items
   * 3. test colorPixels method that are out of current bounds
   * Assigned to: 권혁범
   * ⬇️
   */
  it("test color pixel for a single item", () => {
    expect(1).toBe(1);
  });

  it("test color pixel for multiple items", () => {
    expect(1).toBe(1);
  });

  it("test color pixel for an item that has a rowIndex smaller than topRowIndex", () => {
    expect(1).toBe(1);
  });

  it("test color pixel for an item that has a rowIndex bigger than bottomRowIndex", () => {
    expect(1).toBe(1);
  });

  it("test color pixel for an item that has a columnIndex smaller than leftColumnIndex", () => {
    expect(1).toBe(1);
  });

  it("test color pixel for an item that has a columnIndex bigger than rightColumnIndex", () => {
    expect(1).toBe(1);
  });
  // add more tests below...
  // Remind to test for all cases in if-else statements
  /** ⬆️ */
});
