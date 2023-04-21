import { ButtonDirection, MouseMode } from ".";
import { Action } from "../../actions/Action";
import EventDispatcher from "../../utils/eventDispatcher";
import {
  calculateNewPanZoomFromPinchZoom,
  getMouseCartCoord,
  getPixelIndexFromMouseCartCoord,
  getPointFromTouchyEvent,
} from "../../utils/position";
import Stack from "../../utils/stack";
import { TouchyEvent, addEvent, touchy } from "../../utils/touch";
import GridLayer from "./GridLayer";
import InteractionLayer from "./InteractionLayer";
import {
  DefaultGridSquareLength,
  DefaultMaxScale,
  DefaultMinScale,
  DefaultPixelDataDimensions,
  DefaultZoomSensitivity,
} from "./config";
import {
  CanvasEvents,
  Coord,
  DottingData,
  GridIndices,
  PanZoom,
  PixelData,
} from "./types";

export default class Editor extends EventDispatcher {
  private gridLayer: GridLayer;
  private interactionLayer: InteractionLayer;
  private zoomSensitivity: number = DefaultZoomSensitivity;
  private maxScale: number = DefaultMaxScale;
  private minScale: number = DefaultMinScale;
  private pinchZoomDiff: number | null = null;
  private panZoom: PanZoom = {
    scale: 1,
    offset: { x: 0, y: 0 },
  };
  private panPoint: { lastMousePos: Coord } = {
    lastMousePos: { x: 0, y: 0 },
  };
  private extensionCaptureInfo: {
    direction: ButtonDirection;
    indices: GridIndices;
  } | null = null;
  private dpr = 1;
  private data: DottingData = new Map<
    // this number is rowIndex
    number,
    Map<
      // this number is columnIndex
      number,
      PixelData
    >
  >();
  private gridSquareLength: number = DefaultGridSquareLength;
  private undoHistory: Stack<Action> = new Stack();
  private redoHistory: Stack<Action> = new Stack();
  private extensionPoint: {
    lastMousePos: Coord;
    direction: ButtonDirection | null;
  } = {
    lastMousePos: { x: 0, y: 0 },
    direction: null,
  };
  private mouseMode: MouseMode = MouseMode.NULL;

  constructor(
    gridCanvas: HTMLCanvasElement,
    interactionCanvas: HTMLCanvasElement,
    initData?: Array<Array<PixelData>>,
  ) {
    super();
    let isInitDataValid = true;
    let initRowCount = 0;
    let initColumnCount = 0;

    if (initData) {
      const { isDataValid, rowCount, columnCount } =
        this.validateIncomingPixelData(initData);
      isInitDataValid = isDataValid;
      initRowCount = rowCount;
      initColumnCount = columnCount;
      for (let i = 0; i < initData.length; i++) {
        this.data.set(i, new Map());
        for (let j = 0; j < initData[i].length; j++) {
          this.data.get(i)!.set(j, { color: initData[i][j].color });
        }
      }
    } else {
      const { rowCount, columnCount } = DefaultPixelDataDimensions;
      initRowCount = rowCount;
      initColumnCount = columnCount;
      for (let i = 0; i < 6; i++) {
        this.data.set(i, new Map());
        for (let j = 0; j < 8; j++) {
          this.data.get(i)!.set(j, { color: "" });
        }
      }
    }

    this.gridLayer = new GridLayer({
      columnCount: initColumnCount,
      rowCount: initRowCount,
      canvas: gridCanvas,
    });
    this.interactionLayer = new InteractionLayer({
      canvas: interactionCanvas,
    });

    this.initialize();
  }

  validateIncomingPixelData(data: Array<Array<PixelData>>) {
    const dataRowCount = data.length;
    let columnCount = 0;
    let rowCount = dataRowCount;
    let isDataValid = true;
    if (dataRowCount < 2) {
      isDataValid = false;
    } else {
      const dataColumnCount = data[0].length;
      columnCount = dataColumnCount;
      if (dataColumnCount < 2) {
        isDataValid = false;
      } else {
        for (let i = 0; i < dataRowCount; i++) {
          if (data[i].length !== dataColumnCount) {
            isDataValid = false;
            break;
          }
        }
      }
    }
    return { isDataValid, columnCount, rowCount };
  }

  initialize() {
    this.emit = this.emit.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);

    // add event listeners
    touchy(
      this.getInteractionLayer().getElement(),
      addEvent,
      "mousedown",
      this.onMouseDown,
    );
    touchy(
      this.getInteractionLayer().getElement(),
      addEvent,
      "mouseup",
      this.onMouseUp,
    );
    touchy(
      this.getInteractionLayer().getElement(),
      addEvent,
      "mouseout",
      this.onMouseOut,
    );
    touchy(
      this.getInteractionLayer().getElement(),
      addEvent,
      "mousemove",
      this.onMouseMove,
    );
  }

  getColumnCount() {
    if (this.data.size === 0) return 0;
    return this.data.entries().next().value[1].size as number;
  }

  getRowCount() {
    return this.data.size;
  }

  getGridIndices(): GridIndices {
    const allRowKeys = Array.from(this.data.keys());
    const allColumnKeys = Array.from(this.data.get(allRowKeys[0])!.keys());
    const currentTopIndex = Math.min(...allRowKeys);
    const currentLeftIndex = Math.min(...allColumnKeys);
    const currentBottomIndex = Math.max(...allRowKeys);
    const currentRightIndex = Math.max(...allColumnKeys);
    return {
      topRowIndex: currentTopIndex,
      bottomRowIndex: currentBottomIndex,
      leftColumnIndex: currentLeftIndex,
      rightColumnIndex: currentRightIndex,
    };
  }

  getGridLayer() {
    return this.gridLayer;
  }

  getInteractionLayer() {
    return this.interactionLayer;
  }

  detectButtonClicked(coord: Coord): ButtonDirection | null {
    const { top, bottom, right, left } = this.gridLayer.getButtonsDimensions();
    const x = coord.x;
    const y = coord.y;
    if (
      x >= top.x &&
      x <= top.x + top.width &&
      y >= top.y &&
      y <= top.y + top.height
    ) {
      return ButtonDirection.TOP;
    } else if (
      x >= bottom.x &&
      x <= bottom.x + bottom.width &&
      y >= bottom.y &&
      y <= bottom.y + bottom.height
    ) {
      return ButtonDirection.BOTTOM;
    } else if (
      x >= left.x &&
      x <= left.x + left.width &&
      y >= left.y &&
      y <= left.y + left.height
    ) {
      return ButtonDirection.LEFT;
    } else if (
      x >= right.x &&
      x <= right.x + right.width &&
      y >= right.y &&
      y <= right.y + right.height
    ) {
      return ButtonDirection.RIGHT;
    } else {
      return null;
    }
  }

  setPanZoom(panZoom: PanZoom) {
    this.panZoom.offset.x = panZoom.offset.x;
    this.panZoom.offset.y = panZoom.offset.y;
    this.panZoom.scale = panZoom.scale;
  }

  handlePinchZoom(evt: TouchyEvent) {
    const element = this.getInteractionLayer().getElement();
    const { pinchZoomDiff, panZoom } = calculateNewPanZoomFromPinchZoom(
      evt,
      element,
      this.panZoom,
      this.zoomSensitivity,
      this.pinchZoomDiff,
      this.minScale,
      this.maxScale,
    );
    this.pinchZoomDiff = pinchZoomDiff;
    this.setPanZoom(panZoom);
  }

  onMouseDown(evt: TouchyEvent) {
    evt.preventDefault();
    const element = this.getInteractionLayer().getElement();
    const point = getPointFromTouchyEvent(evt, element, this.panZoom);
    this.panPoint.lastMousePos = { x: point.offsetX, y: point.offsetY };

    const mouseCartCoord = getMouseCartCoord(
      evt,
      element,
      this.panZoom,
      this.dpr,
    );
    const gridIndices = this.getGridIndices();
    const pixelIndex = getPixelIndexFromMouseCartCoord(
      mouseCartCoord,
      this.getRowCount(),
      this.getColumnCount(),
      this.gridSquareLength,
      gridIndices.topRowIndex,
      gridIndices.leftColumnIndex,
    );
    if (pixelIndex) {
      this.emit(CanvasEvents.HOVER_PIXEL_CHANGE, null);
      // TODO
      // this.drawPixel(pixelIndex.rowIndex, pixelIndex.columnIndex);
    }
    this.mouseMode = pixelIndex ? MouseMode.DRAWING : MouseMode.PANNING;
    const isGridFixed = this.getGridLayer().getIsGridFixed();
    if (!isGridFixed) {
      const buttonDirection = this.detectButtonClicked(mouseCartCoord);
      if (buttonDirection) {
        this.extensionPoint.lastMousePos = {
          x: mouseCartCoord.x,
          y: mouseCartCoord.y,
        };

        this.extensionPoint.direction = buttonDirection;
        this.extensionCaptureInfo = {
          direction: buttonDirection,
          indices: this.getGridIndices(),
        };
        this.mouseMode = MouseMode.EXTENDING;
        // TODO
        // touchy(element, addEvent, "mousemove", this.handleExtension);
      }
    }

    if (this.mouseMode === MouseMode.PANNING) {
      // TODO
      // touchy(element, addEvent, "mousemove", this.handlePanning);
      touchy(element, addEvent, "mousemove", this.handlePinchZoom);
    }
  }

  onMouseMove(evt: TouchEvent) {}

  onMouseUp(evt: TouchEvent) {}

  onMouseOut(evt: TouchEvent) {}

  renderGridLayer() {}

  renderDataLayer() {}

  renderInteractionLayer() {}
}
