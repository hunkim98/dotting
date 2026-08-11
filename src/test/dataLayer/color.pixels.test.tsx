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

  it("stores and clamps alpha supplied through colorPixels", () => {
    dataLayer.colorPixels([
      { rowIndex: 0, columnIndex: 0, color: "red", alpha: 1.5 },
    ]);

    expect(dataLayer.getData().get(0)!.get(0)).toEqual({
      color: "red",
      alpha: 1,
    });
  });

  it("renders visible layers from bottom to top for alpha compositing", () => {
    const dataCanvas = document.createElement("canvas");
    const layerData = (color: string, alpha?: number): PixelModifyItem[][] => [
      [
        { rowIndex: 0, columnIndex: 0, color, alpha },
        { rowIndex: 0, columnIndex: 1, color: "" },
      ],
      [
        { rowIndex: 1, columnIndex: 0, color: "" },
        { rowIndex: 1, columnIndex: 1, color: "" },
      ],
    ];
    const layeredData = new DataLayer({
      canvas: dataCanvas,
      layers: [
        {
          id: "top",
          data: layerData("#ff0000", 0.5),
        },
        {
          id: "bottom",
          data: layerData("#0000ff"),
        },
      ],
    });
    layeredData.setCriterionDataForRendering(layeredData.getData());
    layeredData.setSize(100, 100, 1);
    layeredData.setDpr(1);
    layeredData.setDefaultPixelColor("");

    const context = dataCanvas.getContext("2d")!;
    const renderedColors: Array<string | CanvasGradient | CanvasPattern> = [];
    const renderedAlphas: number[] = [];
    let fillStyle: string | CanvasGradient | CanvasPattern = "#000000";
    let globalAlpha = 1;
    Object.defineProperty(context, "fillStyle", {
      configurable: true,
      get: () => fillStyle,
      set: value => {
        fillStyle = value;
        renderedColors.push(value);
      },
    });
    Object.defineProperty(context, "globalAlpha", {
      configurable: true,
      get: () => globalAlpha,
      set: value => {
        globalAlpha = value;
        renderedAlphas.push(value);
      },
    });

    layeredData.render();

    expect(renderedColors).toEqual(["#0000ff", "#ff0000"]);
    expect(renderedAlphas).toEqual([1, 0.5]);
  });
});
