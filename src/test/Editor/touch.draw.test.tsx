import { fireEvent } from "@testing-library/react";

import Editor from "../../components/Canvas/Editor";
import { BrushTool } from "../../components/Canvas/types";

/**
 * jsdom does not provide TouchEvent, so we polyfill it for testing.
 * This creates a minimal TouchEvent whose `touches` and `changedTouches`
 * behave like the real browser API.
 */
function createFakeTouchEvent(
  type: string,
  {
    touches = [] as Array<Partial<Touch>>,
    changedTouches = [] as Array<Partial<Touch>>,
  }: {
    touches?: Array<Partial<Touch>>;
    changedTouches?: Array<Partial<Touch>>;
  },
): TouchEvent {
  const makeTouchList = (items: Array<Partial<Touch>>): TouchList => {
    const list = items as unknown as Touch[];
    const touchList = {
      length: list.length,
      item: (i: number) => list[i] ?? null,
    };
    for (let i = 0; i < list.length; i++) {
      (touchList as Record<number, Touch>)[i] = list[i];
    }
    return touchList as unknown as TouchList;
  };

  const event = new Event(type, {
    bubbles: true,
    cancelable: true,
  }) as unknown as TouchEvent;

  Object.defineProperties(event, {
    touches: { value: makeTouchList(touches) },
    changedTouches: { value: makeTouchList(changedTouches) },
    targetTouches: { value: makeTouchList([]) },
  });

  return event;
}

describe("touch events for shape tools", () => {
  let editor: Editor;
  let canvasElement: HTMLCanvasElement;
  let startOffset: { x: number; y: number };
  let endOffset: { x: number; y: number };

  beforeEach(() => {
    // Make TouchEvent available on window so Editor's instanceof check works
    (window as any).TouchEvent = Event;

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
    editor = new Editor({
      gridCanvas,
      interactionCanvas,
      dataCanvas,
      backgroundCanvas,
      foregroundCanvas,
      width: 800,
      height: 800,
    });
    canvasElement = editor.getCanvasElement();

    const columnCount = editor.getColumnCount();
    const rowCount = editor.getRowCount();
    const gridSquareLength = editor.getGridSquareLength();

    // Pixel (0,0) center
    startOffset = {
      x:
        canvasElement.width / 2 -
        (gridSquareLength * columnCount) / 2 +
        gridSquareLength / 2,
      y:
        canvasElement.height / 2 -
        (gridSquareLength * rowCount) / 2 +
        gridSquareLength / 2,
    };

    // Pixel (3,3) center
    endOffset = {
      x: startOffset.x + gridSquareLength * 3,
      y: startOffset.y + gridSquareLength * 3,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete (window as any).TouchEvent;
  });

  const makeTouchEntry = (
    offset: { x: number; y: number },
    target: HTMLCanvasElement,
  ): Partial<Touch> => ({
    clientX: offset.x,
    clientY: offset.y,
    pageX: offset.x,
    pageY: offset.y,
    target,
    identifier: 0,
  });

  /**
   * Simulate a full touch interaction: touchstart → touchmove → touchend.
   * touchend has an empty `touches` and the released finger in `changedTouches`,
   * matching real browser behavior.
   */
  function simulateTouchDraw(
    element: HTMLCanvasElement,
    start: { x: number; y: number },
    end: { x: number; y: number },
  ) {
    fireEvent(
      element,
      createFakeTouchEvent("touchstart", {
        touches: [makeTouchEntry(start, element)],
        changedTouches: [makeTouchEntry(start, element)],
      }),
    );

    fireEvent(
      element,
      createFakeTouchEvent("touchmove", {
        touches: [makeTouchEntry(end, element)],
        changedTouches: [makeTouchEntry(end, element)],
      }),
    );

    // touchend: touches is EMPTY, released finger is in changedTouches
    fireEvent(
      element,
      createFakeTouchEvent("touchend", {
        touches: [],
        changedTouches: [makeTouchEntry(end, element)],
      }),
    );
  }

  it("LINE tool commits pixels to data layer via touch", () => {
    editor.setBrushTool(BrushTool.LINE);
    editor.setDefaultPixelColor("#FF0000");

    simulateTouchDraw(canvasElement, startOffset, endOffset);

    const data = editor.getLayersAsArray()[0].data;
    const pixels: { rowIndex: number; columnIndex: number }[] = [];
    data.forEach((row, rowIndex) => {
      row.forEach((pixel, colIndex) => {
        if (pixel.color !== "") {
          pixels.push({ rowIndex, columnIndex: colIndex });
        }
      });
    });

    expect(pixels.length).toBeGreaterThan(0);
  });

  it("RECTANGLE tool commits pixels to data layer via touch", () => {
    editor.setBrushTool(BrushTool.RECTANGLE);
    editor.setDefaultPixelColor("#00FF00");

    simulateTouchDraw(canvasElement, startOffset, endOffset);

    const data = editor.getLayersAsArray()[0].data;
    const pixels: { rowIndex: number; columnIndex: number }[] = [];
    data.forEach((row, rowIndex) => {
      row.forEach((pixel, colIndex) => {
        if (pixel.color !== "") {
          pixels.push({ rowIndex, columnIndex: colIndex });
        }
      });
    });

    expect(pixels.length).toBeGreaterThan(0);
  });

  it("ELLIPSE tool commits pixels to data layer via touch", () => {
    editor.setBrushTool(BrushTool.ELLIPSE);
    editor.setDefaultPixelColor("#0000FF");

    simulateTouchDraw(canvasElement, startOffset, endOffset);

    const data = editor.getLayersAsArray()[0].data;
    const pixels: { rowIndex: number; columnIndex: number }[] = [];
    data.forEach((row, rowIndex) => {
      row.forEach((pixel, colIndex) => {
        if (pixel.color !== "") {
          pixels.push({ rowIndex, columnIndex: colIndex });
        }
      });
    });

    expect(pixels.length).toBeGreaterThan(0);
  });
});
