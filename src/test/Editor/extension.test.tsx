import { fireEvent } from "@testing-library/react";

import { DefaultButtonHeight } from "../../components/Canvas/config";
import Editor from "../../components/Canvas/Editor";
import { FakeMouseEvent } from "../../utils/testUtils";

describe("test for extension interaction", () => {
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("extends canvas grid diagonally to top left", () => {
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
  });

  it("extends canvas grid diagonally to bottom right", () => {
    const columnCount = editor.getColumnCount();
    const rowCount = editor.getRowCount();
    const gridSquareLength = editor.getGridSquareLength();
    // select bottom right corner
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX:
          canvasElement.width / 2 +
          (gridSquareLength * columnCount) / 2 +
          DefaultButtonHeight / 4,
        offsetY:
          canvasElement.height / 2 +
          (gridSquareLength * rowCount) / 2 +
          DefaultButtonHeight / 4,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousemove", {
        offsetX:
          canvasElement.width / 2 +
          (gridSquareLength * columnCount) / 2 +
          DefaultButtonHeight / 4 +
          gridSquareLength,
        offsetY:
          canvasElement.height / 2 +
          (gridSquareLength * rowCount) / 2 +
          DefaultButtonHeight / 4 +
          gridSquareLength,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX:
          canvasElement.width / 2 +
          (gridSquareLength * columnCount) / 2 +
          DefaultButtonHeight / 4 +
          gridSquareLength,
        offsetY:
          canvasElement.height / 2 +
          (gridSquareLength * rowCount) / 2 +
          DefaultButtonHeight / 4 +
          gridSquareLength,
      }),
    );
    const { bottomRowIndex, rightColumnIndex } = editor.getGridIndices();
    expect(bottomRowIndex).toBe(rowCount);
    expect(rightColumnIndex).toBe(columnCount);
  });

  it("extends canvas grid diagonally to top right", () => {
    const columnCount = editor.getColumnCount();
    const rowCount = editor.getRowCount();
    const gridSquareLength = editor.getGridSquareLength();
    // select top right corner
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX:
          canvasElement.width / 2 +
          (gridSquareLength * columnCount) / 2 +
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
          canvasElement.width / 2 +
          (gridSquareLength * columnCount) / 2 +
          DefaultButtonHeight / 4 +
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
          canvasElement.width / 2 +
          (gridSquareLength * columnCount) / 2 +
          DefaultButtonHeight / 4 +
          gridSquareLength,
        offsetY:
          canvasElement.height / 2 -
          (gridSquareLength * rowCount) / 2 -
          DefaultButtonHeight / 4 -
          gridSquareLength,
      }),
    );
    const { topRowIndex, rightColumnIndex } = editor.getGridIndices();
    expect(topRowIndex).toBe(-1);
    expect(rightColumnIndex).toBe(columnCount);
  });

  it("extends canvas grid diagonally to bottom left", () => {
    const columnCount = editor.getColumnCount();
    const rowCount = editor.getRowCount();
    const gridSquareLength = editor.getGridSquareLength();
    // select bottom left corner
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX:
          canvasElement.width / 2 -
          (gridSquareLength * columnCount) / 2 -
          DefaultButtonHeight / 4,
        offsetY:
          canvasElement.height / 2 +
          (gridSquareLength * rowCount) / 2 +
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
          canvasElement.height / 2 +
          (gridSquareLength * rowCount) / 2 +
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
          DefaultButtonHeight / 4 -
          gridSquareLength,
        offsetY:
          canvasElement.height / 2 +
          (gridSquareLength * rowCount) / 2 +
          DefaultButtonHeight / 4 +
          gridSquareLength,
      }),
    );
    const { bottomRowIndex, leftColumnIndex } = editor.getGridIndices();
    expect(bottomRowIndex).toBe(rowCount);
    expect(leftColumnIndex).toBe(-1);
  });

  it("shortens grid diagonally from top left", () => {
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
  });

  it("shortens grid diagonally from bottom right", () => {
    const columnCount = editor.getColumnCount();
    const rowCount = editor.getRowCount();
    const gridSquareLength = editor.getGridSquareLength();
    // select bottom right corner
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX:
          canvasElement.width / 2 +
          (gridSquareLength * columnCount) / 2 +
          DefaultButtonHeight / 4,
        offsetY:
          canvasElement.height / 2 +
          (gridSquareLength * rowCount) / 2 +
          DefaultButtonHeight / 4,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousemove", {
        offsetX:
          canvasElement.width / 2 +
          (gridSquareLength * columnCount) / 2 +
          DefaultButtonHeight / 4 -
          gridSquareLength,
        offsetY:
          canvasElement.height / 2 +
          (gridSquareLength * rowCount) / 2 +
          DefaultButtonHeight / 4 -
          gridSquareLength,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX:
          canvasElement.width / 2 +
          (gridSquareLength * columnCount) / 2 +
          DefaultButtonHeight / 4 -
          gridSquareLength,
        offsetY:
          canvasElement.height / 2 +
          (gridSquareLength * rowCount) / 2 +
          DefaultButtonHeight / 4 -
          gridSquareLength,
      }),
    );
    const { bottomRowIndex, rightColumnIndex } = editor.getGridIndices();
    expect(bottomRowIndex).toBe(rowCount - 2);
    expect(rightColumnIndex).toBe(columnCount - 2);
  });

  it("shortens grid diagonally from top right", () => {
    const columnCount = editor.getColumnCount();
    const rowCount = editor.getRowCount();
    const gridSquareLength = editor.getGridSquareLength();
    // select top right corner
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX:
          canvasElement.width / 2 +
          (gridSquareLength * columnCount) / 2 +
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
          canvasElement.width / 2 +
          (gridSquareLength * columnCount) / 2 +
          DefaultButtonHeight / 4 -
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
          canvasElement.width / 2 +
          (gridSquareLength * columnCount) / 2 +
          DefaultButtonHeight / 4 -
          gridSquareLength,
        offsetY:
          canvasElement.height / 2 -
          (gridSquareLength * rowCount) / 2 -
          DefaultButtonHeight / 4 +
          gridSquareLength,
      }),
    );
    const { topRowIndex, rightColumnIndex } = editor.getGridIndices();
    expect(topRowIndex).toBe(1);
    expect(rightColumnIndex).toBe(columnCount - 2);
  });

  it("shortens grid diagonally from bottom left", () => {
    const columnCount = editor.getColumnCount();
    const rowCount = editor.getRowCount();
    const gridSquareLength = editor.getGridSquareLength();
    // select bottom left corner
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX:
          canvasElement.width / 2 -
          (gridSquareLength * columnCount) / 2 -
          DefaultButtonHeight / 4,
        offsetY:
          canvasElement.height / 2 +
          (gridSquareLength * rowCount) / 2 +
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
          canvasElement.height / 2 +
          (gridSquareLength * rowCount) / 2 +
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
          DefaultButtonHeight / 4 +
          gridSquareLength,
        offsetY:
          canvasElement.height / 2 +
          (gridSquareLength * rowCount) / 2 +
          DefaultButtonHeight / 4 -
          gridSquareLength,
      }),
    );
    const { bottomRowIndex, leftColumnIndex } = editor.getGridIndices();
    expect(bottomRowIndex).toBe(rowCount - 2);
    expect(leftColumnIndex).toBe(1);
  });
});
