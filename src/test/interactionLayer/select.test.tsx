import { fireEvent } from "@testing-library/react";

import Editor from "../../components/Canvas/Editor";
import { BrushTool } from "../../components/Canvas/types";
import { FakeMouseEvent } from "../../utils/testUtils";

describe("test for select tool", () => {
  let editor: Editor;
  let canvasElement: HTMLCanvasElement;
  beforeEach(() => {
    const divElement = document.createElement("div");
    const interactionCanvas = divElement.appendChild(
      document.createElement("canvas"),
    );
    const gridCanvas = divElement.appendChild(document.createElement("canvas"));
    const dataCanvas = divElement.appendChild(document.createElement("canvas"));
    const backgroundCanvas = divElement.appendChild(
      document.createElement("canvas"),
    );
    const mockEditor = new Editor({
      gridCanvas,
      interactionCanvas,
      dataCanvas,
      backgroundCanvas,
      width: 300,
      height: 300,
    });
    divElement.tabIndex = 1;
    divElement.onmousedown = () => {
      divElement.focus();
    };
    divElement.addEventListener("keydown", (e: any) => {
      editor.onKeyDown(e);
    });

    mockEditor.setSize(800, 800);
    editor = mockEditor;
    // initialize the canvas with select tool selecting all the pixels
    canvasElement = editor.getCanvasElement();
    editor.setBrushTool(BrushTool.SELECT);
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX: 0,
        offsetY: 0,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousemove", {
        offsetX: canvasElement.width,
        offsetY: canvasElement.height,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX: canvasElement.width,
        offsetY: canvasElement.height,
      }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("selects all the pixels in the canvas", () => {
    const columnCount = editor.getColumnCount();
    const rowCount = editor.getRowCount();
    const selectedArea = editor.getSelectedArea();
    expect(selectedArea?.startPixelIndex).toStrictEqual({
      rowIndex: 0,
      columnIndex: 0,
    });
    expect(selectedArea?.endPixelIndex).toStrictEqual({
      rowIndex: rowCount - 1,
      columnIndex: columnCount - 1,
    });
  });

  it("tests select area extension to top & bottom", () => {
    const columnCount = editor.getColumnCount();
    const rowCount = editor.getRowCount();
    const gridSquareLength = editor.getGridSquareLength();
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX: canvasElement.width / 2,
        offsetY: canvasElement.height / 2 - (gridSquareLength * rowCount) / 2,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousemove", {
        offsetX: canvasElement.width / 2,
        offsetY:
          canvasElement.height / 2 -
          (gridSquareLength * rowCount) / 2 -
          gridSquareLength,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX: canvasElement.width / 2,
        offsetY:
          canvasElement.height / 2 -
          (gridSquareLength * rowCount) / 2 -
          gridSquareLength,
      }),
    );
    const selectedArea = editor.getSelectedArea();
    expect(selectedArea?.startPixelIndex).toStrictEqual({
      rowIndex: -1,
      columnIndex: 0,
    });
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX: canvasElement.width / 2,
        offsetY: canvasElement.height / 2 + (gridSquareLength * rowCount) / 2,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousemove", {
        offsetX: canvasElement.width / 2,
        offsetY:
          canvasElement.height / 2 +
          (gridSquareLength * rowCount) / 2 +
          gridSquareLength,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX: canvasElement.width / 2,
        offsetY:
          canvasElement.height / 2 +
          (gridSquareLength * rowCount) / 2 +
          gridSquareLength,
      }),
    );
    const selectedArea2 = editor.getSelectedArea();
    expect(selectedArea2?.endPixelIndex).toStrictEqual({
      rowIndex: rowCount,
      columnIndex: columnCount - 1,
    });
  });

  it("tests select area extension to left & right", () => {
    const columnCount = editor.getColumnCount();
    const rowCount = editor.getRowCount();
    const gridSquareLength = editor.getGridSquareLength();
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX: canvasElement.width / 2 - (gridSquareLength * columnCount) / 2,
        offsetY: canvasElement.height / 2,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousemove", {
        offsetX:
          canvasElement.width / 2 -
          (gridSquareLength * columnCount) / 2 -
          gridSquareLength,
        offsetY: canvasElement.height / 2,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX:
          canvasElement.width / 2 -
          (gridSquareLength * columnCount) / 2 -
          gridSquareLength,
        offsetY: canvasElement.height / 2,
      }),
    );
    const selectedArea = editor.getSelectedArea();
    expect(selectedArea?.startPixelIndex).toStrictEqual({
      rowIndex: 0,
      columnIndex: -1,
    });
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX: canvasElement.width / 2 + (gridSquareLength * columnCount) / 2,
        offsetY: canvasElement.height / 2,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousemove", {
        offsetX:
          canvasElement.width / 2 +
          (gridSquareLength * columnCount) / 2 +
          gridSquareLength,
        offsetY: canvasElement.height / 2,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX:
          canvasElement.width / 2 +
          (gridSquareLength * columnCount) / 2 +
          gridSquareLength,
        offsetY: canvasElement.height / 2,
      }),
    );
    const selectedArea2 = editor.getSelectedArea();
    expect(selectedArea2?.endPixelIndex).toStrictEqual({
      rowIndex: rowCount - 1,
      columnIndex: columnCount,
    });
  });

  it("tests select area extension to top left", () => {
    const columnCount = editor.getColumnCount();
    const rowCount = editor.getRowCount();
    const gridSquareLength = editor.getGridSquareLength();
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX: canvasElement.width / 2 - (gridSquareLength * columnCount) / 2,
        offsetY: canvasElement.height / 2 - (gridSquareLength * rowCount) / 2,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousemove", {
        offsetX:
          canvasElement.width / 2 -
          (gridSquareLength * columnCount) / 2 -
          gridSquareLength,
        offsetY:
          canvasElement.height / 2 -
          (gridSquareLength * rowCount) / 2 -
          gridSquareLength,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX:
          canvasElement.width / 2 -
          (gridSquareLength * columnCount) / 2 -
          gridSquareLength,
        offsetY:
          canvasElement.height / 2 -
          (gridSquareLength * rowCount) / 2 -
          gridSquareLength,
      }),
    );
    const selectedArea = editor.getSelectedArea();
    expect(selectedArea?.startPixelIndex).toStrictEqual({
      rowIndex: -1,
      columnIndex: -1,
    });
  });

  it("tests select area extension to top right", () => {
    const columnCount = editor.getColumnCount();
    const rowCount = editor.getRowCount();
    const gridSquareLength = editor.getGridSquareLength();
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX: canvasElement.width / 2 + (gridSquareLength * columnCount) / 2,
        offsetY: canvasElement.height / 2 - (gridSquareLength * rowCount) / 2,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousemove", {
        offsetX:
          canvasElement.width / 2 +
          (gridSquareLength * columnCount) / 2 +
          gridSquareLength,
        offsetY:
          canvasElement.height / 2 -
          (gridSquareLength * rowCount) / 2 -
          gridSquareLength,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX:
          canvasElement.width / 2 +
          (gridSquareLength * columnCount) / 2 +
          gridSquareLength,
        offsetY:
          canvasElement.height / 2 -
          (gridSquareLength * rowCount) / 2 -
          gridSquareLength,
      }),
    );
    const selectedArea = editor.getSelectedArea();
    expect(selectedArea?.startPixelIndex.rowIndex).toBe(-1);
    expect(selectedArea?.endPixelIndex.columnIndex).toBe(columnCount);
  });

  it("tests select area extension to bottom left", () => {
    const columnCount = editor.getColumnCount();
    const rowCount = editor.getRowCount();
    const gridSquareLength = editor.getGridSquareLength();
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX: canvasElement.width / 2 - (gridSquareLength * columnCount) / 2,
        offsetY: canvasElement.height / 2 + (gridSquareLength * rowCount) / 2,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousemove", {
        offsetX:
          canvasElement.width / 2 -
          (gridSquareLength * columnCount) / 2 -
          gridSquareLength,
        offsetY:
          canvasElement.height / 2 +
          (gridSquareLength * rowCount) / 2 +
          gridSquareLength,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX:
          canvasElement.width / 2 -
          (gridSquareLength * columnCount) / 2 -
          gridSquareLength,
        offsetY:
          canvasElement.height / 2 +
          (gridSquareLength * rowCount) / 2 +
          gridSquareLength,
      }),
    );
    const selectedArea = editor.getSelectedArea();
    expect(selectedArea?.startPixelIndex.columnIndex).toBe(-1);
    expect(selectedArea?.endPixelIndex.rowIndex).toBe(rowCount);
  });

  it("tests select area extension to bottom right", () => {
    const columnCount = editor.getColumnCount();
    const rowCount = editor.getRowCount();
    const gridSquareLength = editor.getGridSquareLength();
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX: canvasElement.width / 2 + (gridSquareLength * columnCount) / 2,
        offsetY: canvasElement.height / 2 + (gridSquareLength * rowCount) / 2,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousemove", {
        offsetX:
          canvasElement.width / 2 +
          (gridSquareLength * columnCount) / 2 +
          gridSquareLength,
        offsetY:
          canvasElement.height / 2 +
          (gridSquareLength * rowCount) / 2 +
          gridSquareLength,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX:
          canvasElement.width / 2 +
          (gridSquareLength * columnCount) / 2 +
          gridSquareLength,
        offsetY:
          canvasElement.height / 2 +
          (gridSquareLength * rowCount) / 2 +
          gridSquareLength,
      }),
    );
    const selectedArea = editor.getSelectedArea();
    expect(selectedArea?.endPixelIndex).toStrictEqual({
      rowIndex: rowCount,
      columnIndex: columnCount,
    });
  });

  it("tests select area extension to top & bottom with alt pressed", () => {
    const columnCount = editor.getColumnCount();
    const rowCount = editor.getRowCount();
    const gridSquareLength = editor.getGridSquareLength();
    // we must first click the canvas to activate keydown events
    // console.log(canvasElement.parentNode);
    fireEvent(
      canvasElement.parentNode!,
      new FakeMouseEvent("mousedown", {
        offsetX: canvasElement.width / 2 - (gridSquareLength * columnCount) / 2,
        offsetY: canvasElement.height / 2 - (gridSquareLength * rowCount) / 2,
      }),
    );
    fireEvent(
      canvasElement.parentNode!,
      new KeyboardEvent("keydown", {
        key: "AltLeft",
        code: "AltLeft",
      }),
    );

    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX: canvasElement.width / 2,
        offsetY: canvasElement.height / 2 - (gridSquareLength * rowCount) / 2,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousemove", {
        offsetX: canvasElement.width / 2,
        offsetY:
          canvasElement.height / 2 -
          (gridSquareLength * rowCount) / 2 -
          gridSquareLength,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX: canvasElement.width / 2,
        offsetY:
          canvasElement.height / 2 -
          (gridSquareLength * rowCount) / 2 -
          gridSquareLength,
      }),
    );
    const selectedArea = editor.getSelectedArea();
    expect(selectedArea?.startPixelIndex.rowIndex).toBe(-1);
    expect(selectedArea?.endPixelIndex.rowIndex).toBe(rowCount);
  });

  it("tests select area extension to left & right with alt pressed", () => {
    const columnCount = editor.getColumnCount();
    const rowCount = editor.getRowCount();
    const gridSquareLength = editor.getGridSquareLength();
    // we must first click the canvas to activate keydown events
    fireEvent(
      canvasElement.parentNode!,
      new FakeMouseEvent("mousedown", {
        offsetX: canvasElement.width / 2 - (gridSquareLength * columnCount) / 2,
        offsetY: canvasElement.height / 2 - (gridSquareLength * rowCount) / 2,
      }),
    );
    fireEvent(
      canvasElement.parentNode!,
      new KeyboardEvent("keydown", {
        key: "AltLeft",
        code: "AltLeft",
      }),
    );

    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX: canvasElement.width / 2 - (gridSquareLength * columnCount) / 2,
        offsetY: canvasElement.height / 2,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousemove", {
        offsetX:
          canvasElement.width / 2 -
          (gridSquareLength * columnCount) / 2 -
          gridSquareLength,
        offsetY: canvasElement.height / 2,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX:
          canvasElement.width / 2 -
          (gridSquareLength * columnCount) / 2 -
          gridSquareLength,
        offsetY: canvasElement.height / 2,
      }),
    );
    const selectedArea = editor.getSelectedArea();
    expect(selectedArea?.startPixelIndex.columnIndex).toBe(-1);
    expect(selectedArea?.endPixelIndex.columnIndex).toBe(columnCount);
  });

  it("tests select area extension to top left & bottom right with alt pressed", () => {
    const columnCount = editor.getColumnCount();
    const rowCount = editor.getRowCount();
    const gridSquareLength = editor.getGridSquareLength();
    // we must first click the canvas to activate keydown events
    fireEvent(
      canvasElement.parentNode!,
      new FakeMouseEvent("mousedown", {
        offsetX: canvasElement.width / 2 - (gridSquareLength * columnCount) / 2,
        offsetY: canvasElement.height / 2 - (gridSquareLength * rowCount) / 2,
      }),
    );
    fireEvent(
      canvasElement.parentNode!,
      new KeyboardEvent("keydown", {
        key: "AltLeft",
        code: "AltLeft",
      }),
    );

    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX: canvasElement.width / 2 - (gridSquareLength * columnCount) / 2,
        offsetY: canvasElement.height / 2 - (gridSquareLength * rowCount) / 2,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousemove", {
        offsetX:
          canvasElement.width / 2 -
          (gridSquareLength * columnCount) / 2 -
          gridSquareLength,
        offsetY:
          canvasElement.height / 2 -
          (gridSquareLength * rowCount) / 2 -
          gridSquareLength,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX:
          canvasElement.width / 2 -
          (gridSquareLength * columnCount) / 2 -
          gridSquareLength,
        offsetY:
          canvasElement.height / 2 -
          (gridSquareLength * rowCount) / 2 -
          gridSquareLength,
      }),
    );
    const selectedArea = editor.getSelectedArea();
    expect(selectedArea?.startPixelIndex.columnIndex).toBe(-1);
    expect(selectedArea?.startPixelIndex.rowIndex).toBe(-1);
    expect(selectedArea?.endPixelIndex.columnIndex).toBe(columnCount);
    expect(selectedArea?.endPixelIndex.rowIndex).toBe(rowCount);
  });

  it("tests select area extension to top right & bottom left with alt pressed", () => {
    const columnCount = editor.getColumnCount();
    const rowCount = editor.getRowCount();
    const gridSquareLength = editor.getGridSquareLength();
    // we must first click the canvas to activate keydown events
    fireEvent(
      canvasElement.parentNode!,
      new FakeMouseEvent("mousedown", {
        offsetX: canvasElement.width / 2 - (gridSquareLength * columnCount) / 2,
        offsetY: canvasElement.height / 2 - (gridSquareLength * rowCount) / 2,
      }),
    );
    fireEvent(
      canvasElement.parentNode!,
      new KeyboardEvent("keydown", {
        key: "AltLeft",
        code: "AltLeft",
      }),
    );

    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX: canvasElement.width / 2 + (gridSquareLength * columnCount) / 2,
        offsetY: canvasElement.height / 2 + (gridSquareLength * rowCount) / 2,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousemove", {
        offsetX:
          canvasElement.width / 2 +
          (gridSquareLength * columnCount) / 2 +
          gridSquareLength,
        offsetY:
          canvasElement.height / 2 +
          (gridSquareLength * rowCount) / 2 +
          gridSquareLength,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX:
          canvasElement.width / 2 +
          (gridSquareLength * columnCount) / 2 +
          gridSquareLength,
        offsetY:
          canvasElement.height / 2 +
          (gridSquareLength * rowCount) / 2 +
          gridSquareLength,
      }),
    );
    const selectedArea = editor.getSelectedArea();
    expect(selectedArea?.startPixelIndex.columnIndex).toBe(-1);
    expect(selectedArea?.startPixelIndex.rowIndex).toBe(-1);
    expect(selectedArea?.endPixelIndex.columnIndex).toBe(columnCount);
    expect(selectedArea?.endPixelIndex.rowIndex).toBe(rowCount);
  });
});
