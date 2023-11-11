import { fireEvent } from "@testing-library/react";

import Editor from "../../components/Canvas/Editor";
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

  /**
   * TODO:
   * 1. test if bressenhamindices work when mouse is moved around the canvas
   *    (hint: use FakeMouseEvent, refer to extension.test.tsx for example)
   * Assigned to: 방호찬
   * ⬇️
   */
  it.only("test if bressenhamindces work when mouse is moved along the canvas", () => {
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
  // You do not need to add additional tests!
  // Just make sure that the test above is working!
  /** ⬆️ */
});
