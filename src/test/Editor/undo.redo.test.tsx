import { fireEvent } from "@testing-library/react";

import {
  DefaultButtonHeight,
} from "../../components/Canvas/config";
import Editor from "../../components/Canvas/Editor";
import { FakeMouseEvent } from "../../utils/testUtils";

describe("test for undo and redo", () => {
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("undo and redo diagonal grid extend action", () => {
    const columnCount = editor.getColumnCount();
    const rowCount = editor.getRowCount();
    const gridSquareLength = editor.getGridSquareLength();
    // select left top corner
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX:
          canvasElement.width / 2 -
          (gridSquareLength * columnCount) / 2 -
          DefaultButtonHeight / 4,
        offsetY:
          canvasElement.height / 2 -
          (gridSquareLength * rowCount) / 2 -
          DefaultButtonHeight / 4,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousemove", {
        offsetX:
          canvasElement.width / 2 -
          (gridSquareLength * columnCount) / 2 -
          DefaultButtonHeight / 4 -
          gridSquareLength,
        offsetY:
          canvasElement.height / 2 -
          (gridSquareLength * rowCount) / 2 -
          DefaultButtonHeight / 4 -
          gridSquareLength,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX:
          canvasElement.width / 2 -
          (gridSquareLength * columnCount) / 2 -
          DefaultButtonHeight / 4 -
          gridSquareLength,
        offsetY:
          canvasElement.height / 2 -
          (gridSquareLength * rowCount) / 2 -
          DefaultButtonHeight / 4 -
          gridSquareLength,
      }),
    );
    const { topRowIndex, leftColumnIndex } = editor.getGridIndices();
    expect(topRowIndex).toBe(-1);
    expect(leftColumnIndex).toBe(-1);
    editor.undo();
    const {
      topRowIndex: topRowIndexAfterUndo,
      leftColumnIndex: leftColumnIndexAfterUndo,
    } = editor.getGridIndices();
    expect(topRowIndexAfterUndo).toBe(0);
    expect(leftColumnIndexAfterUndo).toBe(0);
    editor.redo();
    const {
      topRowIndex: topRowIndexAfterRedo,
      leftColumnIndex: leftColumnIndexAfterRedo,
    } = editor.getGridIndices();
    expect(topRowIndexAfterRedo).toBe(-1);
    expect(leftColumnIndexAfterRedo).toBe(-1);
  });

  it("undo and redo diagonal grid shorten action", () => {
    const columnCount = editor.getColumnCount();
    const rowCount = editor.getRowCount();
    const gridSquareLength = editor.getGridSquareLength();
    // select left top corner
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX:
          canvasElement.width / 2 -
          (gridSquareLength * columnCount) / 2 -
          DefaultButtonHeight / 4,
        offsetY:
          canvasElement.height / 2 -
          (gridSquareLength * rowCount) / 2 -
          DefaultButtonHeight / 4,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousemove", {
        offsetX:
          canvasElement.width / 2 -
          (gridSquareLength * columnCount) / 2 -
          DefaultButtonHeight / 4 +
          gridSquareLength,
        offsetY:
          canvasElement.height / 2 -
          (gridSquareLength * rowCount) / 2 -
          DefaultButtonHeight / 4 +
          gridSquareLength,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX:
          canvasElement.width / 2 -
          (gridSquareLength * columnCount) / 2 -
          DefaultButtonHeight / 4 +
          gridSquareLength,
        offsetY:
          canvasElement.height / 2 -
          (gridSquareLength * rowCount) / 2 -
          DefaultButtonHeight / 4 +
          gridSquareLength,
      }),
    );
    const { topRowIndex, leftColumnIndex } = editor.getGridIndices();
    expect(topRowIndex).toBe(1);
    expect(leftColumnIndex).toBe(1);
    editor.undo();
    const {
      topRowIndex: topRowIndexAfterUndo,
      leftColumnIndex: leftColumnIndexAfterUndo,
    } = editor.getGridIndices();
    expect(topRowIndexAfterUndo).toBe(0);
    expect(leftColumnIndexAfterUndo).toBe(0);
    editor.redo();
    const {
      topRowIndex: topRowIndexAfterRedo,
      leftColumnIndex: leftColumnIndexAfterRedo,
    } = editor.getGridIndices();
    expect(topRowIndexAfterRedo).toBe(1);
    expect(leftColumnIndexAfterRedo).toBe(1);
  });

  it("undo and redo pixel color by interaction", () => {
    const columnCount = editor.getColumnCount();
    const rowCount = editor.getRowCount();
    const gridSquareLength = editor.getGridSquareLength();
    // select left top pixel index
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
      new FakeMouseEvent("mouseup", {
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
    const dataBeforeUndo = editor.getLayers()[0].data;
    const brushColor = editor.getBrushColor();
    expect(dataBeforeUndo.get(0)?.get(0)?.color).toBe(brushColor);
    editor.undo();
    const dataAfterUndo = editor.getLayers()[0].data;
    expect(dataAfterUndo.get(0)?.get(0)?.color).toBe("");
    editor.redo();
    const dataAfterRedo = editor.getLayers()[0].data;
    expect(dataAfterRedo.get(0)?.get(0)?.color).toBe(brushColor);
  });
});
