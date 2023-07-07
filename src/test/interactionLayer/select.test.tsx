import { createEvent, fireEvent } from "@testing-library/react";

import Editor from "../../components/Canvas/Editor";
import { BrushTool } from "../../components/Canvas/types";
import { FakeMouseEvent } from "../../utils/testUtils";

describe("Dotting Component", () => {
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
    });
    mockEditor.setSize(800, 800);
    editor = mockEditor;

    canvasElement = editor.getCanvasElement();
    // const gridSquareLength = editor.getGridSquareLength();
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
});
