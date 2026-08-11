import { fireEvent } from "@testing-library/react";

import Editor from "../../components/Canvas/Editor";
import { BrushTool } from "../../components/Canvas/types";
import { FakeMouseEvent } from "../../utils/testUtils";

describe("test for drawing interaction", () => {
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
    const foregroundCanvas = divElement.appendChild(
      document.createElement("canvas"),
    );
    const mockEditor = new Editor({
      gridCanvas,
      interactionCanvas,
      dataCanvas,
      backgroundCanvas,
      foregroundCanvas,
      width: 800,
      height: 800,
    });
    divElement.tabIndex = 1;
    divElement.onmousedown = () => {
      divElement.focus();
    };
    divElement.addEventListener("keydown", (e: any) => {
      editor.onKeyDown(e);
    });

    editor = mockEditor;
    // initialize the canvas with select tool selecting all the pixels
    canvasElement = editor.getCanvasElement();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("test if bresenhamindces work when mouse is moved along the canvas", () => {
    const columnCount = editor.getColumnCount();
    const rowCount = editor.getRowCount();
    const gridSquareLength = editor.getGridSquareLength();

    editor.setDefaultPixelColor("#FF0000");

    // select (0,0) to (moveTo.x, moveTo.y)
    const moveTo = { x: 5, y: 5 };
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX:
          canvasElement.width / 2 -
          (gridSquareLength * columnCount) / 2 +
          gridSquareLength / 2,
        offsetY:
          canvasElement.height / 2 -
          (gridSquareLength * rowCount) / 2 +
          gridSquareLength / 2,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousemove", {
        offsetX:
          canvasElement.width / 2 -
          (gridSquareLength * columnCount) / 2 +
          gridSquareLength / 2,
        offsetY:
          canvasElement.height / 2 -
          (gridSquareLength * rowCount) / 2 +
          gridSquareLength / 2,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousemove", {
        offsetX:
          canvasElement.width / 2 -
          (gridSquareLength * columnCount) / 2 +
          gridSquareLength / 2 +
          gridSquareLength * moveTo.x,
        offsetY:
          canvasElement.height / 2 -
          (gridSquareLength * rowCount) / 2 +
          gridSquareLength / 2 +
          gridSquareLength * moveTo.y,
      }),
    );

    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX:
          canvasElement.width / 2 -
          (gridSquareLength * columnCount) / 2 +
          gridSquareLength / 2 +
          gridSquareLength * moveTo.x,
        offsetY:
          canvasElement.height / 2 -
          (gridSquareLength * rowCount) / 2 +
          gridSquareLength / 2 +
          gridSquareLength * moveTo.y,
      }),
    );

    const data = editor.getLayers()[0].data;
    const pixels: { x: number; y: number }[] = [];
    data.forEach((colElement, row) => {
      colElement.forEach((pixel, col) => {
        if (pixel.color != "") pixels.push({ x: row, y: col });
      });
    });

    const answer = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
      { x: 4, y: 4 },
      { x: 5, y: 5 },
    ];
    expect(pixels).toEqual(answer);
  });

  it("test if drawing is blocked when isDrawingEnabled is false", () => {
    const columnCount = editor.getColumnCount();
    const rowCount = editor.getRowCount();
    const gridSquareLength = editor.getGridSquareLength();
    editor.setIsDrawingEnabled(false);

    editor.setDefaultPixelColor("#FF0000");

    // select (0,0) to (moveTo.x, moveTo.y)
    const moveTo = { x: 5, y: 5 };
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX:
          canvasElement.width / 2 -
          (gridSquareLength * columnCount) / 2 +
          gridSquareLength / 2,
        offsetY:
          canvasElement.height / 2 -
          (gridSquareLength * rowCount) / 2 +
          gridSquareLength / 2,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousemove", {
        offsetX:
          canvasElement.width / 2 -
          (gridSquareLength * columnCount) / 2 +
          gridSquareLength / 2,
        offsetY:
          canvasElement.height / 2 -
          (gridSquareLength * rowCount) / 2 +
          gridSquareLength / 2,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousemove", {
        offsetX:
          canvasElement.width / 2 -
          (gridSquareLength * columnCount) / 2 +
          gridSquareLength / 2 +
          gridSquareLength * moveTo.x,
        offsetY:
          canvasElement.height / 2 -
          (gridSquareLength * rowCount) / 2 +
          gridSquareLength / 2 +
          gridSquareLength * moveTo.y,
      }),
    );

    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX:
          canvasElement.width / 2 -
          (gridSquareLength * columnCount) / 2 +
          gridSquareLength / 2 +
          gridSquareLength * moveTo.x,
        offsetY:
          canvasElement.height / 2 -
          (gridSquareLength * rowCount) / 2 +
          gridSquareLength / 2 +
          gridSquareLength * moveTo.y,
      }),
    );

    const data = editor.getLayers()[0].data;
    const pixels: { x: number; y: number }[] = [];
    data.forEach((colElement, row) => {
      colElement.forEach((pixel, col) => {
        if (pixel.color != "") pixels.push({ x: row, y: col });
      });
    });
    expect(pixels.length).toEqual(0);
  });

  it("stores brush alpha separately from color", () => {
    const columnCount = editor.getColumnCount();
    const rowCount = editor.getRowCount();
    const gridSquareLength = editor.getGridSquareLength();
    const pixelCenter = {
      offsetX:
        canvasElement.width / 2 -
        (gridSquareLength * columnCount) / 2 +
        gridSquareLength / 2,
      offsetY:
        canvasElement.height / 2 -
        (gridSquareLength * rowCount) / 2 +
        gridSquareLength / 2,
    };

    editor.setBrushColor("#336699");
    editor.setBrushAlpha(0.5);
    editor.setBrushPattern([[0.5]]);
    fireEvent(canvasElement, new FakeMouseEvent("mousedown", pixelCenter));
    fireEvent(canvasElement, new FakeMouseEvent("mouseup", pixelCenter));

    const paintedPixel = editor.getLayers()[0].data.get(0)?.get(0);
    expect(paintedPixel?.color).toBe("#336699");
    expect(paintedPixel?.alpha).toBe(0.25);

    editor.undo();
    expect(editor.getLayers()[0].data.get(0)?.get(0)).toEqual({ color: "" });

    editor.redo();
    expect(editor.getLayers()[0].data.get(0)?.get(0)).toEqual({
      color: "#336699",
      alpha: 0.25,
    });
  });

  it("applies brush alpha with the paint bucket", () => {
    const columnCount = editor.getColumnCount();
    const rowCount = editor.getRowCount();
    const gridSquareLength = editor.getGridSquareLength();
    const pixelCenter = {
      offsetX:
        canvasElement.width / 2 -
        (gridSquareLength * columnCount) / 2 +
        gridSquareLength / 2,
      offsetY:
        canvasElement.height / 2 -
        (gridSquareLength * rowCount) / 2 +
        gridSquareLength / 2,
    };

    editor.setBrushTool(BrushTool.PAINT_BUCKET);
    editor.setBrushAlpha(0.3);
    fireEvent(canvasElement, new FakeMouseEvent("mousedown", pixelCenter));
    fireEvent(canvasElement, new FakeMouseEvent("mouseup", pixelCenter));

    const pixels = editor
      .getLayersAsArray()[0]
      .data.reduce((allPixels, row) => allPixels.concat(row), []);
    expect(pixels.every(pixel => pixel.alpha === 0.3)).toBe(true);
  });
});
