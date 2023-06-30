import BackgroundLayer from "./BackgroundLayer";
import {
  DefaultGridSquareLength,
  DefaultMaxScale,
  DefaultMinScale,
  DefaultZoomSensitivity,
  MouseMode,
  ButtonDirection,
  CurrentDeviceUserId,
} from "./config";
import DataLayer from "./DataLayer";
import GridLayer from "./GridLayer";
import InteractionLayer from "./InteractionLayer";
import {
  BrushTool,
  CanvasBrushChangeParams,
  CanvasDataChangeParams,
  CanvasEvents,
  CanvasGridChangeParams,
  CanvasHoverPixelChangeParams,
  CanvasStrokeEndParams,
  ColorChangeItem,
  Coord,
  GridIndices,
  ImageDownloadOptions,
  PanZoom,
  PixelData,
  PixelModifyItem,
} from "./types";
import { Action, ActionType } from "../../actions/Action";
import { ColorChangeAction } from "../../actions/ColorChangeAction";
import { ColorSizeChangeAction } from "../../actions/ColorSizeChangeAction";
import { SelectAreaMoveAction } from "../../actions/SelectAreaMoveAction";
import { SizeChangeAction } from "../../actions/SizeChangeAction";
import {
  createColumnKeyOrderMapfromData,
  createRowKeyOrderMapfromData,
  getColumnCountFromData,
  getColumnKeysFromData,
  getGridIndicesFromData,
  getInBetweenPixelIndicesfromCoords,
  getRowCountFromData,
  getRowKeysFromData,
} from "../../utils/data";
import EventDispatcher from "../../utils/eventDispatcher";
import { generatePixelId } from "../../utils/identifier";
import {
  convertCartesianToScreen,
  diffPoints,
  getScreenPoint,
  lerpRanges,
} from "../../utils/math";
import {
  calculateNewPanZoomFromPinchZoom,
  getIsPointInsideRegion,
  getMouseCartCoord,
  getPixelIndexFromMouseCartCoord,
  getPointFromTouchyEvent,
  convertWorldPosAreaToPixelGridArea,
  returnScrollOffsetFromMouseOffset,
  getDoesAreaOverlapPixelgrid,
} from "../../utils/position";
import Queue from "../../utils/queue";
import Stack from "../../utils/stack";
import { TouchyEvent, addEvent, removeEvent, touchy } from "../../utils/touch";
import { Indices } from "../../utils/types";
import { isValidIndicesRange } from "../../utils/validation";

export default class Editor extends EventDispatcher {
  private gridLayer: GridLayer;
  private interactionLayer: InteractionLayer;
  private dataLayer: DataLayer;
  private backgroundLayer: BackgroundLayer;
  private zoomSensitivity: number = DefaultZoomSensitivity;
  private maxScale: number = DefaultMaxScale;
  private minScale: number = DefaultMinScale;
  private extensionAllowanceRatio = 2;
  private pinchZoomDiff: number | null = null;
  private width: number;
  private height: number;

  private panZoom: PanZoom = {
    scale: 1,
    offset: { x: 0, y: 0 },
  };
  private panPoint: { lastMousePos: Coord } = {
    lastMousePos: { x: 0, y: 0 },
  };
  private dpr = 1;
  private brushColor = "#FF0000";
  private gridSquareLength: number = DefaultGridSquareLength;
  private maxHistoryCount = 100;
  private undoHistory: Array<Action> = [];
  private redoHistory: Array<Action> = [];
  private extensionPoint: {
    direction: ButtonDirection | null;
    offsetYAmount: number;
    offsetXAmount: number;
  } = {
    direction: null,
    offsetYAmount: 0,
    offsetXAmount: 0,
  };
  private isPanZoomable = true;
  private mouseMode: MouseMode = MouseMode.PANNING;
  private brushTool: BrushTool = BrushTool.DOT;

  private mouseDownWorldPos: Coord | null = null;
  private mouseDownPanZoom: PanZoom | null = null;
  private mouseMoveWorldPos: Coord = { x: 0, y: 0 };
  private previousMouseMoveWorldPos: Coord | null = null;
  // TODO: why do we need this? For games?
  private isInteractionEnabled = true;
  // We need isInteractionApplicable to allow multiplayer
  // We must let yorkie-js-sdk to apply change to data layer not the client
  private isInteractionApplicable = true;

  private element: HTMLCanvasElement;

  constructor({
    gridCanvas,
    interactionCanvas,
    dataCanvas,
    backgroundCanvas,
    initData,
  }: {
    gridCanvas: HTMLCanvasElement;
    interactionCanvas: HTMLCanvasElement;
    dataCanvas: HTMLCanvasElement;
    backgroundCanvas: HTMLCanvasElement;
    initData?: Array<Array<PixelData>>;
  }) {
    super();
    this.dataLayer = new DataLayer({ canvas: dataCanvas, initData: initData });
    const initRowCount = this.dataLayer.getRowCount();
    const initColumnCount = this.dataLayer.getColumnCount();
    this.gridLayer = new GridLayer({
      columnCount: initColumnCount,
      rowCount: initRowCount,
      canvas: gridCanvas,
    });
    this.interactionLayer = new InteractionLayer({
      columnCount: initColumnCount,
      rowCount: initRowCount,
      canvas: interactionCanvas,
    });
    this.backgroundLayer = new BackgroundLayer({
      canvas: backgroundCanvas,
    });
    this.interactionLayer.setCriterionDataForRendering(
      this.dataLayer.getData(),
    );
    this.dataLayer.setCriterionDataForRendering(this.dataLayer.getData());
    this.element = interactionCanvas;

    this.initialize();
  }

  initialize() {
    this.emit = this.emit.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);

    // add event listeners
    touchy(this.element, addEvent, "mousedown", this.onMouseDown);
    touchy(this.element, addEvent, "mouseup", this.onMouseUp);
    touchy(this.element, addEvent, "mouseout", this.onMouseOut);
    touchy(this.element, addEvent, "mousemove", this.onMouseMove);
    this.element.addEventListener("wheel", this.handleWheel);
  }

  emitCurrentGridStatus() {
    const data = this.dataLayer.getData();
    const dimensions = {
      columnCount: this.getColumnCount(),
      rowCount: this.getRowCount(),
    };
    const indices = getGridIndicesFromData(data);
    this.emitGridChangeEvent({
      dimensions,
      indices,
    });
  }

  emitCurrentHoverPixelStatus() {
    this.emitHoverPixelChangeEvent({
      indices: this.interactionLayer.getHoveredPixel(),
    });
  }

  emitCurrentData() {
    this.emitDataChangeEvent({ data: this.dataLayer.getCopiedData() });
  }

  emitCurrentBrushTool() {
    this.emitBrushChangeEvent({
      brushColor: this.brushColor,
      brushTool: this.brushTool,
    });
  }

  emitDataChangeEvent(params: CanvasDataChangeParams) {
    this.emit(CanvasEvents.DATA_CHANGE, params);
  }

  emitGridChangeEvent(params: CanvasGridChangeParams) {
    this.emit(CanvasEvents.GRID_CHANGE, params);
  }

  emitStrokeEndEvent(params: CanvasStrokeEndParams) {
    this.emit(CanvasEvents.STROKE_END, params);
  }

  emitHoverPixelChangeEvent(params: CanvasHoverPixelChangeParams) {
    this.emit(CanvasEvents.HOVER_PIXEL_CHANGE, params);
  }

  emitBrushChangeEvent(params: CanvasBrushChangeParams) {
    this.emit(CanvasEvents.BRUSH_CHANGE, params);
  }

  // background related functions ⬇
  setBackgroundMode(backgroundMode?: "checkerboard" | "color") {
    this.backgroundLayer.setBackgroundMode(backgroundMode);
    this.renderBackgroundLayer();
  }

  setBackgroundAlpha(alpha: number) {
    this.backgroundLayer.setBackgroundAlpha(alpha);
    this.renderBackgroundLayer();
  }

  setBackgroundColor(color: React.CSSProperties["color"]) {
    this.backgroundLayer.setBackgroundColor(color);
    this.renderBackgroundLayer();
  }
  // background related functions ⬆

  // interaction related functions ⬇
  setIndicatorPixels(indicatorPixels: Array<PixelModifyItem>) {
    this.interactionLayer.setIndicatorPixels(indicatorPixels);
    this.renderInteractionLayer();
  }
  // interaction related functions ⬆

  // grid related functions ⬇
  setIsGridFixed(isGridFixed: boolean) {
    this.gridLayer.setIsGridFixed(isGridFixed);
    this.renderGridLayer();
  }

  setGridStrokeColor(color: string) {
    this.gridLayer.setGridStrokeColor(color);
    this.renderGridLayer();
  }

  setGridStrokeWidth(width: number) {
    this.gridLayer.setGridStrokeWidth(width);
    this.renderGridLayer();
  }

  setIsGridVisible(isGridVisible: boolean) {
    this.gridLayer.setIsGridVisible(isGridVisible);
    this.renderGridLayer();
  }
  // grid related functions ⬆

  setIsPanZoomable(isPanZoomable: boolean) {
    if (isPanZoomable !== undefined) {
      this.isPanZoomable = isPanZoomable;
    }
  }

  setIsInteractionEnabled(isInteractionEnabled: boolean) {
    if (isInteractionEnabled !== undefined) {
      this.isInteractionEnabled = isInteractionEnabled;
    }
  }

  setIsInteractionApplicable(isInteractionApplicable: boolean) {
    if (isInteractionApplicable !== undefined) {
      this.isInteractionApplicable = isInteractionApplicable;
    }
  }

  setBrushTool(tool: BrushTool) {
    this.brushTool = tool;
    if (this.brushTool !== BrushTool.SELECT) {
      this.interactionLayer.setSelectedArea(null);
      this.interactionLayer.setSelectingArea(null);
    }
    this.emitBrushChangeEvent({
      brushColor: this.brushColor,
      brushTool: this.brushTool,
    });
  }

  changeBrushColor(color: string) {
    this.brushColor = color;
    this.emitBrushChangeEvent({
      brushColor: this.brushColor,
      brushTool: this.brushTool,
    });
  }

  setBrushColor(color: string) {
    if (color !== undefined) {
      this.brushColor = color;
      const hoveredPixel = this.interactionLayer.getHoveredPixel();
      if (hoveredPixel) {
        this.interactionLayer.setHoveredPixel({
          ...hoveredPixel,
          color: this.brushColor,
        });
        this.renderDataLayer();
      }
    }
  }

  getColumnCount() {
    return this.dataLayer.getColumnCount();
  }

  getRowCount() {
    return this.dataLayer.getRowCount();
  }

  getGridIndices(): GridIndices {
    return this.dataLayer.getGridIndices();
  }

  styleMouseCursor = (mouseCoord: Coord) => {
    const hoveredButton = this.gridLayer.getHoveredButton();
    if (hoveredButton) {
      switch (hoveredButton) {
        case ButtonDirection.TOP:
          this.element.style.cursor = `ns-resize`;
          break;
        case ButtonDirection.BOTTOM:
          this.element.style.cursor = `ns-resize`;
          break;
        case ButtonDirection.LEFT:
          this.element.style.cursor = `ew-resize`;
          break;
        case ButtonDirection.RIGHT:
          this.element.style.cursor = `ew-resize`;
          break;
        case ButtonDirection.TOPLEFT:
          this.element.style.cursor = "nw-resize";
          break;
        case ButtonDirection.TOPRIGHT:
          this.element.style.cursor = "ne-resize";
          break;
        case ButtonDirection.BOTTOMLEFT:
          this.element.style.cursor = "sw-resize";
          break;
        case ButtonDirection.BOTTOMRIGHT:
          this.element.style.cursor = "se-resize";
          break;
      }
    } else {
      switch (this.brushTool) {
        case BrushTool.DOT:
          this.element.style.cursor = `crosshair`;
          break;
        case BrushTool.ERASER:
          this.element.style.cursor = `crosshair`;
          break;
        case BrushTool.PAINT_BUCKET:
          this.element.style.cursor = `crosshair`;
          break;
        case BrushTool.SELECT:
          this.element.style.cursor = `crosshair`;
          if (this.interactionLayer.getSelectedArea()) {
            const direction =
              this.interactionLayer.detectSelectedAreaExtendDirection(
                mouseCoord,
              );
            if (direction) {
              switch (direction) {
                case ButtonDirection.TOP:
                  this.element.style.cursor = `ns-resize`;
                  break;
                case ButtonDirection.BOTTOM:
                  this.element.style.cursor = `ns-resize`;
                  break;
                case ButtonDirection.LEFT:
                  this.element.style.cursor = `ew-resize`;
                  break;
                case ButtonDirection.RIGHT:
                  this.element.style.cursor = `ew-resize`;
                  break;
                case ButtonDirection.TOPLEFT:
                  this.element.style.cursor = "nw-resize";
                  break;
                case ButtonDirection.TOPRIGHT:
                  this.element.style.cursor = "ne-resize";
                  break;
                case ButtonDirection.BOTTOMLEFT:
                  this.element.style.cursor = "sw-resize";
                  break;
                case ButtonDirection.BOTTOMRIGHT:
                  this.element.style.cursor = "se-resize";
                  break;
              }
            } else {
              this.element.style.cursor = `grab`;
            }
          }
          break;
        default:
          this.element.style.cursor = `default`;
          break;
      }
    }
  };

  detectButtonClicked(coord: Coord): ButtonDirection | null {
    const { top, bottom, right, left } = this.gridLayer.getButtonsDimensions();
    const x = coord.x;
    const y = coord.y;
    const scaledYHeight = lerpRanges(
      this.panZoom.scale,
      // this range is inverted because height has to be smaller when zoomed in
      this.maxScale,
      this.minScale,
      top.height,
      top.height * this.extensionAllowanceRatio,
    );
    const scaledXWidth = lerpRanges(
      this.panZoom.scale,
      // this range is inverted because width has to be smaller when zoomed in
      this.maxScale,
      this.minScale,
      left.width,
      left.width * this.extensionAllowanceRatio,
    );
    if (
      x >= top.x &&
      x <= top.x + top.width &&
      y >= top.y - scaledYHeight + top.height &&
      y <= top.y + top.height
    ) {
      return ButtonDirection.TOP;
    } else if (
      x >= bottom.x &&
      x <= bottom.x + bottom.width &&
      y >= bottom.y &&
      y <= bottom.y + scaledYHeight
    ) {
      return ButtonDirection.BOTTOM;
    } else if (
      x >= left.x - scaledXWidth + left.width &&
      x <= left.x + left.width &&
      y >= left.y &&
      y <= left.y + left.height
    ) {
      return ButtonDirection.LEFT;
    } else if (
      x >= right.x &&
      x <= right.x + scaledXWidth &&
      y >= right.y &&
      y <= right.y + right.height
    ) {
      return ButtonDirection.RIGHT;
    } else if (
      x >= left.x - scaledXWidth + left.width &&
      x <= left.x + left.width &&
      y >= top.y - scaledYHeight + top.height &&
      y <= top.y + top.height
    ) {
      return ButtonDirection.TOPLEFT;
    } else if (
      x >= right.x &&
      x <= right.x + scaledXWidth &&
      y >= top.y - scaledYHeight + top.height &&
      y <= top.y + top.height
    ) {
      return ButtonDirection.TOPRIGHT;
    } else if (
      x >= left.x - scaledXWidth + left.width &&
      x <= left.x + left.width &&
      y >= bottom.y &&
      y <= bottom.y + scaledYHeight
    ) {
      return ButtonDirection.BOTTOMLEFT;
    } else if (
      x >= right.x &&
      x <= right.x + scaledXWidth &&
      y >= bottom.y &&
      y <= bottom.y + scaledYHeight
    ) {
      return ButtonDirection.BOTTOMRIGHT;
    } else {
      return null;
    }
  }

  scale(x: number, y: number) {
    this.dataLayer.scale(x, y);
    this.gridLayer.scale(x, y);
    this.interactionLayer.scale(x, y);
    this.backgroundLayer.scale(x, y);
  }

  setWidth(width: number, devicePixelRatio?: number) {
    this.width = width;
    this.dataLayer.setWidth(width, devicePixelRatio);
    this.gridLayer.setWidth(width, devicePixelRatio);
    this.interactionLayer.setWidth(width, devicePixelRatio);
    this.backgroundLayer.setWidth(width, devicePixelRatio);
  }

  setHeight(height: number, devicePixelRatio?: number) {
    this.height = height;
    this.dataLayer.setHeight(height, devicePixelRatio);
    this.gridLayer.setHeight(height, devicePixelRatio);
    this.interactionLayer.setHeight(height, devicePixelRatio);
    this.backgroundLayer.setHeight(height, devicePixelRatio);
  }

  getWidth() {
    return this.width;
  }

  getHeight() {
    return this.height;
  }

  getCanvasElement() {
    return this.element;
  }

  setSize(width: number, height: number, devicePixelRatio?: number) {
    this.setWidth(width, devicePixelRatio);
    this.setHeight(height, devicePixelRatio);
    this.setDpr(devicePixelRatio ? devicePixelRatio : this.dpr);
  }

  setDpr(dpr: number) {
    this.dpr = dpr;
    this.dataLayer.setDpr(dpr);
    this.gridLayer.setDpr(dpr);
    this.interactionLayer.setDpr(dpr);
  }

  setPanZoom({
    offset,
    scale,
    baseColumnCount,
    baseRowCount,
  }: Partial<PanZoom> & { baseColumnCount?: number; baseRowCount?: number }) {
    if (scale) {
      this.panZoom.scale = scale;
    }
    if (offset) {
      const correctedOffset = { ...offset };
      const columnCount = baseColumnCount
        ? baseColumnCount
        : this.dataLayer.getColumnCount();
      const rowCount = baseRowCount
        ? baseRowCount
        : this.dataLayer.getRowCount();

      // rowCount * this.gridSquareLength * this.panZoom.scale < this.height
      // Offset changes when grid is bigger than canvas
      const isGridRowsBiggerThanCanvas =
        rowCount * this.gridSquareLength * this.panZoom.scale > this.height;
      const isGridColumnsBiggerThanCanvas =
        columnCount * this.gridSquareLength * this.panZoom.scale > this.width;

      const minXPosition = isGridColumnsBiggerThanCanvas
        ? this.width -
          columnCount * this.gridSquareLength * this.panZoom.scale -
          ((this.width - columnCount * this.gridSquareLength) *
            this.panZoom.scale) /
            2
        : (-(this.width - columnCount * this.gridSquareLength) / 2) *
          this.panZoom.scale;

      const minYPosition = isGridRowsBiggerThanCanvas
        ? this.height -
          rowCount * this.gridSquareLength * this.panZoom.scale -
          ((this.height - rowCount * this.gridSquareLength) *
            this.panZoom.scale) /
            2
        : (-(this.height - rowCount * this.gridSquareLength) / 2) *
          this.panZoom.scale;

      const maxXPosition = isGridColumnsBiggerThanCanvas
        ? (-(this.width - columnCount * this.gridSquareLength) / 2) *
          this.panZoom.scale
        : this.width -
          columnCount * this.gridSquareLength * this.panZoom.scale -
          ((this.width - columnCount * this.gridSquareLength) *
            this.panZoom.scale) /
            2;

      const maxYPosition = isGridRowsBiggerThanCanvas
        ? (rowCount * this.gridSquareLength * this.panZoom.scale) / 2 -
          (this.height / 2) * this.panZoom.scale
        : this.height -
          rowCount * this.gridSquareLength * this.panZoom.scale -
          ((this.height - rowCount * this.gridSquareLength) *
            this.panZoom.scale) /
            2;
      if (correctedOffset.x < minXPosition) {
        correctedOffset.x = minXPosition;
      }
      if (correctedOffset.y < minYPosition) {
        correctedOffset.y = minYPosition;
      }
      if (correctedOffset.x > maxXPosition) {
        correctedOffset.x = maxXPosition;
      }
      if (correctedOffset.y > maxYPosition) {
        correctedOffset.y = maxYPosition;
      }
      this.panZoom.offset = correctedOffset;
    }
    // relay updated information to layers
    this.relayPanZoomToOtherLayers();
    // we must render all when panzoom changes!
    this.renderAll();
  }

  relayPanZoomToOtherLayers() {
    this.dataLayer.setPanZoom(this.panZoom);
    this.gridLayer.setPanZoom(this.panZoom);
    this.interactionLayer.setPanZoom(this.panZoom);
  }

  handleExtension = (evt: TouchyEvent) => {
    evt.preventDefault();
    const interactionLayer = this.interactionLayer;
    const interactionCapturedData = interactionLayer.getCapturedData();
    if (!interactionCapturedData) {
      // we will copy the data to interaction layer
      interactionLayer.setCapturedData(this.dataLayer.getCopiedData());
    }
    const minAmountForExtension = this.gridSquareLength;
    if (window.TouchEvent && evt instanceof TouchEvent) {
      if (evt.touches.length > 1) {
        return;
      }
    }
    const mouseDownPanZoom = this.mouseDownPanZoom!;
    const mouseCartCoord = getMouseCartCoord(
      evt,
      this.element,
      mouseDownPanZoom,
      this.dpr,
    );
    const buttonDirection = this.extensionPoint.direction;
    const mouseOffsetDegree = diffPoints(
      this.mouseDownWorldPos,
      mouseCartCoord,
    );
    const mouseOffsetChangeYAmount =
      mouseOffsetDegree.y > 0
        ? Math.floor(mouseOffsetDegree.y / minAmountForExtension)
        : Math.ceil(mouseOffsetDegree.y / minAmountForExtension);
    const mouseOffsetChangeXAmount =
      mouseOffsetDegree.x > 0
        ? Math.floor(mouseOffsetDegree.x / minAmountForExtension)
        : Math.ceil(mouseOffsetDegree.x / minAmountForExtension);
    if (
      Math.abs(mouseOffsetChangeYAmount) == 0 &&
      Math.abs(mouseOffsetChangeXAmount) == 0
    ) {
      return;
    }
    const changeYAmountDiff =
      mouseOffsetChangeYAmount - this.extensionPoint.offsetYAmount;
    const changeXAmountDiff =
      mouseOffsetChangeXAmount - this.extensionPoint.offsetXAmount;

    if (Math.abs(changeYAmountDiff) == 0 && Math.abs(changeXAmountDiff) == 0) {
      return;
    }

    const baseRowCount = getRowCountFromData(interactionCapturedData);
    const baseColumnCount = getColumnCountFromData(interactionCapturedData);
    const minimumCount = interactionLayer.getMinimumCount();

    if (buttonDirection) {
      switch (buttonDirection) {
        case ButtonDirection.TOP:
          if (changeYAmountDiff > 0) {
            this.extendInteractionGridBy(ButtonDirection.TOP, {
              x: 0,
              y: changeYAmountDiff,
            });
          } else {
            this.shortenInteractionGridBy(ButtonDirection.TOP, {
              x: 0,
              y: baseRowCount > minimumCount ? -changeYAmountDiff : 0,
            });
          }
          break;
        case ButtonDirection.BOTTOM:
          if (changeYAmountDiff < 0) {
            this.extendInteractionGridBy(ButtonDirection.BOTTOM, {
              x: 0,
              y: -changeYAmountDiff,
            });
          } else {
            this.shortenInteractionGridBy(ButtonDirection.BOTTOM, {
              x: 0,
              y: baseRowCount > minimumCount ? changeYAmountDiff : 0,
            });
          }
          break;
        case ButtonDirection.LEFT:
          if (changeXAmountDiff > 0) {
            this.extendInteractionGridBy(ButtonDirection.LEFT, {
              x: changeXAmountDiff,
              y: 0,
            });
          } else {
            this.shortenInteractionGridBy(ButtonDirection.LEFT, {
              x: baseColumnCount > minimumCount ? -changeXAmountDiff : 0,
              y: 0,
            });
          }
          break;
        case ButtonDirection.RIGHT:
          if (changeXAmountDiff < 0) {
            this.extendInteractionGridBy(ButtonDirection.RIGHT, {
              x: -changeXAmountDiff,
              y: 0,
            });
          } else {
            this.shortenInteractionGridBy(ButtonDirection.RIGHT, {
              x: baseColumnCount > minimumCount ? changeXAmountDiff : 0,
              y: 0,
            });
          }
          break;
        case ButtonDirection.TOPLEFT:
          if (changeXAmountDiff > 0 || changeYAmountDiff > 0) {
            this.extendInteractionGridBy(ButtonDirection.TOPLEFT, {
              x: changeXAmountDiff,
              y: changeYAmountDiff,
            });
          } else {
            this.shortenInteractionGridBy(ButtonDirection.TOPLEFT, {
              x: baseColumnCount > minimumCount ? -changeXAmountDiff : 0,
              y: baseRowCount > minimumCount ? -changeYAmountDiff : 0,
            });
          }
          break;
        case ButtonDirection.TOPRIGHT:
          if (changeXAmountDiff < 0 || changeYAmountDiff > 0) {
            this.extendInteractionGridBy(ButtonDirection.TOPRIGHT, {
              x: -changeXAmountDiff,
              y: changeYAmountDiff,
            });
          } else {
            this.shortenInteractionGridBy(ButtonDirection.TOPRIGHT, {
              x: baseColumnCount > minimumCount ? changeXAmountDiff : 0,
              y: baseRowCount > minimumCount ? -changeYAmountDiff : 0,
            });
          }
          break;
        case ButtonDirection.BOTTOMLEFT:
          if (changeXAmountDiff > 0 || changeYAmountDiff < 0) {
            this.extendInteractionGridBy(ButtonDirection.BOTTOMLEFT, {
              x: changeXAmountDiff,
              y: -changeYAmountDiff,
            });
          } else {
            this.shortenInteractionGridBy(ButtonDirection.BOTTOMLEFT, {
              x: baseColumnCount > minimumCount ? -changeXAmountDiff : 0,
              y: baseRowCount > minimumCount ? changeYAmountDiff : 0,
            });
          }
          break;
        case ButtonDirection.BOTTOMRIGHT:
          if (changeXAmountDiff < 0 || changeYAmountDiff < 0) {
            this.extendInteractionGridBy(ButtonDirection.BOTTOMRIGHT, {
              x: -changeXAmountDiff,
              y: -changeYAmountDiff,
            });
          } else {
            this.shortenInteractionGridBy(ButtonDirection.BOTTOMRIGHT, {
              x: baseColumnCount > minimumCount ? changeXAmountDiff : 0,
              y: baseRowCount > minimumCount ? changeYAmountDiff : 0,
            });
          }
          break;
      }
      this.extensionPoint.offsetXAmount = mouseOffsetChangeXAmount;
      this.extensionPoint.offsetYAmount = mouseOffsetChangeYAmount;
      this.interactionLayer.setCriterionDataForRendering(
        this.interactionLayer.getCapturedData(),
      );
      this.renderAll();
    }
  };

  private extendInteractionGridBy(
    direction: ButtonDirection,
    amount: { x: number; y: number },
  ) {
    const extendAmount = { x: 0, y: 0 };
    const interactionLayer = this.interactionLayer;
    const interactionCapturedData = interactionLayer.getCapturedData();
    if (!interactionCapturedData) return;

    /* cut if amount is not effective */
    if (amount.x <= 0 && amount.y <= 0) return;

    for (const [key, value] of Object.entries(amount)) {
      for (let i = 0; i < value; i++) {
        if (
          (direction === ButtonDirection.TOPLEFT ||
            direction === ButtonDirection.TOPRIGHT) &&
          key === "y"
        ) {
          interactionLayer.extendCapturedData(ButtonDirection.TOP);
        } else if (
          (direction === ButtonDirection.BOTTOMLEFT ||
            direction === ButtonDirection.BOTTOMRIGHT) &&
          key === "y"
        ) {
          interactionLayer.extendCapturedData(ButtonDirection.BOTTOM);
        } else if (
          (direction === ButtonDirection.TOPLEFT ||
            direction === ButtonDirection.BOTTOMLEFT) &&
          key === "x"
        ) {
          interactionLayer.extendCapturedData(ButtonDirection.LEFT);
        } else if (
          (direction === ButtonDirection.TOPRIGHT ||
            direction === ButtonDirection.BOTTOMRIGHT) &&
          key === "x"
        ) {
          interactionLayer.extendCapturedData(ButtonDirection.RIGHT);
        } else {
          interactionLayer.extendCapturedData(direction);
        }

        if (key === "x") {
          extendAmount.x += 1;
        } else if (key === "y") {
          extendAmount.y += 1;
        }
      }
    }

    /* cut if amount is not effective */
    if (extendAmount.x <= 0 && extendAmount.y <= 0) return;

    const baseRowCount = getRowCountFromData(interactionCapturedData);
    const baseColumnCount = getColumnCountFromData(interactionCapturedData);

    const panZoomDiff = {
      x: (this.gridSquareLength / 2) * extendAmount.x * this.panZoom.scale,
      y: (this.gridSquareLength / 2) * extendAmount.y * this.panZoom.scale,
    };
    if (direction === ButtonDirection.TOP) {
      this.setPanZoom({
        offset: {
          x: this.panZoom.offset.x,
          y: this.panZoom.offset.y - panZoomDiff.y,
        },
        baseRowCount,
        baseColumnCount,
      });
    } else if (direction === ButtonDirection.BOTTOM) {
      this.setPanZoom({
        offset: {
          x: this.panZoom.offset.x,
          y: this.panZoom.offset.y + panZoomDiff.y,
        },
        baseRowCount,
        baseColumnCount,
      });
    } else if (direction === ButtonDirection.LEFT) {
      this.setPanZoom({
        offset: {
          x: this.panZoom.offset.x - panZoomDiff.x,
          y: this.panZoom.offset.y,
        },
        baseRowCount,
        baseColumnCount,
      });
    } else if (direction === ButtonDirection.RIGHT) {
      this.setPanZoom({
        offset: {
          x: this.panZoom.offset.x + panZoomDiff.x,
          y: this.panZoom.offset.y,
        },
        baseRowCount,
        baseColumnCount,
      });
    } else if (direction === ButtonDirection.TOPLEFT) {
      this.setPanZoom({
        offset: {
          x: this.panZoom.offset.x - panZoomDiff.x,
          y: this.panZoom.offset.y - panZoomDiff.y,
        },
        baseRowCount,
        baseColumnCount,
      });
    } else if (direction === ButtonDirection.TOPRIGHT) {
      this.setPanZoom({
        offset: {
          x: this.panZoom.offset.x + panZoomDiff.x,
          y: this.panZoom.offset.y - panZoomDiff.y,
        },
        baseRowCount,
        baseColumnCount,
      });
    } else if (direction === ButtonDirection.BOTTOMLEFT) {
      this.setPanZoom({
        offset: {
          x: this.panZoom.offset.x - panZoomDiff.x,
          y: this.panZoom.offset.y + panZoomDiff.y,
        },
        baseRowCount,
        baseColumnCount,
      });
    } else if (direction === ButtonDirection.BOTTOMRIGHT) {
      this.setPanZoom({
        offset: {
          x: this.panZoom.offset.x + panZoomDiff.x,
          y: this.panZoom.offset.y + panZoomDiff.y,
        },
        baseRowCount,
        baseColumnCount,
      });
    }
  }

  private shortenInteractionGridBy(
    direction: ButtonDirection,
    amount: { x: number; y: number },
  ) {
    const interactionLayer = this.interactionLayer;
    const shortenAmount = { x: 0, y: 0 };

    if (amount.x <= 0 && amount.y <= 0) return;

    for (const [key, value] of Object.entries(amount)) {
      for (let i = 0; i < value; i++) {
        if (
          (direction === ButtonDirection.TOPLEFT ||
            direction === ButtonDirection.TOPRIGHT) &&
          key === "y"
        ) {
          interactionLayer.shortenCapturedData(ButtonDirection.TOP);
        } else if (
          (direction === ButtonDirection.BOTTOMLEFT ||
            direction === ButtonDirection.BOTTOMRIGHT) &&
          key === "y"
        ) {
          interactionLayer.shortenCapturedData(ButtonDirection.BOTTOM);
        } else if (
          (direction === ButtonDirection.TOPLEFT ||
            direction === ButtonDirection.BOTTOMLEFT) &&
          key === "x"
        ) {
          interactionLayer.shortenCapturedData(ButtonDirection.LEFT);
        } else if (
          (direction === ButtonDirection.TOPRIGHT ||
            direction === ButtonDirection.BOTTOMRIGHT) &&
          key === "x"
        ) {
          interactionLayer.shortenCapturedData(ButtonDirection.RIGHT);
        } else {
          interactionLayer.shortenCapturedData(direction);
        }

        if (key === "x") {
          shortenAmount.x += 1;
        } else if (key === "y") {
          shortenAmount.y += 1;
        }
      }
    }

    // we do not need to shorten the grid when shortenAmount is 0
    if (shortenAmount.x <= 0 && shortenAmount.y <= 0) return;

    const interactionCapturedData = interactionLayer.getCapturedData()!;
    const baseRowCount = getRowCountFromData(interactionCapturedData);
    const baseColumnCount = getColumnCountFromData(interactionCapturedData);

    const panZoomDiff = {
      x: (this.gridSquareLength / 2) * shortenAmount.x * this.panZoom.scale,
      y: (this.gridSquareLength / 2) * shortenAmount.y * this.panZoom.scale,
    };
    if (direction === ButtonDirection.TOP) {
      this.setPanZoom({
        offset: {
          x: this.panZoom.offset.x,
          y: this.panZoom.offset.y + panZoomDiff.y,
        },
        baseColumnCount,
        baseRowCount,
      });
    } else if (direction === ButtonDirection.BOTTOM) {
      this.setPanZoom({
        offset: {
          x: this.panZoom.offset.x,
          y: this.panZoom.offset.y - panZoomDiff.y,
        },
        baseColumnCount,
        baseRowCount,
      });
    } else if (direction === ButtonDirection.LEFT) {
      this.setPanZoom({
        offset: {
          x: this.panZoom.offset.x + panZoomDiff.x,
          y: this.panZoom.offset.y,
        },
        baseColumnCount,
        baseRowCount,
      });
    } else if (direction === ButtonDirection.RIGHT) {
      this.setPanZoom({
        offset: {
          x: this.panZoom.offset.x - panZoomDiff.x,
          y: this.panZoom.offset.y,
        },
        baseColumnCount,
        baseRowCount,
      });
    } else if (direction === ButtonDirection.TOPLEFT) {
      this.setPanZoom({
        offset: {
          x: this.panZoom.offset.x + panZoomDiff.x,
          y: this.panZoom.offset.y + panZoomDiff.y,
        },
        baseRowCount,
        baseColumnCount,
      });
    } else if (direction === ButtonDirection.TOPRIGHT) {
      this.setPanZoom({
        offset: {
          x: this.panZoom.offset.x - panZoomDiff.x,
          y: this.panZoom.offset.y + panZoomDiff.y,
        },
        baseRowCount,
        baseColumnCount,
      });
    } else if (direction === ButtonDirection.BOTTOMLEFT) {
      this.setPanZoom({
        offset: {
          x: this.panZoom.offset.x + panZoomDiff.x,
          y: this.panZoom.offset.y - panZoomDiff.y,
        },
        baseRowCount,
        baseColumnCount,
      });
    } else if (direction === ButtonDirection.BOTTOMRIGHT) {
      this.setPanZoom({
        offset: {
          x: this.panZoom.offset.x - panZoomDiff.x,
          y: this.panZoom.offset.y - panZoomDiff.y,
        },
        baseRowCount,
        baseColumnCount,
      });
    }
  }

  handlePinchZoom(evt: TouchyEvent) {
    if (!this.isPanZoomable) {
      return;
    }
    const newPanZoom = calculateNewPanZoomFromPinchZoom(
      evt,
      this.element,
      this.panZoom,
      this.zoomSensitivity,
      this.pinchZoomDiff,
      this.minScale,
      this.maxScale,
    );
    if (newPanZoom) {
      this.pinchZoomDiff = newPanZoom.pinchZoomDiff;
      this.setPanZoom(newPanZoom.panZoom);
    }
  }

  handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (!this.isPanZoomable || this.mouseMode === MouseMode.EXTENDING) {
      return;
    }
    if (e.ctrlKey) {
      const zoom = 1 - e.deltaY / this.zoomSensitivity;
      let newScale = this.panZoom.scale * zoom;

      if (newScale > this.maxScale) {
        newScale = this.maxScale;
      }
      if (newScale < this.minScale) {
        newScale = this.minScale;
      }
      const mouseOffset = { x: e.offsetX, y: e.offsetY };
      const newOffset = returnScrollOffsetFromMouseOffset(
        mouseOffset,
        this.panZoom,
        newScale,
      );

      this.setPanZoom({ scale: newScale, offset: newOffset });
    } else {
      const offset = diffPoints(this.panZoom.offset, {
        x: e.deltaX,
        y: e.deltaY,
      });
      this.setPanZoom({ ...this.panZoom, offset });
    }
  };

  handlePanning = (evt: TouchyEvent) => {
    if (!this.isPanZoomable) {
      return;
    }
    const lastMousePos = this.panPoint.lastMousePos;
    if (window.TouchEvent && evt instanceof TouchEvent) {
      if (evt.touches.length > 1) {
        return;
      }
    }
    const point = getPointFromTouchyEvent(evt, this.element, this.panZoom);
    const currentMousePos: Coord = { x: point.offsetX, y: point.offsetY };
    this.panPoint.lastMousePos = currentMousePos;
    const mouseDiff = diffPoints(lastMousePos, currentMousePos);
    const offset = diffPoints(this.panZoom.offset, mouseDiff);
    this.setPanZoom({ offset });
    return;
  };

  // this will be only used by the current device user
  private drawPixelInInteractionLayer(rowIndex: number, columnIndex: number) {
    const interactionLayer = this.interactionLayer;
    const data = this.dataLayer.getData();
    if (this.brushTool === BrushTool.ERASER) {
      const previousColor = data.get(rowIndex)?.get(columnIndex).color;
      interactionLayer.addToErasedPixelRecords(CurrentDeviceUserId, {
        rowIndex,
        columnIndex,
        color: "",
        previousColor,
      });
    } else if (this.brushTool === BrushTool.DOT) {
      const previousColor = data.get(rowIndex)?.get(columnIndex).color;
      interactionLayer.addToStrokePixelRecords(CurrentDeviceUserId, {
        rowIndex,
        columnIndex,
        color: this.brushColor,
        previousColor,
      });
    } else if (this.brushTool === BrushTool.PAINT_BUCKET) {
      const gridIndices = getGridIndicesFromData(data);
      const initialSelectedColor = data.get(rowIndex)?.get(columnIndex)?.color;
      if (initialSelectedColor === this.brushColor) {
        return;
      }
      this.paintSameColorRegion(initialSelectedColor, gridIndices, {
        rowIndex,
        columnIndex,
      });
    }
    this.renderInteractionLayer();
  }

  private relayDataDimensionsToLayers() {
    const columnCount = getColumnCountFromData(this.dataLayer.getData());
    this.gridLayer.setColumnCount(columnCount);
    this.interactionLayer.setDataLayerColumnCount(columnCount);
    const rowCount = getRowCountFromData(this.dataLayer.getData());
    this.gridLayer.setRowCount(rowCount);
    this.interactionLayer.setDataLayerRowCount(rowCount);
  }

  // adding to undo stack is handled here(only for single player mode)
  // 1. colorChangeAction
  // 2. sizeChangeAction
  private relayInteractionDataToDataLayer() {
    const interactionLayer = this.interactionLayer;
    // if isInteractionApplication is false, the below logic should be done by the user
    if (this.isInteractionApplicable) {
      const strokedPixelModifyItems =
        interactionLayer.getEffectiveStrokePixelChanges(CurrentDeviceUserId);

      const erasedPixelModifyItems =
        interactionLayer.getEffectiveEraserPixelChanges(CurrentDeviceUserId);
      const pixelModifyItems = [
        ...strokedPixelModifyItems,
        ...erasedPixelModifyItems,
      ];
      if (pixelModifyItems.length !== 0) {
        this.dataLayer.colorPixels(pixelModifyItems);
        // record single player mode color change action
        this.recordInteractionColorChangeAction(pixelModifyItems);
      }
      if (pixelModifyItems.length !== 0) {
        this.emitStrokeEndEvent({
          strokedPixels: pixelModifyItems,
          data: this.dataLayer.getCopiedData(),
          strokeTool: this.brushTool,
        });
      }

      const capturedData = interactionLayer.getCapturedData();
      // if there is capturedData, it means that the user has changed the dimension
      if (capturedData) {
        const interactionGridIndices = getGridIndicesFromData(capturedData);
        const dataGridIndices =
          this.interactionLayer.getCapturedDataOriginalIndices()!;
        const topRowDiff =
          interactionGridIndices.topRowIndex - dataGridIndices.topRowIndex;
        const leftColumnDiff =
          interactionGridIndices.leftColumnIndex -
          dataGridIndices.leftColumnIndex;
        const bottomRowDiff =
          interactionGridIndices.bottomRowIndex -
          dataGridIndices.bottomRowIndex;
        const rightColumnDiff =
          interactionGridIndices.rightColumnIndex -
          dataGridIndices.rightColumnIndex;
        // const swipedPixels = interactionLayer.getSwipedPixels();
        // let deletedPixels = [];
        let amount = 0;
        let direction: ButtonDirection | null = null;
        let startIndex = 0;
        let isExtendingAction = true;
        if (topRowDiff < 0) {
          amount = -topRowDiff;
          this.dataLayer.extendGridBy(
            ButtonDirection.TOP,
            amount,
            dataGridIndices.topRowIndex,
          );
          direction = ButtonDirection.TOP;
          startIndex = dataGridIndices.topRowIndex;
          isExtendingAction = true;
        } else if (topRowDiff > 0) {
          amount = topRowDiff;
          this.dataLayer.shortenGridBy(
            ButtonDirection.TOP,
            amount,
            dataGridIndices.topRowIndex,
          );
          direction = ButtonDirection.TOP;
          startIndex = dataGridIndices.topRowIndex;
          isExtendingAction = false;
        }
        if (leftColumnDiff < 0) {
          amount = -leftColumnDiff;
          this.dataLayer.extendGridBy(
            ButtonDirection.LEFT,
            amount,
            dataGridIndices.leftColumnIndex,
          );
          direction = ButtonDirection.LEFT;
          startIndex = dataGridIndices.leftColumnIndex;
          isExtendingAction = true;
        } else if (leftColumnDiff > 0) {
          amount = leftColumnDiff;
          this.dataLayer.shortenGridBy(
            ButtonDirection.LEFT,
            amount,
            dataGridIndices.leftColumnIndex,
          );
          direction = ButtonDirection.LEFT;
          startIndex = dataGridIndices.leftColumnIndex;
          isExtendingAction = false;
        }
        if (bottomRowDiff > 0) {
          amount = bottomRowDiff;
          this.dataLayer.extendGridBy(
            ButtonDirection.BOTTOM,
            amount,
            dataGridIndices.bottomRowIndex,
          );
          direction = ButtonDirection.BOTTOM;
          startIndex = dataGridIndices.bottomRowIndex;
          isExtendingAction = true;
        } else if (bottomRowDiff < 0) {
          amount = -bottomRowDiff;
          this.dataLayer.shortenGridBy(
            ButtonDirection.BOTTOM,
            amount,
            dataGridIndices.bottomRowIndex,
          );
          direction = ButtonDirection.BOTTOM;
          startIndex = dataGridIndices.bottomRowIndex;
          isExtendingAction = false;
        }
        if (rightColumnDiff > 0) {
          amount = rightColumnDiff;
          this.dataLayer.extendGridBy(
            ButtonDirection.RIGHT,
            amount,
            dataGridIndices.rightColumnIndex,
          );
          direction = ButtonDirection.RIGHT;
          startIndex = dataGridIndices.rightColumnIndex;
          isExtendingAction = true;
        } else if (rightColumnDiff < 0) {
          amount = -rightColumnDiff;
          this.dataLayer.shortenGridBy(
            ButtonDirection.RIGHT,
            amount,
            dataGridIndices.rightColumnIndex,
          );
          direction = ButtonDirection.RIGHT;
          startIndex = dataGridIndices.rightColumnIndex;
          isExtendingAction = false;
        }

        if (direction) {
          this.recordInteractionSizeChangeAction(
            direction,
            this.dataLayer.getSwipedPixels(),
            isExtendingAction ? amount : -amount,
            startIndex,
          );
          this.dataLayer.resetSwipedPixels();
        }
      }
      // this will handle all data change actions done by the current device user
      // no need to record the action of the current device user in any other places
      const updatedData = this.dataLayer.getCopiedData();
      this.emitDataChangeEvent({ data: updatedData });
      const updatedColumnCount = getColumnCountFromData(updatedData);
      const updatedRowCount = getRowCountFromData(updatedData);
      const updatedDimensions = {
        rowCount: updatedRowCount,
        columnCount: updatedColumnCount,
      };
      const updatedGridIndices = getGridIndicesFromData(updatedData);
      this.emitGridChangeEvent({
        dimensions: updatedDimensions,
        indices: updatedGridIndices,
      });

      this.relayDataDimensionsToLayers();
      // deletes the records of the current user
      interactionLayer.deleteErasedPixelRecord(CurrentDeviceUserId);
      interactionLayer.deleteStrokePixelRecord(CurrentDeviceUserId);
      this.dataLayer.setCriterionDataForRendering(this.dataLayer.getData());
      this.interactionLayer.setCriterionDataForRendering(
        this.dataLayer.getData(),
      );
    }
    interactionLayer.resetCapturedData();
    this.renderAll();
  }

  // this will only record one action
  recordInteractionSizeChangeAction(
    direction: ButtonDirection,
    deletedPixels: Array<PixelModifyItem>,
    amount: number,
    startIndex: number,
  ) {
    this.recordAction(
      new SizeChangeAction(deletedPixels, [
        {
          direction,
          amount,
          startIndex,
        },
      ]),
    );
  }

  recordInteractionColorChangeAction(pixelModifyItems: Array<ColorChangeItem>) {
    this.recordAction(new ColorChangeAction(pixelModifyItems));
  }

  commitAction(action: Action) {
    const type = action.getType();
    if (type !== ActionType.SelectAreaMove) {
      // we will disable the select area move tool after the action is committed
      this.interactionLayer.setSelectedArea(null);
      this.setBrushTool(BrushTool.DOT);
    }
    switch (type) {
      case ActionType.ColorChange:
        const colorChangeAction = action as ColorChangeAction;
        this.dataLayer.updatePixelColors(colorChangeAction.data);
        break;

      case ActionType.SizeChange:
        const sizeChangeAction = action as SizeChangeAction;
        for (let i = 0; i < sizeChangeAction.changeAmounts.length; i++) {
          const change = sizeChangeAction.changeAmounts[i];
          const isExtendAction = change.amount > 0;
          if (isExtendAction) {
            this.dataLayer.extendGridBy(
              change.direction,
              change.amount,
              change.startIndex,
            );
          } else {
            this.dataLayer.shortenGridBy(
              change.direction,
              -change.amount,
              change.startIndex,
            );
          }
          const sizeChangePixels = sizeChangeAction.data;
          this.dataLayer.updatePixelColors(sizeChangePixels);
        }
        break;

      case ActionType.ColorSizeChange:
        const colorSizeChangeAction = action as ColorSizeChangeAction;
        for (let i = 0; i < colorSizeChangeAction.changeAmounts.length; i++) {
          const change = colorSizeChangeAction.changeAmounts[i];
          const isExtendAction = change.amount > 0;
          if (isExtendAction) {
            this.dataLayer.extendGridBy(
              change.direction,
              change.amount,
              change.startIndex,
            );
          } else {
            this.dataLayer.shortenGridBy(
              change.direction,
              change.amount,
              change.startIndex,
            );
          }
        }
        // we do not need to care for colorchangemode.Erase since the grids are already deleted
        const colorSizeChangePixels = colorSizeChangeAction.data;
        this.dataLayer.updatePixelColors(colorSizeChangePixels);
        break;

      case ActionType.SelectAreaMove:
        const selectAreamoveAction = action as SelectAreaMoveAction;
        this.dataLayer.updatePixelColors(selectAreamoveAction.data);
        this.brushTool = BrushTool.SELECT;
        this.interactionLayer.setSelectedArea(
          selectAreamoveAction.newSelectedArea,
        );
        break;
    }
  }

  recordAction(action: Action) {
    if (this.undoHistory.length >= this.maxHistoryCount) {
      this.undoHistory.shift();
    }
    this.undoHistory.push(action);
    this.redoHistory = [];
  }

  undo() {
    if (this.undoHistory.length === 0) {
      return;
    }
    const action = this.undoHistory.pop()!;
    const inverseAction = action.createInverseAction();
    this.commitAction(inverseAction);

    this.redoHistory.push(action);
    const rowCount = getRowCountFromData(this.dataLayer.getData());
    const columnCount = getColumnCountFromData(this.dataLayer.getData());
    this.gridLayer.setRowCount(rowCount);
    this.gridLayer.setColumnCount(columnCount);
    this.interactionLayer.setDataLayerRowCount(rowCount);
    this.interactionLayer.setDataLayerColumnCount(columnCount);
    this.dataLayer.setCriterionDataForRendering(this.dataLayer.getData());
    this.interactionLayer.setCriterionDataForRendering(
      this.dataLayer.getData(),
    );
    this.renderAll();
  }

  redo() {
    if (this.redoHistory.length === 0) {
      return;
    }
    const action = this.redoHistory.pop()!;
    this.commitAction(action);
    this.undoHistory.push(action);
    const rowCount = getRowCountFromData(this.dataLayer.getData());
    const columnCount = getColumnCountFromData(this.dataLayer.getData());
    this.gridLayer.setRowCount(rowCount);
    this.gridLayer.setColumnCount(columnCount);
    this.interactionLayer.setDataLayerRowCount(rowCount);
    this.interactionLayer.setDataLayerColumnCount(columnCount);
    this.dataLayer.setCriterionDataForRendering(this.dataLayer.getData());
    this.interactionLayer.setCriterionDataForRendering(
      this.dataLayer.getData(),
    );
    this.renderAll();
  }

  erasePixels(data: Array<{ rowIndex: number; columnIndex: number }>) {
    const { dataForAction } = this.dataLayer.erasePixels(data);
    if (this.interactionLayer.getCapturedData() !== null) {
      this.interactionLayer.erasePixels(data);
    }
    // we don't need to relay data dimensions to layers because there will be no
    // row column change in erasePixels
    this.recordAction(new ColorChangeAction(dataForAction));
    this.emitDataChangeEvent({ data: this.dataLayer.getCopiedData() });
    this.renderAll();
  }

  // this only applies for multiplayer mode or user direct function call
  colorPixels(data: Array<PixelModifyItem>) {
    const { changeAmounts, dataForAction } = this.dataLayer.colorPixels(data);
    if (this.interactionLayer.getCapturedData() !== null) {
      //only color pixels in interaction layer if there is a captured data
      this.interactionLayer.colorPixels(data);
      this.interactionLayer.setCriterionDataForRendering(
        this.interactionLayer.getCapturedData(),
      );
    } else {
      this.interactionLayer.setCriterionDataForRendering(
        this.dataLayer.getData(),
      );
    }
    this.relayDataDimensionsToLayers();
    this.recordAction(new ColorSizeChangeAction(dataForAction, changeAmounts));
    this.emitDataChangeEvent({ data: this.dataLayer.getCopiedData() });
    this.dataLayer.setCriterionDataForRendering(this.dataLayer.getData());
    this.renderAll();
  }

  // this will be only used by the current device user
  private paintSameColorRegion(
    initialColor: string,
    gridIndices: Indices,
    currentIndices: { rowIndex: number; columnIndex: number },
  ): void {
    const interactionLayer = this.interactionLayer;
    const indicesQueue = new Queue<{
      rowIndex: number;
      columnIndex: number;
    }>();
    indicesQueue.enqueue(currentIndices);
    interactionLayer.setCapturedData(this.dataLayer.getCopiedData());
    const data = this.interactionLayer.getCapturedData()!;
    while (indicesQueue.size() > 0) {
      const { rowIndex, columnIndex } = indicesQueue.dequeue()!;
      if (!isValidIndicesRange(rowIndex, columnIndex, gridIndices)) {
        continue;
      }

      const currentPixel = data.get(rowIndex)?.get(columnIndex);
      if (!currentPixel || currentPixel?.color !== initialColor) {
        continue;
      }
      const color = this.brushColor;
      const previousColor = data.get(rowIndex)!.get(columnIndex)!.color;
      data.get(rowIndex).get(columnIndex)!.color = color;
      // paint same color region is recorded in stroked pixels
      interactionLayer.addToStrokePixelRecords(CurrentDeviceUserId, {
        rowIndex,
        columnIndex,
        color,
        previousColor,
      });
      [
        { rowIndex: rowIndex - 1, columnIndex },
        { rowIndex: rowIndex + 1, columnIndex },
        { rowIndex, columnIndex: columnIndex - 1 },
        { rowIndex, columnIndex: columnIndex + 1 },
      ].forEach(({ rowIndex, columnIndex }) => {
        indicesQueue.enqueue({ rowIndex, columnIndex });
      });
    }
    interactionLayer.resetCapturedData();
  }

  onMouseDown(evt: TouchyEvent) {
    evt.preventDefault();
    const point = getPointFromTouchyEvent(evt, this.element, this.panZoom);
    this.panPoint.lastMousePos = { x: point.offsetX, y: point.offsetY };
    this.interactionLayer.setHoveredPixel(null);
    const mouseCartCoord = getMouseCartCoord(
      evt,
      this.element,
      this.panZoom,
      this.dpr,
    );
    this.mouseDownWorldPos = {
      x: mouseCartCoord.x,
      y: mouseCartCoord.y,
    };
    this.mouseDownPanZoom = {
      offset: {
        x: this.panZoom.offset.x,
        y: this.panZoom.offset.y,
      },
      scale: this.panZoom.scale,
    };
    const gridIndices = this.dataLayer.getGridIndices();
    const pixelIndex = getPixelIndexFromMouseCartCoord(
      mouseCartCoord,
      this.getRowCount(),
      this.getColumnCount(),
      this.gridSquareLength,
      gridIndices.topRowIndex,
      gridIndices.leftColumnIndex,
    );
    this.mouseMode = pixelIndex ? MouseMode.DRAWING : MouseMode.PANNING;

    if (this.brushTool === BrushTool.SELECT) {
      // brush tool select also means mouse is drawng
      // TODO: needs to modify the mousemode to be more specific
      this.mouseMode = MouseMode.DRAWING;
      const previousSelectedArea = this.interactionLayer.getSelectedArea();
      let isMouseCoordInSelectedArea = false;

      if (previousSelectedArea) {
        const directionToExtendSelectedArea =
          this.interactionLayer.detectSelectedAreaExtendDirection(
            this.mouseDownWorldPos,
          );
        this.interactionLayer.setDirectionToExtendSelectedArea(
          directionToExtendSelectedArea,
        );

        // there is a selected area in the interaction layer
        isMouseCoordInSelectedArea = getIsPointInsideRegion(
          this.mouseDownWorldPos,
          previousSelectedArea,
        );
        // if there is a direction to extend selected area, we don't need to do anything else
        if (directionToExtendSelectedArea !== null) {
          return;
        }
      }
      // we need to reset the selected area if the mouse is not in the previous selected area
      if (!isMouseCoordInSelectedArea) {
        this.interactionLayer.setSelectedArea(null);
        this.interactionLayer.setSelectingArea({
          startWorldPos: this.mouseDownWorldPos,
          endWorldPos: this.mouseDownWorldPos,
        });
      } else {
        // we will move the selected area if the mouse is in the previous selected area
        // remove the selecting area if it exists
        this.interactionLayer.setDirectionToExtendSelectedArea(null);
        this.interactionLayer.setSelectingArea(null);
        const data = this.dataLayer.getData();
        const rowCount = this.dataLayer.getRowCount();
        const columnCount = this.dataLayer.getColumnCount();
        const rowKeys = getRowKeysFromData(data);
        const columnKeys = getColumnKeysFromData(data);
        const sortedRowKeys = rowKeys.sort((a, b) => a - b);
        const sortedColumnKeys = columnKeys.sort((a, b) => a - b);
        const { includedPixelsIndices } = convertWorldPosAreaToPixelGridArea(
          previousSelectedArea,
          rowCount,
          columnCount,
          this.gridSquareLength,
          sortedRowKeys,
          sortedColumnKeys,
        );
        if (!includedPixelsIndices) {
          this.interactionLayer.setSelectedArea(null);
          return;
        }
        const selectedAreaPixels: Array<ColorChangeItem> = [];
        for (const index of includedPixelsIndices) {
          const rowIndex = index.rowIndex;
          const columnIndex = index.columnIndex;
          const color = data.get(rowIndex).get(columnIndex)?.color;
          if (color) {
            selectedAreaPixels.push({
              rowIndex,
              columnIndex,
              previousColor: color,
              color: "",
            });
          }
        }
        const {
          topRowIndex,
          bottomRowIndex,
          leftColumnIndex,
          rightColumnIndex,
        } = getGridIndicesFromData(data);
        // erase pixels from data layer first
        const filteredSelectedAreaPixels = selectedAreaPixels.filter(
          ({ rowIndex, columnIndex }) =>
            rowIndex >= topRowIndex &&
            rowIndex <= bottomRowIndex &&
            columnIndex >= leftColumnIndex &&
            columnIndex <= rightColumnIndex,
        );

        this.dataLayer.erasePixels(filteredSelectedAreaPixels);
        this.interactionLayer.setSelectedAreaPixels(selectedAreaPixels);
        this.interactionLayer.setMovingSelectedPixels(selectedAreaPixels);
        this.interactionLayer.setMovingSelectedArea(previousSelectedArea);
        this.dataLayer.render();
        this.interactionLayer.render();

        // move the pixels to interaction layer
      }
    } else {
      if (pixelIndex && this.brushTool !== BrushTool.NONE) {
        this.emitHoverPixelChangeEvent({
          indices: null,
        });
        this.drawPixelInInteractionLayer(
          pixelIndex.rowIndex,
          pixelIndex.columnIndex,
        );
        this.renderInteractionLayer();
        this.renderErasedPixelsFromInteractionLayerInDataLayer();
      }
      const isGridFixed = this.gridLayer.getIsGridFixed();
      if (!isGridFixed) {
        const buttonDirection = this.detectButtonClicked(mouseCartCoord);
        if (buttonDirection) {
          this.extensionPoint.direction = buttonDirection;
          this.mouseMode = MouseMode.EXTENDING;
          touchy(this.element, addEvent, "mousemove", this.handleExtension);
        }
      }
    }

    if (this.mouseMode === MouseMode.PANNING) {
      touchy(this.element, addEvent, "mousemove", this.handlePanning);
      touchy(this.element, addEvent, "mousemove", this.handlePinchZoom);
    }
  }

  onMouseMove(evt: TouchyEvent) {
    evt.preventDefault();
    const mouseCartCoord = getMouseCartCoord(
      evt,
      this.element,
      this.panZoom,
      this.dpr,
    );
    this.mouseMoveWorldPos = {
      x: mouseCartCoord.x,
      y: mouseCartCoord.y,
    };

    this.styleMouseCursor(mouseCartCoord);
    const gridIndices = this.dataLayer.getGridIndices();
    const pixelIndex = getPixelIndexFromMouseCartCoord(
      mouseCartCoord,
      this.getRowCount(),
      this.getColumnCount(),
      this.gridSquareLength,
      gridIndices.topRowIndex,
      gridIndices.leftColumnIndex,
    );
    const hoveredPixel = this.interactionLayer.getHoveredPixel();
    if (this.brushTool === BrushTool.SELECT) {
      const previousSelectingArea = this.interactionLayer.getSelectingArea();
      const previousSelectedArea = this.interactionLayer.getSelectedArea();
      const previousSelectedAreaPixels =
        this.interactionLayer.getSelectedAreaPixels();
      const movingSelectedPixels =
        this.interactionLayer.getMovingSelectedPixels();
      // mouseDownWorldPos may be null
      const directionToExtendSelectedArea =
        this.interactionLayer.getDirectionToExtendSelectedArea();
      if (directionToExtendSelectedArea !== null) {
        // if there is a direction to extend selected area, it means that there is a selected area
        this.interactionLayer.extendSelectedArea(
          directionToExtendSelectedArea,
          this.mouseMoveWorldPos,
        );
        this.gridLayer.render();
        this.gridLayer.renderSelection(this.interactionLayer.getSelectedArea());
      }
      if (
        movingSelectedPixels &&
        this.mouseDownWorldPos &&
        previousSelectedArea
      ) {
        const mouseMoveDistance = diffPoints(
          this.mouseDownWorldPos,
          this.mouseMoveWorldPos,
        );
        const pixelWiseDeltaX = Math.round(
          mouseMoveDistance.x / this.gridSquareLength,
        );
        const pixelWiseDeltaY = Math.round(
          mouseMoveDistance.y / this.gridSquareLength,
        );
        const newMovingSelectedPixels = previousSelectedAreaPixels.map(
          pixel => {
            return {
              ...pixel,
              rowIndex: pixel.rowIndex - pixelWiseDeltaY,
              columnIndex: pixel.columnIndex - pixelWiseDeltaX,
            };
          },
        );
        this.interactionLayer.setMovingSelectedArea({
          startWorldPos: {
            x:
              previousSelectedArea.startWorldPos.x -
              pixelWiseDeltaX * this.gridSquareLength,
            y:
              previousSelectedArea.startWorldPos.y -
              pixelWiseDeltaY * this.gridSquareLength,
          },
          endWorldPos: {
            x:
              previousSelectedArea.endWorldPos.x -
              pixelWiseDeltaX * this.gridSquareLength,
            y:
              previousSelectedArea.endWorldPos.y -
              pixelWiseDeltaY * this.gridSquareLength,
          },
        });
        this.interactionLayer.setMovingSelectedPixels(newMovingSelectedPixels);
        const selectedArea = this.interactionLayer.getMovingSelectedArea();
        this.gridLayer.render();
        this.gridLayer.renderSelection(selectedArea);
        this.interactionLayer.render();
        return;
      }
      if (previousSelectingArea !== null) {
        this.interactionLayer.setSelectingArea({
          startWorldPos: this.mouseDownWorldPos,
          endWorldPos: this.mouseMoveWorldPos,
        });
        const selectingArea = this.interactionLayer.getSelectingArea()!;
        this.renderGridLayer();
        this.gridLayer.renderSelection(selectingArea);
        return;
      }
    } else {
      if (pixelIndex) {
        if (this.mouseMode === MouseMode.DRAWING) {
          this.drawPixelInInteractionLayer(
            pixelIndex.rowIndex,
            pixelIndex.columnIndex,
          );

          const missingIndices = getInBetweenPixelIndicesfromCoords(
            this.previousMouseMoveWorldPos,
            this.mouseMoveWorldPos,
            this.gridSquareLength,
            this.dataLayer.getData(),
          );
          if (missingIndices?.length) {
            missingIndices.forEach(point => {
              this.drawPixelInInteractionLayer(
                point.rowIndex,
                point.columnIndex,
              );
            });
          }
          this.renderInteractionLayer();
          if (this.brushTool === BrushTool.ERASER) {
            this.renderErasedPixelsFromInteractionLayerInDataLayer();
          }
        } else {
          if (
            // We should also consider when the hovered pixel is null
            !hoveredPixel ||
            hoveredPixel.rowIndex !== pixelIndex.rowIndex ||
            hoveredPixel.columnIndex !== pixelIndex.columnIndex
          ) {
            this.emitHoverPixelChangeEvent({
              indices: pixelIndex,
            });
          }

          this.interactionLayer.setHoveredPixel({
            rowIndex: pixelIndex.rowIndex,
            columnIndex: pixelIndex.columnIndex,
            color:
              this.brushTool !== BrushTool.ERASER ? this.brushColor : "white",
          });
          this.renderInteractionLayer();
        }
      } else {
        if (hoveredPixel !== null) {
          this.emitHoverPixelChangeEvent({
            indices: null,
          });
          this.interactionLayer.setHoveredPixel(null);
          this.renderInteractionLayer();
        }
      }
      const buttonDirection = this.detectButtonClicked(mouseCartCoord);
      if (buttonDirection) {
        this.gridLayer.setHoveredButton(buttonDirection);
        this.renderGridLayer();
        return;
      } else {
        if (this.mouseMode !== MouseMode.EXTENDING) {
          this.gridLayer.setHoveredButton(null);
          this.renderGridLayer();
        }
      }
    }
    this.previousMouseMoveWorldPos = this.mouseMoveWorldPos;
  }

  relaySelectingAreaToSelectedArea() {
    const selectingArea = this.interactionLayer.getSelectingArea();
    if (selectingArea) {
      const data = this.dataLayer.getData();
      const rowCount = this.dataLayer.getRowCount();
      const columnCount = this.dataLayer.getColumnCount();
      const rowKeys = getRowKeysFromData(data);
      const columnKeys = getColumnKeysFromData(data);
      const sortedRowKeys = rowKeys.sort((a, b) => a - b);
      const sortedColumnKeys = columnKeys.sort((a, b) => a - b);
      const region = convertWorldPosAreaToPixelGridArea(
        selectingArea,
        rowCount,
        columnCount,
        this.gridSquareLength,
        sortedRowKeys,
        sortedColumnKeys,
      );
      if (region) {
        this.interactionLayer.setSelectedArea({
          startWorldPos: region.startWorldPos,
          endWorldPos: region.endWorldPos,
        });
        const pixelData = this.dataLayer.getData();
        const regionPixelItems: Array<ColorChangeItem> = [];
        for (const index of region.includedPixelsIndices) {
          const rowIndex = index.rowIndex;
          const columnIndex = index.columnIndex;
          const color = pixelData.get(rowIndex).get(columnIndex)?.color;
          if (color) {
            regionPixelItems.push({
              rowIndex,
              columnIndex,
              previousColor: color,
              color: "",
            });
          }
        }
        this.interactionLayer.setSelectedAreaPixels(regionPixelItems);
        this.gridLayer.renderSelection({
          startWorldPos: region.startWorldPos,
          endWorldPos: region.endWorldPos,
        });
      }
    }
    this.interactionLayer.setSelectingArea(null);
  }

  relayMovingSelectedAreaToSelectedArea() {
    // we must record the action

    const previousSelectedArea = this.interactionLayer.getSelectedArea();
    const previousSelectedAreaPixels =
      this.interactionLayer.getSelectedAreaPixels();
    const finalSelectedArea = this.interactionLayer.getMovingSelectedArea();
    const finalSelectedAreaPixels =
      this.interactionLayer.getMovingSelectedPixels();
    if (
      !previousSelectedArea ||
      !previousSelectedAreaPixels ||
      !finalSelectedArea ||
      !finalSelectedAreaPixels
    ) {
      return;
    }
    const data = this.dataLayer.getData();
    const { topRowIndex, bottomRowIndex, leftColumnIndex, rightColumnIndex } =
      getGridIndicesFromData(data);
    // we will not allow the selected area to expand the canvas
    const filteredFinalSelectedAreaPixels = finalSelectedAreaPixels
      .filter(
        item =>
          item.rowIndex <= bottomRowIndex &&
          item.columnIndex <= rightColumnIndex &&
          item.rowIndex >= topRowIndex &&
          item.columnIndex >= leftColumnIndex,
      )
      .map(filteredItem => ({
        ...filteredItem,
        color: filteredItem.previousColor,
        previousColor:
          data.get(filteredItem.rowIndex).get(filteredItem.columnIndex)
            ?.color || "",
      }));
    // ⬇️ this part is for recording the action
    const { dataForAction } = this.dataLayer.colorPixels(
      filteredFinalSelectedAreaPixels,
    );
    const newSelectedAreaColorChangeItems = dataForAction;
    const previousSelectedAreaColorChangeItems: Array<ColorChangeItem> =
      previousSelectedAreaPixels;
    this.recordAction(
      new SelectAreaMoveAction(
        [
          ...newSelectedAreaColorChangeItems,
          ...previousSelectedAreaColorChangeItems,
        ],
        previousSelectedArea,
        finalSelectedArea,
      ),
    );
    // we will use a map to remove the duplicated items
    const effectiveColorChangeItemsMap = new Map<string, ColorChangeItem>();
    // first we add the previous selected area items
    // this is because we will override the previous selected area items
    // with the new selected area items
    for (const item of previousSelectedAreaColorChangeItems) {
      effectiveColorChangeItemsMap.set(
        generatePixelId(item.rowIndex, item.columnIndex),
        item,
      );
    }
    // then override the previous selected area items with the new selected area items
    for (const item of newSelectedAreaColorChangeItems) {
      effectiveColorChangeItemsMap.set(
        generatePixelId(item.rowIndex, item.columnIndex),
        item,
      );
    }
    const effectiveColorChangeItems = Array.from(
      effectiveColorChangeItemsMap.values(),
    );
    const newData = this.dataLayer.getCopiedData();
    if (effectiveColorChangeItems.length > 0) {
      this.emitStrokeEndEvent({
        strokedPixels: effectiveColorChangeItems,
        data: newData,
        strokeTool: BrushTool.SELECT,
      });
      // only emit data change event when there is a change
      this.emitDataChangeEvent({ data: newData });
    }

    // ⬆️ this part is for recording the action

    const movingSelectedArea = this.interactionLayer.getMovingSelectedArea();
    if (movingSelectedArea) {
      this.interactionLayer.setSelectedArea(movingSelectedArea);
      const movingSelectedPixels =
        this.interactionLayer.getMovingSelectedPixels();
      this.interactionLayer.setSelectedAreaPixels(movingSelectedPixels);
    }
    this.interactionLayer.setMovingSelectedArea(null);
    this.interactionLayer.setMovingSelectedPixels(null);
    this.gridLayer.render();
    this.gridLayer.renderSelection(movingSelectedArea);
  }

  onMouseUp(evt: TouchyEvent) {
    evt.preventDefault();
    this.relayInteractionDataToDataLayer();
    this.mouseMode = MouseMode.PANNING;
    if (this.brushTool === BrushTool.SELECT) {
      this.relaySelectingAreaToSelectedArea();
      this.relayMovingSelectedAreaToSelectedArea();
      // get the updated selected area
      const selectedArea = this.interactionLayer.getSelectedArea();
      const doesSelectedAreaExistInGrid = getDoesAreaOverlapPixelgrid(
        selectedArea,
        this.dataLayer.getRowCount(),
        this.dataLayer.getColumnCount(),
        this.gridSquareLength,
      );
      if (!doesSelectedAreaExistInGrid) {
        this.interactionLayer.setMovingSelectedArea(null);
        this.interactionLayer.setMovingSelectedPixels(null);
        this.interactionLayer.setSelectedArea(null);
        this.interactionLayer.setSelectedAreaPixels(null);
        this.gridLayer.render();
      }
    }
    touchy(this.element, removeEvent, "mousemove", this.handlePanning);
    touchy(this.element, removeEvent, "mousemove", this.handlePinchZoom);
    touchy(this.element, removeEvent, "mousemove", this.handleExtension);
    this.pinchZoomDiff = undefined;
    this.gridLayer.setHoveredButton(null);
    this.interactionLayer.setDirectionToExtendSelectedArea(null);
    // we make mouse down world position null
    this.mouseDownWorldPos = null;
    this.mouseDownPanZoom = null;
    this.extensionPoint.offsetXAmount = 0;
    this.extensionPoint.offsetYAmount = 0;
    this.previousMouseMoveWorldPos = null;
    return;
  }

  onMouseOut(evt: TouchEvent) {
    evt.preventDefault();
    this.relayInteractionDataToDataLayer();

    this.interactionLayer.setSelectingArea(null);
    touchy(this.element, removeEvent, "mousemove", this.handlePanning);
    touchy(this.element, removeEvent, "mousemove", this.handlePinchZoom);
    touchy(this.element, removeEvent, "mousemove", this.handleExtension);
    if (this.gridLayer.getHoveredButton() !== null) {
      this.emitHoverPixelChangeEvent({
        indices: null,
      });
    }
    this.gridLayer.setHoveredButton(null);
    return;
  }

  removePanListeners() {
    touchy(this.element, removeEvent, "mousemove", this.handlePanning);
    touchy(this.element, removeEvent, "mousemove", this.handlePinchZoom);
  }

  renderGridLayer() {
    this.gridLayer.render();
  }

  clear() {
    const rowKeys = getRowKeysFromData(this.dataLayer.getData());
    const columnKeys = getColumnKeysFromData(this.dataLayer.getData());
    this.dataLayer.setData(new Map());
    const data = this.dataLayer.getData();
    for (const i of rowKeys) {
      data.set(i, new Map());
      for (const j of columnKeys) {
        data.get(i)!.set(j, { color: "" });
      }
    }
    this.renderDataLayer();
  }

  downloadImage(props?: ImageDownloadOptions) {
    const data = this.dataLayer.getData();
    const imageCanvas = document.createElement("canvas");
    const columnCount = this.getColumnCount();
    const rowCount = this.getRowCount();
    imageCanvas.width = columnCount * this.gridSquareLength;
    imageCanvas.height = rowCount * this.gridSquareLength;
    const imageContext = imageCanvas.getContext("2d")!;
    const allRowKeys = getRowKeysFromData(data);
    const allColumnKeys = getColumnKeysFromData(data);
    const rowKeyOrderMap = createRowKeyOrderMapfromData(data);
    const columnKeyOrderMap = createColumnKeyOrderMapfromData(data);
    for (const i of allRowKeys) {
      for (const j of allColumnKeys) {
        const rowIndex = i;
        const columnIndex = j;
        const relativeRowIndex = rowKeyOrderMap.get(rowIndex);
        const relativeColumnIndex = columnKeyOrderMap.get(columnIndex);
        const pixel = data.get(rowIndex)!.get(columnIndex);
        if (pixel && pixel.color) {
          const pixelCoord = {
            x: relativeColumnIndex * this.gridSquareLength,
            y: relativeRowIndex * this.gridSquareLength,
          };
          imageContext.save();
          imageContext.fillStyle = pixel.color;
          imageContext.fillRect(
            pixelCoord.x,
            pixelCoord.y,
            this.gridSquareLength,
            this.gridSquareLength,
          );
          imageContext.restore();
        }
      }
      imageContext.save();
      imageContext.strokeStyle = "#000000";
      imageContext.lineWidth = 1;
      if (props && props.isGridVisible) {
        for (let i = 0; i <= this.getColumnCount(); i++) {
          imageContext.beginPath();
          imageContext.moveTo(i * this.gridSquareLength, 0);
          imageContext.lineTo(
            i * this.gridSquareLength,
            rowCount * this.gridSquareLength,
          );
          imageContext.stroke();
          imageContext.closePath();
        }
        for (let j = 0; j <= this.getRowCount(); j++) {
          imageContext.beginPath();
          imageContext.moveTo(0, j * this.gridSquareLength);
          imageContext.lineTo(
            columnCount * this.gridSquareLength,
            j * this.gridSquareLength,
          );
          imageContext.stroke();
          imageContext.closePath();
        }
      }
      imageContext.restore();
    }
    const anchor = document.createElement("a");
    anchor.href = imageCanvas.toDataURL("image/png");
    anchor.download = "dotting.png";
    anchor.click();
  }

  renderAll() {
    this.renderBackgroundLayer();
    // if there is captured data in interaction layer we will not render data layer
    // captured data will not be null when user is extending the grid
    // when extending the grid, the original data layer will not be considered
    const capturedData = this.interactionLayer.getCapturedData();
    if (!capturedData) {
      this.renderDataLayer();
      this.renderErasedPixelsFromInteractionLayerInDataLayer();
    } else {
      // if captured data is not null, we will render grid layer based on captured data
      const rowCount = getRowCountFromData(capturedData);
      const columnCount = getColumnCountFromData(capturedData);
      this.gridLayer.setRowCount(rowCount);
      this.gridLayer.setColumnCount(columnCount);
    }
    this.renderInteractionLayer();

    this.renderGridLayer();
    const selectedArea = this.interactionLayer.getSelectedArea();
    if (selectedArea) {
      this.gridLayer.renderSelection(selectedArea);
    }
  }

  renderErasedPixelsFromInteractionLayerInDataLayer() {
    const erasedPixelsInInteractionLayer =
      this.interactionLayer.getAllErasedPixels();
    if (erasedPixelsInInteractionLayer.length > 0) {
      const ctx = this.dataLayer.getContext();
      const squareLength = this.gridSquareLength * this.panZoom.scale;
      // leftTopPoint is a cartesian coordinate
      const leftTopPoint: Coord = {
        x: -((this.dataLayer.getColumnCount() / 2) * this.gridSquareLength),
        y: -((this.dataLayer.getRowCount() / 2) * this.gridSquareLength),
      };
      const convertedLetTopScreenPoint = convertCartesianToScreen(
        this.element,
        leftTopPoint,
        this.dpr,
      );
      const correctedLeftTopScreenPoint = getScreenPoint(
        convertedLetTopScreenPoint,
        this.panZoom,
      );

      for (const pixel of erasedPixelsInInteractionLayer) {
        const { rowIndex, columnIndex } = pixel;
        const relativeRowIndex = this.dataLayer
          .getRowKeyOrderMap()
          .get(rowIndex);
        const relativeColumnIndex = this.dataLayer
          .getColumnKeyOrderMap()
          .get(columnIndex);
        if (
          relativeColumnIndex === undefined ||
          relativeRowIndex === undefined
        ) {
          continue;
        }
        const color = this.dataLayer
          .getData()
          .get(rowIndex)
          ?.get(columnIndex)?.color;
        if (!color) {
          continue;
        }
        ctx.clearRect(
          relativeColumnIndex * squareLength + correctedLeftTopScreenPoint.x,
          relativeRowIndex * squareLength + correctedLeftTopScreenPoint.y,
          squareLength,
          squareLength,
        );
      }
    }
  }

  renderDataLayer() {
    this.dataLayer.render();
  }

  renderInteractionLayer() {
    this.interactionLayer.render();

    // this.renderSwipedPixelsFromInteractionLayerInDataLayer();
  }

  renderBackgroundLayer() {
    this.backgroundLayer.render();
  }

  destroy() {
    touchy(this.element, removeEvent, "mouseup", this.onMouseUp);
    touchy(this.element, removeEvent, "mouseout", this.onMouseOut);
    touchy(this.element, removeEvent, "mousedown", this.onMouseDown);
    touchy(this.element, removeEvent, "mousemove", this.onMouseMove);
    touchy(this.element, removeEvent, "mousemove", this.handlePanning);
    touchy(this.element, removeEvent, "mousemove", this.handlePinchZoom);
    this.element.removeEventListener("wheel", this.handleWheel);
  }
}
