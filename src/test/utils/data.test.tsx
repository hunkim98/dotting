import { DefaultPixelDataDimensions } from "../../components/Canvas/config";
import { DottingData, PixelModifyItem } from "../../components/Canvas/types";
import { DottingDataLayer } from "../../helpers/DottingDataLayer";
import { getInBetweenPixelIndicesfromCoords } from "../../utils/data";

describe("test for data utils", () => {
  let data: DottingData;
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
    const dottingDataLayer = new DottingDataLayer({
      data: defaultNestedArray,
      id: "layer1",
    });
    data = dottingDataLayer.getData();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * TODO:
   * 1. check if getInBetweenPixelIndicesfromCoords returns correct indices
   * Assigned to: 방호찬
   * ⬇️
   */
  it("test getInBetweenPixelIndicesfromCoords when coord is out of bound", () => {
    const result = getInBetweenPixelIndicesfromCoords(
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      10,
      data,
    );
    expect(result).toEqual(undefined);
  });

  it("test getInBetweenPixelIndicesfromCoords when coord is inside bounds", () => {
    expect(1).toBe(1);
  });
  // add more tests below...
  /** ⬆️ */
});
