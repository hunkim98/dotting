import { fireEvent } from "@testing-library/react";

import { DefaultButtonHeight } from "../../components/Canvas/config";
import Editor from "../../components/Canvas/Editor";
import { FakeMouseEvent } from "../../utils/testUtils";

describe("test for extension interaction", () => {
  let editor: Editor;
  let canvasElement: HTMLCanvasElement;
  let scale: number;
  let offset: { x: number; y: number };
  let dataCanvasContext: CanvasRenderingContext2D;
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
    editor.setIsGridFixed(false);
    // initialize the canvas with select tool selecting all the pixels
    canvasElement = editor.getCanvasElement();
    dataCanvasContext = dataCanvas.getContext("2d")!;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("extends canvas grid diagonally to top left", () => {
    const columnCount = editor.getColumnCount();
    const rowCount = editor.getRowCount();
    const gridSquareLength = editor.getGridSquareLength();

    const panZoom = editor.getPanZoom();
    const pixelSquareLength = gridSquareLength * panZoom.scale;
    const futureTopLeftPixelSquareMiddleOffset =
      editor.convertWorldPosToCanvasOffset({
        x: -gridSquareLength / 2,
        y: -gridSquareLength / 2,
      });
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX: futureTopLeftPixelSquareMiddleOffset.x,
        offsetY: futureTopLeftPixelSquareMiddleOffset.y,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX: futureTopLeftPixelSquareMiddleOffset.x,
        offsetY: futureTopLeftPixelSquareMiddleOffset.y,
      }),
    );
    const beforeExtendEvents = dataCanvasContext.__getDrawCalls();
    const beforeExtendDrawEvents = beforeExtendEvents.filter(event => {
      return (
        event.props.width === pixelSquareLength &&
        event.props.height === pixelSquareLength
      );
    });
    // since the canvas is not extended yet there should be no draw events
    expect(beforeExtendDrawEvents.length).toBe(0);

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
          scale * gridSquareLength,
        offsetY:
          canvasElement.height / 2 -
          (scale * gridSquareLength * rowCount) / 2 -
          (scale * DefaultButtonHeight) / 4 -
          scale * gridSquareLength,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX:
          canvasElement.width / 2 -
          (scale * gridSquareLength * columnCount) / 2 -
          (scale * DefaultButtonHeight) / 4 -
          scale * gridSquareLength,
        offsetY:
          canvasElement.height / 2 -
          (scale * gridSquareLength * rowCount) / 2 -
          (scale * DefaultButtonHeight) / 4 -
          scale * gridSquareLength,
      }),
    );
    const { topRowIndex, leftColumnIndex } = editor.getGridIndices();
    expect(topRowIndex).toBe(-1);
    expect(leftColumnIndex).toBe(-1);

    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX: futureTopLeftPixelSquareMiddleOffset.x,
        offsetY: futureTopLeftPixelSquareMiddleOffset.y,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX: futureTopLeftPixelSquareMiddleOffset.x,
        offsetY: futureTopLeftPixelSquareMiddleOffset.y,
      }),
    );
    const afterExtendEvents = dataCanvasContext.__getDrawCalls();
    const afterExtendDrawEvents = afterExtendEvents.filter(event => {
      return (
        event.props.width === pixelSquareLength &&
        event.props.height === pixelSquareLength
      );
    });

    // if this is not 1 this means that the grid was not extended
    expect(afterExtendDrawEvents.length).toBe(1);
  });

  it("extends canvas grid diagonally to bottom right", () => {
    const columnCount = editor.getColumnCount();
    const rowCount = editor.getRowCount();
    const gridSquareLength = editor.getGridSquareLength();

    const futureBottomRightPixelSquareMiddleOffset =
      editor.convertWorldPosToCanvasOffset({
        x: columnCount * gridSquareLength + gridSquareLength / 2,
        y: rowCount * gridSquareLength + gridSquareLength / 2,
      });
    const panZoom = editor.getPanZoom();
    const pixelSquareLength = gridSquareLength * panZoom.scale;

    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX: futureBottomRightPixelSquareMiddleOffset.x,
        offsetY: futureBottomRightPixelSquareMiddleOffset.y,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX: futureBottomRightPixelSquareMiddleOffset.x,
        offsetY: futureBottomRightPixelSquareMiddleOffset.y,
      }),
    );
    const beforeExtendEvents = dataCanvasContext.__getDrawCalls();
    const beforeExtendDrawEvents = beforeExtendEvents.filter(event => {
      return (
        event.props.width === pixelSquareLength &&
        event.props.height === pixelSquareLength
      );
    });
    // since the canvas is not extended yet there should be no draw events
    expect(beforeExtendDrawEvents.length).toBe(0);
    // select bottom right corner
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX:
          canvasElement.width / 2 +
          (scale * gridSquareLength * columnCount) / 2 +
          (scale * DefaultButtonHeight) / 4,
        offsetY:
          canvasElement.height / 2 +
          (scale * gridSquareLength * rowCount) / 2 +
          (scale * DefaultButtonHeight) / 4,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousemove", {
        offsetX:
          canvasElement.width / 2 +
          (scale * gridSquareLength * columnCount) / 2 +
          (scale * DefaultButtonHeight) / 4 +
          scale * gridSquareLength,
        offsetY:
          canvasElement.height / 2 +
          (scale * gridSquareLength * rowCount) / 2 +
          (scale * DefaultButtonHeight) / 4 +
          scale * gridSquareLength,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX:
          canvasElement.width / 2 +
          (scale * gridSquareLength * columnCount) / 2 +
          (scale * DefaultButtonHeight) / 4 +
          scale * gridSquareLength,
        offsetY:
          canvasElement.height / 2 +
          (scale * gridSquareLength * rowCount) / 2 +
          (scale * DefaultButtonHeight) / 4 +
          scale * gridSquareLength,
      }),
    );
    const { bottomRowIndex, rightColumnIndex } = editor.getGridIndices();
    expect(bottomRowIndex).toBe(rowCount);
    expect(rightColumnIndex).toBe(columnCount);

    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX: futureBottomRightPixelSquareMiddleOffset.x,
        offsetY: futureBottomRightPixelSquareMiddleOffset.y,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX: futureBottomRightPixelSquareMiddleOffset.x,
        offsetY: futureBottomRightPixelSquareMiddleOffset.y,
      }),
    );
    const afterExtendEvents = dataCanvasContext.__getDrawCalls();
    const afterExtendDrawEvents = afterExtendEvents.filter(event => {
      return (
        event.props.width === pixelSquareLength &&
        event.props.height === pixelSquareLength
      );
    });
    expect(afterExtendDrawEvents.length).toBe(1);
  });

  it("extends canvas grid diagonally to top right", () => {
    const columnCount = editor.getColumnCount();
    const rowCount = editor.getRowCount();
    const gridSquareLength = editor.getGridSquareLength();

    const futureTopRightPixelSquareMiddleOffset =
      editor.convertWorldPosToCanvasOffset({
        x: columnCount * gridSquareLength + gridSquareLength / 2,
        y: -gridSquareLength / 2,
      });
    const panZoom = editor.getPanZoom();
    const pixelSquareLength = gridSquareLength * panZoom.scale;

    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX: futureTopRightPixelSquareMiddleOffset.x,
        offsetY: futureTopRightPixelSquareMiddleOffset.y,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX: futureTopRightPixelSquareMiddleOffset.x,
        offsetY: futureTopRightPixelSquareMiddleOffset.y,
      }),
    );
    const beforeExtendEvents = dataCanvasContext.__getDrawCalls();
    const beforeExtendDrawEvents = beforeExtendEvents.filter(event => {
      return (
        event.props.width === pixelSquareLength &&
        event.props.height === pixelSquareLength
      );
    });
    // since the canvas is not extended yet there should be no draw events
    expect(beforeExtendDrawEvents.length).toBe(0);
    // select top right corner
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX:
          canvasElement.width / 2 +
          (scale * gridSquareLength * columnCount) / 2 +
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
          canvasElement.width / 2 +
          (scale * gridSquareLength * columnCount) / 2 +
          (scale * DefaultButtonHeight) / 4 +
          scale * gridSquareLength,
        offsetY:
          canvasElement.height / 2 -
          (scale * gridSquareLength * rowCount) / 2 -
          (scale * DefaultButtonHeight) / 4 -
          scale * gridSquareLength,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX:
          canvasElement.width / 2 +
          (scale * gridSquareLength * columnCount) / 2 +
          (scale * DefaultButtonHeight) / 4 +
          scale * gridSquareLength,
        offsetY:
          canvasElement.height / 2 -
          (scale * gridSquareLength * rowCount) / 2 -
          (scale * DefaultButtonHeight) / 4 -
          scale * gridSquareLength,
      }),
    );
    const { topRowIndex, rightColumnIndex } = editor.getGridIndices();
    expect(topRowIndex).toBe(-1);
    expect(rightColumnIndex).toBe(columnCount);

    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX: futureTopRightPixelSquareMiddleOffset.x,
        offsetY: futureTopRightPixelSquareMiddleOffset.y,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX: futureTopRightPixelSquareMiddleOffset.x,
        offsetY: futureTopRightPixelSquareMiddleOffset.y,
      }),
    );
    const afterExtendEvents = dataCanvasContext.__getDrawCalls();
    const afterExtendDrawEvents = afterExtendEvents.filter(event => {
      return (
        event.props.width === pixelSquareLength &&
        event.props.height === pixelSquareLength
      );
    });
    expect(afterExtendDrawEvents.length).toBe(1);
  });

  it("extends canvas grid diagonally to bottom left", () => {
    const columnCount = editor.getColumnCount();
    const rowCount = editor.getRowCount();
    const gridSquareLength = editor.getGridSquareLength();
    // select bottom left corner

    const futureBottomLeftPixelSquareMiddleOffset =
      editor.convertWorldPosToCanvasOffset({
        x: -gridSquareLength / 2,
        y: rowCount * gridSquareLength + gridSquareLength / 2,
      });
    const panZoom = editor.getPanZoom();
    const pixelSquareLength = gridSquareLength * panZoom.scale;

    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX: futureBottomLeftPixelSquareMiddleOffset.x,
        offsetY: futureBottomLeftPixelSquareMiddleOffset.y,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX: futureBottomLeftPixelSquareMiddleOffset.x,
        offsetY: futureBottomLeftPixelSquareMiddleOffset.y,
      }),
    );
    const beforeExtendEvents = dataCanvasContext.__getDrawCalls();
    const beforeExtendDrawEvents = beforeExtendEvents.filter(event => {
      return (
        event.props.width === pixelSquareLength &&
        event.props.height === pixelSquareLength
      );
    });
    // since the canvas is not extended yet there should be no draw events
    expect(beforeExtendDrawEvents.length).toBe(0);

    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX:
          canvasElement.width / 2 -
          (scale * gridSquareLength * columnCount) / 2 -
          (scale * DefaultButtonHeight) / 4,
        offsetY:
          canvasElement.height / 2 +
          (scale * gridSquareLength * rowCount) / 2 +
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
          scale * gridSquareLength,
        offsetY:
          canvasElement.height / 2 +
          (scale * gridSquareLength * rowCount) / 2 +
          (scale * DefaultButtonHeight) / 4 +
          scale * gridSquareLength,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX:
          canvasElement.width / 2 -
          (scale * gridSquareLength * columnCount) / 2 -
          (scale * DefaultButtonHeight) / 4 -
          scale * gridSquareLength,
        offsetY:
          canvasElement.height / 2 +
          (scale * gridSquareLength * rowCount) / 2 +
          (scale * DefaultButtonHeight) / 4 +
          scale * gridSquareLength,
      }),
    );
    const { bottomRowIndex, leftColumnIndex } = editor.getGridIndices();
    expect(bottomRowIndex).toBe(rowCount);
    expect(leftColumnIndex).toBe(-1);

    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX: futureBottomLeftPixelSquareMiddleOffset.x,
        offsetY: futureBottomLeftPixelSquareMiddleOffset.y,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX: futureBottomLeftPixelSquareMiddleOffset.x,
        offsetY: futureBottomLeftPixelSquareMiddleOffset.y,
      }),
    );
    const afterExtendEvents = dataCanvasContext.__getDrawCalls();
    const afterExtendDrawEvents = afterExtendEvents.filter(event => {
      return (
        event.props.width === pixelSquareLength &&
        event.props.height === pixelSquareLength
      );
    });
    // since the canvas is not extended yet there should be no draw events
    expect(afterExtendDrawEvents.length).toBe(1);
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
          (scale * DefaultButtonHeight) / 4 +
          scale * gridSquareLength,
        offsetY:
          canvasElement.height / 2 -
          (scale * gridSquareLength * rowCount) / 2 -
          (scale * DefaultButtonHeight) / 4 +
          scale * gridSquareLength,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX:
          canvasElement.width / 2 -
          (scale * gridSquareLength * columnCount) / 2 -
          (scale * DefaultButtonHeight) / 4 +
          scale * gridSquareLength,
        offsetY:
          canvasElement.height / 2 -
          (scale * gridSquareLength * rowCount) / 2 -
          (scale * DefaultButtonHeight) / 4 +
          scale * gridSquareLength,
      }),
    );
    const { topRowIndex, leftColumnIndex } = editor.getGridIndices();
    expect(topRowIndex).toBe(1);
    expect(leftColumnIndex).toBe(1);

    const previousTopLeftPixelSquareMiddleOffset =
      editor.convertWorldPosToCanvasOffset({
        x: gridSquareLength / 2,
        y: gridSquareLength / 2,
      });
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX: previousTopLeftPixelSquareMiddleOffset.x,
        offsetY: previousTopLeftPixelSquareMiddleOffset.y,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX: previousTopLeftPixelSquareMiddleOffset.x,
        offsetY: previousTopLeftPixelSquareMiddleOffset.y,
      }),
    );
    const panZoom = editor.getPanZoom();
    const pixelSquareLength = gridSquareLength * panZoom.scale;
    const afterExtendEvents = dataCanvasContext.__getDrawCalls();
    const afterExtendDrawEvents = afterExtendEvents.filter(event => {
      return (
        event.props.width === pixelSquareLength &&
        event.props.height === pixelSquareLength
      );
    });
    expect(afterExtendDrawEvents.length).toBe(0);
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
          (scale * gridSquareLength * columnCount) / 2 +
          (scale * DefaultButtonHeight) / 4,
        offsetY:
          canvasElement.height / 2 +
          (scale * gridSquareLength * rowCount) / 2 +
          (scale * DefaultButtonHeight) / 4,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousemove", {
        offsetX:
          canvasElement.width / 2 +
          (scale * gridSquareLength * columnCount) / 2 +
          (scale * DefaultButtonHeight) / 4 -
          scale * gridSquareLength,
        offsetY:
          canvasElement.height / 2 +
          (scale * gridSquareLength * rowCount) / 2 +
          (scale * DefaultButtonHeight) / 4 -
          scale * gridSquareLength,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX:
          canvasElement.width / 2 +
          (scale * gridSquareLength * columnCount) / 2 +
          (scale * DefaultButtonHeight) / 4 -
          scale * gridSquareLength,
        offsetY:
          canvasElement.height / 2 +
          (scale * gridSquareLength * rowCount) / 2 +
          (scale * DefaultButtonHeight) / 4 -
          scale * gridSquareLength,
      }),
    );
    const { bottomRowIndex, rightColumnIndex } = editor.getGridIndices();
    expect(bottomRowIndex).toBe(rowCount - 2);
    expect(rightColumnIndex).toBe(columnCount - 2);

    const previousBottomRightPixelSquareMiddleOffset =
      editor.convertWorldPosToCanvasOffset({
        x: columnCount * gridSquareLength - gridSquareLength / 2,
        y: rowCount * gridSquareLength - gridSquareLength / 2,
      });
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX: previousBottomRightPixelSquareMiddleOffset.x,
        offsetY: previousBottomRightPixelSquareMiddleOffset.y,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX: previousBottomRightPixelSquareMiddleOffset.x,
        offsetY: previousBottomRightPixelSquareMiddleOffset.y,
      }),
    );
    const panZoom = editor.getPanZoom();
    const pixelSquareLength = gridSquareLength * panZoom.scale;
    const afterExtendEvents = dataCanvasContext.__getDrawCalls();
    const afterExtendDrawEvents = afterExtendEvents.filter(event => {
      return (
        event.props.width === pixelSquareLength &&
        event.props.height === pixelSquareLength
      );
    });
    expect(afterExtendDrawEvents.length).toBe(0);
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
          (scale * gridSquareLength * columnCount) / 2 +
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
          canvasElement.width / 2 +
          (scale * gridSquareLength * columnCount) / 2 +
          (scale * DefaultButtonHeight) / 4 -
          scale * gridSquareLength,
        offsetY:
          canvasElement.height / 2 -
          (scale * gridSquareLength * rowCount) / 2 -
          (scale * DefaultButtonHeight) / 4 +
          scale * gridSquareLength,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX:
          canvasElement.width / 2 +
          (scale * gridSquareLength * columnCount) / 2 +
          (scale * DefaultButtonHeight) / 4 -
          scale * gridSquareLength,
        offsetY:
          canvasElement.height / 2 -
          (scale * gridSquareLength * rowCount) / 2 -
          (scale * DefaultButtonHeight) / 4 +
          scale * gridSquareLength,
      }),
    );
    const { topRowIndex, rightColumnIndex } = editor.getGridIndices();
    expect(topRowIndex).toBe(1);
    expect(rightColumnIndex).toBe(columnCount - 2);

    const previousTopRightPixelSquareMiddleOffset =
      editor.convertWorldPosToCanvasOffset({
        x: columnCount * gridSquareLength - gridSquareLength / 2,
        y: gridSquareLength / 2,
      });
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX: previousTopRightPixelSquareMiddleOffset.x,
        offsetY: previousTopRightPixelSquareMiddleOffset.y,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX: previousTopRightPixelSquareMiddleOffset.x,
        offsetY: previousTopRightPixelSquareMiddleOffset.y,
      }),
    );
    const panZoom = editor.getPanZoom();
    const pixelSquareLength = gridSquareLength * panZoom.scale;
    const afterExtendEvents = dataCanvasContext.__getDrawCalls();
    const afterExtendDrawEvents = afterExtendEvents.filter(event => {
      return (
        event.props.width === pixelSquareLength &&
        event.props.height === pixelSquareLength
      );
    });
    expect(afterExtendDrawEvents.length).toBe(0);
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
          (scale * gridSquareLength * columnCount) / 2 -
          (scale * DefaultButtonHeight) / 4,
        offsetY:
          canvasElement.height / 2 +
          (scale * gridSquareLength * rowCount) / 2 +
          (scale * DefaultButtonHeight) / 4,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousemove", {
        offsetX:
          canvasElement.width / 2 -
          (scale * gridSquareLength * columnCount) / 2 -
          (scale * DefaultButtonHeight) / 4 +
          scale * gridSquareLength,
        offsetY:
          canvasElement.height / 2 +
          (scale * gridSquareLength * rowCount) / 2 +
          (scale * DefaultButtonHeight) / 4 -
          scale * gridSquareLength,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX:
          canvasElement.width / 2 -
          (scale * gridSquareLength * columnCount) / 2 -
          (scale * DefaultButtonHeight) / 4 +
          scale * gridSquareLength,
        offsetY:
          canvasElement.height / 2 +
          (scale * gridSquareLength * rowCount) / 2 +
          (scale * DefaultButtonHeight) / 4 -
          scale * gridSquareLength,
      }),
    );
    const { bottomRowIndex, leftColumnIndex } = editor.getGridIndices();
    expect(bottomRowIndex).toBe(rowCount - 2);
    expect(leftColumnIndex).toBe(1);

    const previousBottomLeftPixelSquareMiddleOffset =
      editor.convertWorldPosToCanvasOffset({
        x: gridSquareLength / 2,
        y: rowCount * gridSquareLength - gridSquareLength / 2,
      });
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX: previousBottomLeftPixelSquareMiddleOffset.x,
        offsetY: previousBottomLeftPixelSquareMiddleOffset.y,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX: previousBottomLeftPixelSquareMiddleOffset.x,
        offsetY: previousBottomLeftPixelSquareMiddleOffset.y,
      }),
    );
    const panZoom = editor.getPanZoom();
    const pixelSquareLength = gridSquareLength * panZoom.scale;
    const afterExtendEvents = dataCanvasContext.__getDrawCalls();
    const afterExtendDrawEvents = afterExtendEvents.filter(event => {
      return (
        event.props.width === pixelSquareLength &&
        event.props.height === pixelSquareLength
      );
    });
    expect(afterExtendDrawEvents.length).toBe(0);
  });

  it("extends canvas grid with its resize unit changed to 4", () => {
    const resizeUnit = 4;
    editor.setResizeUnit(resizeUnit);
    const columnCount = editor.getColumnCount();
    const rowCount = editor.getRowCount();
    const gridSquareLength = editor.getGridSquareLength();

    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX:
          canvasElement.width / 2 -
          (scale * gridSquareLength * columnCount) / 2 -
          (scale * DefaultButtonHeight) / 4,
        offsetY:
          canvasElement.height / 2 +
          (scale * gridSquareLength * rowCount) / 2 +
          (scale * DefaultButtonHeight) / 4,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousemove", {
        offsetX:
          canvasElement.width / 2 -
          (scale * gridSquareLength * columnCount) / 2 -
          (scale * DefaultButtonHeight) / 4 +
          scale * gridSquareLength,
        offsetY:
          canvasElement.height / 2 +
          (scale * gridSquareLength * rowCount) / 2 +
          (scale * DefaultButtonHeight) / 4 -
          scale * gridSquareLength,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX:
          canvasElement.width / 2 -
          (scale * gridSquareLength * columnCount) / 2 -
          (scale * DefaultButtonHeight) / 4 +
          scale * gridSquareLength,
        offsetY:
          canvasElement.height / 2 +
          (scale * gridSquareLength * rowCount) / 2 +
          (scale * DefaultButtonHeight) / 4 -
          scale * gridSquareLength,
      }),
    );
    expect(editor.getColumnCount()).toBe(columnCount); // it should not be changed
    expect(editor.getRowCount()).toBe(rowCount); // it should not be changed

    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousedown", {
        offsetX:
          canvasElement.width / 2 -
          (scale * gridSquareLength * columnCount) / 2 -
          (scale * DefaultButtonHeight) / 4,
        offsetY:
          canvasElement.height / 2 +
          (scale * gridSquareLength * rowCount) / 2 +
          (scale * DefaultButtonHeight) / 4,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mousemove", {
        offsetX:
          canvasElement.width / 2 -
          (scale * gridSquareLength * columnCount) / 2 -
          (scale * DefaultButtonHeight) / 4 +
          scale * gridSquareLength * resizeUnit,
        offsetY:
          canvasElement.height / 2 +
          (scale * gridSquareLength * rowCount) / 2 +
          (scale * DefaultButtonHeight) / 4 -
          scale * gridSquareLength * resizeUnit,
      }),
    );
    fireEvent(
      canvasElement,
      new FakeMouseEvent("mouseup", {
        offsetX:
          canvasElement.width / 2 -
          (scale * gridSquareLength * columnCount) / 2 -
          (scale * DefaultButtonHeight) / 4 +
          scale * gridSquareLength * resizeUnit,
        offsetY:
          canvasElement.height / 2 +
          (scale * gridSquareLength * rowCount) / 2 +
          (scale * DefaultButtonHeight) / 4 -
          scale * gridSquareLength * resizeUnit,
      }),
    );
    expect(editor.getColumnCount()).toBe(columnCount - resizeUnit);
    expect(editor.getRowCount()).toBe(rowCount - resizeUnit);
  });
});
