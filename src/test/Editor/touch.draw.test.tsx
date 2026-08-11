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

describe("touch events for drawing tools", () => {
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
    identifier = 0,
  ): Partial<Touch> => ({
    clientX: offset.x,
    clientY: offset.y,
    pageX: offset.x,
    pageY: offset.y,
    target,
    identifier,
  });

  /**
   * Simulate a full touch interaction. Both touchend and touchcancel have an
   * empty `touches` list and put the released finger in `changedTouches`,
   * matching the browser API.
   */
  function simulateTouchDraw(
    element: HTMLCanvasElement,
    start: { x: number; y: number },
    end: { x: number; y: number },
    endEventType: "touchend" | "touchcancel" = "touchend",
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

    // The completed/cancelled touch is only available in changedTouches.
    fireEvent(
      element,
      createFakeTouchEvent(endEventType, {
        touches: [],
        changedTouches: [makeTouchEntry(end, element)],
      }),
    );
  }

  const getPaintedPixels = () =>
    editor
      .getLayersAsArray()[0]
      .data.reduce((allPixels, row) => allPixels.concat(row), [])
      .filter(pixel => pixel.color !== "");

  it("LINE tool commits pixels to data layer via touch", () => {
    editor.setBrushTool(BrushTool.LINE);
    editor.setBrushAlpha(0.4);
    editor.setDefaultPixelColor("#FF0000");

    simulateTouchDraw(canvasElement, startOffset, endOffset);

    const pixels = getPaintedPixels();

    expect(pixels.length).toBeGreaterThan(0);
    expect(pixels.every(pixel => pixel.alpha === 0.4)).toBe(true);
  });

  it("RECTANGLE tool commits pixels to data layer via touch", () => {
    editor.setBrushTool(BrushTool.RECTANGLE);
    editor.setBrushAlpha(0.5);
    editor.setDefaultPixelColor("#00FF00");

    simulateTouchDraw(canvasElement, startOffset, endOffset);

    const pixels = getPaintedPixels();

    expect(pixels.length).toBeGreaterThan(0);
    expect(pixels.every(pixel => pixel.alpha === 0.5)).toBe(true);
  });

  it("ELLIPSE tool commits pixels to data layer via touch", () => {
    editor.setBrushTool(BrushTool.ELLIPSE);
    editor.setBrushAlpha(0.6);
    editor.setDefaultPixelColor("#0000FF");

    simulateTouchDraw(canvasElement, startOffset, endOffset);

    const pixels = getPaintedPixels();

    expect(pixels.length).toBeGreaterThan(0);
    expect(pixels.every(pixel => pixel.alpha === 0.6)).toBe(true);
  });

  it("DOT tool applies brush and pattern alpha throughout a touch stroke", () => {
    editor.setBrushTool(BrushTool.DOT);
    editor.setBrushColor("#336699");
    editor.setBrushAlpha(0.8);
    editor.setBrushPattern([[0.5]]);

    simulateTouchDraw(canvasElement, startOffset, endOffset);

    const pixels = getPaintedPixels();
    expect(pixels.length).toBeGreaterThan(1);
    expect(pixels.every(pixel => pixel.color === "#336699")).toBe(true);
    expect(pixels.every(pixel => pixel.alpha === 0.4)).toBe(true);
  });

  it("PAINT_BUCKET applies alpha when activated by touch", () => {
    editor.setBrushTool(BrushTool.PAINT_BUCKET);
    editor.setBrushColor("#663399");
    editor.setBrushAlpha(0.25);

    simulateTouchDraw(canvasElement, startOffset, startOffset);

    const pixels = getPaintedPixels();
    expect(pixels).toHaveLength(editor.getRowCount() * editor.getColumnCount());
    expect(pixels.every(pixel => pixel.color === "#663399")).toBe(true);
    expect(pixels.every(pixel => pixel.alpha === 0.25)).toBe(true);
  });

  it.each([
    ["LINE", BrushTool.LINE],
    ["RECTANGLE", BrushTool.RECTANGLE],
    ["RECTANGLE_FILLED", BrushTool.RECTANGLE_FILLED],
    ["ELLIPSE", BrushTool.ELLIPSE],
    ["ELLIPSE_FILLED", BrushTool.ELLIPSE_FILLED],
  ])("%s commits alpha pixels when a touch is cancelled", (_, brushTool) => {
    editor.setBrushTool(brushTool);
    editor.setBrushColor("#123456");
    editor.setBrushAlpha(0.35);

    simulateTouchDraw(canvasElement, startOffset, endOffset, "touchcancel");

    const pixels = getPaintedPixels();
    expect(pixels.length).toBeGreaterThan(0);
    expect(pixels.every(pixel => pixel.color === "#123456")).toBe(true);
    expect(pixels.every(pixel => pixel.alpha === 0.35)).toBe(true);
  });

  it("preserves single-touch panning", () => {
    editor.setBrushTool(BrushTool.NONE);
    const previousOffset = editor.getPanZoom().offset;

    simulateTouchDraw(canvasElement, startOffset, endOffset);

    const nextOffset = editor.getPanZoom().offset;
    expect(nextOffset.x - previousOffset.x).toBeCloseTo(
      endOffset.x - startOffset.x,
    );
    expect(nextOffset.y - previousOffset.y).toBeCloseTo(
      endOffset.y - startOffset.y,
    );
  });

  it("preserves two-touch pinch zooming", () => {
    editor.setBrushTool(BrushTool.NONE);
    const initialScale = editor.getPanZoom().scale;
    const initialTouches = [
      makeTouchEntry({ x: startOffset.x - 40, y: startOffset.y }, canvasElement),
      makeTouchEntry(
        { x: startOffset.x + 40, y: startOffset.y },
        canvasElement,
        1,
      ),
    ];
    const expandedTouches = [
      makeTouchEntry({ x: startOffset.x - 80, y: startOffset.y }, canvasElement),
      makeTouchEntry(
        { x: startOffset.x + 80, y: startOffset.y },
        canvasElement,
        1,
      ),
    ];

    fireEvent(
      canvasElement,
      createFakeTouchEvent("touchstart", {
        touches: initialTouches,
        changedTouches: initialTouches,
      }),
    );
    fireEvent(
      canvasElement,
      createFakeTouchEvent("touchmove", {
        touches: initialTouches,
        changedTouches: initialTouches,
      }),
    );
    fireEvent(
      canvasElement,
      createFakeTouchEvent("touchmove", {
        touches: expandedTouches,
        changedTouches: expandedTouches,
      }),
    );

    expect(editor.getPanZoom().scale).toBeGreaterThan(initialScale);
  });
});
