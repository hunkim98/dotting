import { createEvent, fireEvent } from "@testing-library/react";

import Editor from "../../components/Canvas/Editor";
import { BrushTool } from "../../components/Canvas/types";
import { FakeMouseEvent } from "../../utils/testUtils";

describe("Dotting Component", () => {
  let editor: Editor;
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render grid for select area", () => {
    const canvasElement = editor.getCanvasElement();
    const columnCount = editor.getColumnCount();
    const rowCount = editor.getRowCount();
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
});
