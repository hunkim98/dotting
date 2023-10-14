import { DefaultPixelDataDimensions } from "../../components/Canvas/config";
import { DottingData, PixelModifyItem } from "../../components/Canvas/types";
import { DottingDataLayer } from "../../helpers/DottingDataLayer";
import { getInBetweenPixelIndicesfromCoords } from "../../utils/data";
import { Index } from "../../utils/types";

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
    //testing with simple vertical line
    const result = getInBetweenPixelIndicesfromCoords(
      { x: 5, y: 25 },
      { x: 5, y: -15 },
      10,
      data,
    );
    expect(result).toEqual(undefined);
  });

  it("test getInBetweenPixelIndicesfromCoords when coord is inside bounds", () => {
    //testing with simple vertical line
    const result = getInBetweenPixelIndicesfromCoords(
      { x: 5, y: 5 },
      { x: 5, y: 45 },
      10,
      data,
    );
    const answer : Index[] = [];
    answer.push({rowIndex: 0, columnIndex: 0});
    answer.push({rowIndex: 1, columnIndex: 0});
    answer.push({rowIndex: 2, columnIndex: 0});
    answer.push({rowIndex: 3, columnIndex: 0});
    // answer.push({rowIndex: 4, columnIndex: 0});
    expect(result).toEqual(answer);
  });
  // add more tests below...
  /** ⬆️ */
});
