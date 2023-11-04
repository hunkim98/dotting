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

  it("test color pixel for a single item", () => {
    const rowIndex = 0;
    const columnIndex = 0;
    const color = "red";

    dataLayer.colorPixels([{ rowIndex, columnIndex, color }]);

    const targetColor = dataLayer
      .getData()
      .get(rowIndex)!
      .get(columnIndex)!.color;
    expect(targetColor).toBe(color);
  });

  it("test color pixel for multiple items", () => {
    const itemsToColor: PixelModifyItem[] = [
      {
        rowIndex: 0,
        columnIndex: 0,
        color: "red",
      },
      {
        rowIndex: 1,
        columnIndex: 1,
        color: "black",
      },
    ];

    dataLayer.colorPixels(itemsToColor);

    for (const item of itemsToColor) {
      const targetColor = dataLayer
        .getData()
        .get(item.rowIndex)!
        .get(item.columnIndex)!.color;
      expect(targetColor).toBe(item.color);
    }
  });

  it("test color pixel for an item that has a rowIndex smaller than topRowIndex", () => {
    const rowIndex = -5;
    const columnIndex = 0;
    const color = "red";

    dataLayer.colorPixels([{ rowIndex, columnIndex, color }]);

    const targetColor = dataLayer
      .getData()
      .get(rowIndex)!
      .get(columnIndex)!.color;
    expect(targetColor).toBe(color);
  });

  it("test color pixel for an item that has a rowIndex bigger than bottomRowIndex", () => {
    const rowIndex = dataLayer.getRowCount() + 5;
    const columnIndex = 0;
    const color = "red";

    dataLayer.colorPixels([{ rowIndex, columnIndex, color }]);

    const targetColor = dataLayer
      .getData()
      .get(rowIndex)!
      .get(columnIndex)!.color;
    expect(targetColor).toBe(color);
  });

  it("test color pixel for an item that has a columnIndex smaller than leftColumnIndex", () => {
    const rowIndex = 0;
    const columnIndex = -5;
    const color = "red";

    dataLayer.colorPixels([{ rowIndex, columnIndex, color }]);

    const targetColor = dataLayer
      .getData()
      .get(rowIndex)!
      .get(columnIndex)!.color;
    expect(targetColor).toBe(color);
  });

  it("test color pixel for an item that has a columnIndex bigger than rightColumnIndex", () => {
    const rowIndex = 0;
    const columnIndex = dataLayer.getColumnCount() + 5;
    const color = "red";

    dataLayer.colorPixels([{ rowIndex, columnIndex, color }]);

    const targetColor = dataLayer
      .getData()
      .get(rowIndex)!
      .get(columnIndex)!.color;
    expect(targetColor).toBe(color);
  });
});
