import { fireEvent } from "@testing-library/react";

import { CreateEmptySquareData } from "../../../stories/utils/dataCreator";
import { DefaultButtonHeight } from "../../components/Canvas/config";
import Editor from "../../components/Canvas/Editor";
import { BrushTool } from "../../components/Canvas/types";
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

  it("undo and redo grid change by calling add grid indices function", () => {
    const columnCount = editor.getColumnCount();
    const rowCount = editor.getRowCount();
    const gridSquareLength = editor.getGridSquareLength();
    // select left top pixel inde
    const { topRowIndex, leftColumnIndex } = editor.getGridIndices();
    editor.addGridIndices({
      rowIndices: [-1],
      columnIndices: [-1],
    });
    expect(editor.getRowCount()).toBe(rowCount + 1);
    expect(editor.getColumnCount()).toBe(columnCount + 1);
    const {
      topRowIndex: topRowIndexAfterAdding,
      leftColumnIndex: leftColumnIndexAfterAdding,
    } = editor.getGridIndices();
    expect(topRowIndexAfterAdding).toBe(topRowIndex - 1);
    expect(leftColumnIndexAfterAdding).toBe(leftColumnIndex - 1);
    editor.undo();
    expect(editor.getRowCount()).toBe(rowCount);
    expect(editor.getColumnCount()).toBe(columnCount);
    const {
      topRowIndex: topRowIndexAfterUndo,
      leftColumnIndex: leftColumnIndexAfterUndo,
    } = editor.getGridIndices();
    expect(topRowIndexAfterUndo).toBe(topRowIndex);
    expect(leftColumnIndexAfterUndo).toBe(leftColumnIndex);
    editor.redo();
    expect(editor.getRowCount()).toBe(rowCount + 1);
    expect(editor.getColumnCount()).toBe(columnCount + 1);
    const {
      topRowIndex: topRowIndexAfterRedo,
      leftColumnIndex: leftColumnIndexAfterRedo,
    } = editor.getGridIndices();
    expect(topRowIndexAfterRedo).toBe(topRowIndex - 1);
    expect(leftColumnIndexAfterRedo).toBe(leftColumnIndex - 1);
  });

  it("undo and redo grid change by calling delete grid indices function", () => {
    const columnCount = editor.getColumnCount();
    const rowCount = editor.getRowCount();
    const gridSquareLength = editor.getGridSquareLength();
    // select left top pixel index
    const { topRowIndex, leftColumnIndex } = editor.getGridIndices();
    editor.deleteGridIndices({
      rowIndices: [0],
      columnIndices: [0],
    });
    expect(editor.getRowCount()).toBe(rowCount - 1);
    expect(editor.getColumnCount()).toBe(columnCount - 1);
    const {
      topRowIndex: topRowIndexAfterDeleting,
      leftColumnIndex: leftColumnIndexAfterDeleting,
    } = editor.getGridIndices();
    expect(topRowIndexAfterDeleting).toBe(topRowIndex + 1);
    expect(leftColumnIndexAfterDeleting).toBe(leftColumnIndex + 1);
    editor.undo();
    expect(editor.getRowCount()).toBe(rowCount);
    expect(editor.getColumnCount()).toBe(columnCount);
    const {
      topRowIndex: topRowIndexAfterUndo,
      leftColumnIndex: leftColumnIndexAfterUndo,
    } = editor.getGridIndices();
    expect(topRowIndexAfterUndo).toBe(topRowIndex);
    expect(leftColumnIndexAfterUndo).toBe(leftColumnIndex);
    editor.redo();
    expect(editor.getRowCount()).toBe(rowCount - 1);
    expect(editor.getColumnCount()).toBe(columnCount - 1);
    const {
      topRowIndex: topRowIndexAfterRedo,
      leftColumnIndex: leftColumnIndexAfterRedo,
    } = editor.getGridIndices();
    expect(topRowIndexAfterRedo).toBe(topRowIndex + 1);
    expect(leftColumnIndexAfterRedo).toBe(leftColumnIndex + 1);
  });

  // Layer hierarchy not maintained after undo and redo
  // both createlayer, removelayer
  it("undo and redo for layer create action", () => {
    editor.setLayers([{ id: "newLayer", data: CreateEmptySquareData(15) }]);
    editor.addLayer("testLayer", 1, CreateEmptySquareData(15), true);

    let layers = editor.getLayersAsArray();
    expect(layers.length).toEqual(2);
    expect(layers[1].id).toEqual("testLayer");
    expect(layers[1].data.length).toEqual(15);
    expect(layers[1].data[0].length).toEqual(15);

    editor.undo();
    layers = editor.getLayersAsArray();
    expect(layers.length).toEqual(1);
    expect(layers[0].id).toEqual("newLayer");
    expect(layers[0].data.length).toEqual(15);
    expect(layers[0].data[0].length).toEqual(15);

    editor.redo();
    layers = editor.getLayersAsArray();
    expect(layers.length).toEqual(2);
    expect(layers[0].id).toEqual("testLayer");
    expect(layers[0].data.length).toEqual(15);
    expect(layers[0].data[0].length).toEqual(15);
  });

  it("undo and redo for layer delete action", () => {
    editor.setLayers([
      { id: "basicLayer", data: CreateEmptySquareData(15) },
      { id: "newLayer", data: CreateEmptySquareData(15) },
    ]);
    let layers = editor.getLayersAsArray();
    editor.removeLayer("newLayer", true);

    layers = editor.getLayersAsArray();
    expect(layers.length).toEqual(1);

    editor.undo();
    layers = editor.getLayersAsArray();
    expect(layers.length).toEqual(2);
    expect(layers[0].id).toEqual("newLayer");
    expect(layers[0].data.length).toEqual(15);
    expect(layers[0].data[0].length).toEqual(15);

    editor.redo();
    layers = editor.getLayersAsArray();
    expect(layers.length).toEqual(1);
  });

  it("undo and redo for layer reorder action", () => {
    const firstLayerId = "firstLayer";
    const secondLayerId = "secondLayer";
    editor.setLayers([
      { id: firstLayerId, data: CreateEmptySquareData(2) },
      { id: secondLayerId, data: CreateEmptySquareData(2) },
    ]);
    let layers = editor.getLayersAsArray();
    editor.reorderLayersByIds([secondLayerId, firstLayerId]);

    layers = editor.getLayersAsArray();
    expect(layers.length).toEqual(2);
    expect(layers[0].id).toEqual(secondLayerId);
    expect(layers[0].data.length).toEqual(2);
    expect(layers[0].data[0].length).toEqual(2);
    expect(layers[1].id).toEqual(firstLayerId);
    expect(layers[1].data.length).toEqual(2);
    expect(layers[1].data[1].length).toEqual(2);

    editor.undo();
    layers = editor.getLayersAsArray();
    expect(layers.length).toEqual(2);
    expect(layers[0].id).toEqual(firstLayerId);
    expect(layers[0].data.length).toEqual(2);
    expect(layers[0].data[1].length).toEqual(2);
    expect(layers[1].id).toEqual(secondLayerId);
    expect(layers[1].data.length).toEqual(2);
    expect(layers[1].data[0].length).toEqual(2);

    editor.redo();
    layers = editor.getLayersAsArray();
    expect(layers.length).toEqual(2);
    expect(layers[0].id).toEqual(secondLayerId);
    expect(layers[0].data.length).toEqual(2);
    expect(layers[0].data[0].length).toEqual(2);
    expect(layers[1].id).toEqual(firstLayerId);
    expect(layers[1].data.length).toEqual(2);
    expect(layers[1].data[1].length).toEqual(2);
  });

  it("undo and redo for select area move action", () => {
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
    let selectedArea = editor.getSelectedArea();
    const startWorldx = selectedArea?.startWorldPos.x || 0;
    const startWorldy = selectedArea?.startWorldPos.y || 0;
    const endWorldx = selectedArea?.endWorldPos.x || 0;
    const endWorldy = selectedArea?.endWorldPos.y || 0;
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX: canvasElement.width / 2,
        offsetY: canvasElement.height / 2,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousemove", {
        offsetX: canvasElement.width / 4,
        offsetY: canvasElement.height / 4,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX: canvasElement.width / 4,
        offsetY: canvasElement.height / 4,
      }),
    );

    selectedArea = editor.getSelectedArea();
    expect(selectedArea?.startWorldPos.x).toBe(
      startWorldx - canvasElement.width / 4,
    );
    expect(selectedArea?.startWorldPos.y).toBe(
      startWorldy - canvasElement.height / 4,
    );
    expect(selectedArea?.endWorldPos.x).toBe(
      endWorldx - canvasElement.width / 4,
    );
    expect(selectedArea?.endWorldPos.y).toBe(
      endWorldy - canvasElement.height / 4,
    );

    editor.undo();
    selectedArea = editor.getSelectedArea();
    expect(selectedArea?.startWorldPos.x).toBe(startWorldx);
    expect(selectedArea?.startWorldPos.y).toBe(startWorldy);
    expect(selectedArea?.endWorldPos.x).toBe(endWorldx);
    expect(selectedArea?.endWorldPos.y).toBe(endWorldy);

    editor.redo();
    selectedArea = editor.getSelectedArea();
    expect(selectedArea?.startWorldPos.x).toBe(
      startWorldx - canvasElement.width / 4,
    );
    expect(selectedArea?.startWorldPos.y).toBe(
      startWorldy - canvasElement.height / 4,
    );
    expect(selectedArea?.endWorldPos.x).toBe(
      endWorldx - canvasElement.width / 4,
    );
    expect(selectedArea?.endWorldPos.y).toBe(
      endWorldy - canvasElement.height / 4,
    );
  });

  it("undo and redo for select area resize action", () => {
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

    let selectedArea = editor.getSelectedArea();
    expect(selectedArea?.endPixelIndex).toStrictEqual({
      rowIndex: rowCount,
      columnIndex: columnCount,
    });

    editor.undo();
    selectedArea = editor.getSelectedArea();
    expect(selectedArea?.endPixelIndex).toStrictEqual({
      rowIndex: rowCount - 1,
      columnIndex: columnCount - 1,
    });

    editor.redo();
    selectedArea = editor.getSelectedArea();
    expect(selectedArea?.endPixelIndex).toStrictEqual({
      rowIndex: rowCount,
      columnIndex: columnCount,
    });
  });
});
