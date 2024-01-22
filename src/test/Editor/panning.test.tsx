import { fireEvent } from "@testing-library/react";

import { DefaultButtonHeight } from "../../components/Canvas/config";
import Editor from "../../components/Canvas/Editor";
import { BrushTool } from "../../components/Canvas/types";
import { FakeMouseEvent } from "../../utils/testUtils";

describe("test for panning interaction", () => {
  let editor: Editor;
  let canvasElement: HTMLCanvasElement;
  let scale: number;
  let offset: { x: number; y: number };
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

    const panZoom = mockEditor.getPanZoom();
    scale = panZoom.scale;
    offset = panZoom.offset;

    editor = mockEditor;
    editor.setBrushTool(BrushTool.NONE); // None allows for only panning
    // initialize the canvas with select tool selecting all the pixels
    canvasElement = editor.getCanvasElement();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("test if panning works when mouse is dragged along the canvas", () => {
    const columnCount = editor.getColumnCount();
    const rowCount = editor.getRowCount();
    const gridSquareLength = editor.getGridSquareLength();

    const previousOffset = editor.getPanZoom().offset;

    const mouseXDelta = scale * gridSquareLength;
    const mouseYDelta = scale * gridSquareLength;

    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX:
          canvasElement.width / 2 -
          (scale * gridSquareLength * columnCount) / 2 -
          (scale * DefaultButtonHeight) / 4,
        offsetY:
          canvasElement.height / 2 -
          (scale * gridSquareLength * rowCount) / 2 -
          (scale * DefaultButtonHeight) / 4,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousemove", {
        offsetX:
          canvasElement.width / 2 -
          (scale * gridSquareLength * columnCount) / 2 -
          (scale * DefaultButtonHeight) / 4 -
          mouseXDelta,
        offsetY:
          canvasElement.height / 2 -
          (scale * gridSquareLength * rowCount) / 2 -
          (scale * DefaultButtonHeight) / 4 -
          mouseYDelta,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX:
          canvasElement.width / 2 -
          (scale * gridSquareLength * columnCount) / 2 -
          (scale * DefaultButtonHeight) / 4 -
          mouseXDelta,
        offsetY:
          canvasElement.height / 2 -
          (scale * gridSquareLength * rowCount) / 2 -
          (scale * DefaultButtonHeight) / 4 -
          mouseYDelta,
      }),
    );

    const newOffset = editor.getPanZoom().offset;

    expect(Math.abs(newOffset.x - previousOffset.x)).toBe(mouseXDelta);
    expect(Math.abs(newOffset.y - previousOffset.x)).toBe(mouseYDelta);
  });
});
