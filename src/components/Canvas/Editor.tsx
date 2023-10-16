import React, { KeyboardEvent } from "react";

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
  AddGridIndicesParams,
  BRUSH_PATTERN_ELEMENT,
  BrushTool,
  CanvasBrushChangeParams,
  CanvasDataChangeParams,
  CanvasEvents,
  CanvasGridChangeParams,
  CanvasHoverPixelChangeParams,
  CanvasInfoChangeParams,
  CanvasStrokeEndParams,
  ColorChangeItem,
  Coord,
  DeleteGridIndicesParams,
  Dimensions,
  GridIndices,
  ImageDownloadOptions,
  LayerChangeParams,
  LayerProps,
  PanZoom,
  PixelModifyItem,
  SelectAreaRange,
} from "./types";
import { Action, ActionType } from "../../actions/Action";
import { ColorChangeAction } from "../../actions/ColorChangeAction";
import { ColorSizeChangeAction } from "../../actions/ColorSizeChangeAction";
import {
  LayerCreateAction,
  LayerDeleteAction,
} from "../../actions/LayerCreateDeleteAction";
import { LayerReorderAction } from "../../actions/LayerReorderAction";
import { SelectAreaMoveAction } from "../../actions/SelectAreaMoveAction";
import {
  createColumnKeyOrderMapfromData,
  createRowKeyOrderMapfromData,
  getColumnCountFromData,
  getColumnKeysFromData,
  getGridIndicesFromData,
  getInBetweenPixelIndicesfromCoords,
  getRowCountFromData,
  getRowKeysFromData,
  validateLayers,
  validateSquareArray,
} from "../../utils/data";
import {
  InvalidDataDimensionsError,
  InvalidDataIndicesError,
  InvalidSquareDataError,
  LayerNotFoundError,
  NoDataToMakeSvgError,
  UnrecognizedDownloadOptionError,
  UnspecifiedLayerIdError,
} from "../../utils/error";
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
  getCenterCartCoordFromTwoTouches,
} from "../../utils/position";
import Queue from "../../utils/queue";
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
  private minScale: number = 1 / DefaultGridSquareLength;
  private staticMinScale: number | null = null;
  private staticMaxScale: number | null = null;
  private extensionAllowanceRatio = 2;
  private pinchZoomDiff: number | null = null;
  private width: number;
  private height: number;
  private originalLayerIdsInOrderForHistory = [];

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
  } = {
    direction: null,
  };
  private isPanZoomable = true;
  private isAltPressed = false;
  private mouseMode: MouseMode = MouseMode.NULL;
  private brushTool: BrushTool = BrushTool.DOT;

  private mouseDownWorldPos: Coord | null = null;
  private mouseDownPanZoom: PanZoom | null = null;
  private mouseMoveWorldPos: Coord = { x: 0, y: 0 };
  private previousMouseMoveWorldPos: Coord | null = null;
  // TODO: why do we need this? For games?
  private isDrawingEnabled = true;
  // We need isInteractionApplicable to allow multiplayer
  // We must let yorkie-js-sdk to apply change to data layer not the client
  private isInteractionApplicable = true;

  private element: HTMLCanvasElement;

  constructor({
    gridCanvas,
    interactionCanvas,
    dataCanvas,
    backgroundCanvas,
    initLayers,
    gridSquareLength,
  }: {
    gridCanvas: HTMLCanvasElement;
    interactionCanvas: HTMLCanvasElement;
    dataCanvas: HTMLCanvasElement;
    backgroundCanvas: HTMLCanvasElement;
    initLayers?: Array<LayerProps>;
    gridSquareLength?: number;
  }) {
    super();
    this.gridSquareLength = gridSquareLength || this.gridSquareLength;
    this.dataLayer = new DataLayer({
      canvas: dataCanvas,
      layers: initLayers,
    });
    this.originalLayerIdsInOrderForHistory = this.dataLayer
      .getLayers()
      .map(layer => layer.getId());
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
    this.setPanZoom({
      offset: {
        x: this.panZoom.scale * (-initColumnCount / 2) * this.gridSquareLength,
        y: this.panZoom.scale * (-initRowCount / 2) * this.gridSquareLength,
      },
    });
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
    this.emitDataChangeEvent({
      isLocalChange: false,
      data: this.dataLayer.getCopiedData(),
      layerId: this.dataLayer.getCurrentLayer().getId(),
    });
  }

  emitCurrentBrushTool() {
    this.emitBrushChangeEvent({
      brushColor: this.brushColor,
      brushTool: this.brushTool,
      brushPattern: this.interactionLayer.getBrushPattern(),
    });
  }

  emitCurrentLayerStatus() {
    this.emitLayerChangeEvent({
      layers: this.dataLayer.getLayers(),
      currentLayer: this.dataLayer.getCurrentLayer(),
    });
  }

  emitCurrentCanvasInfoStatus(baseColumnCount?: number, baseRowCount?: number) {
    const leftTopPoint: Coord = {
      x: 0,
      y: 0,
    };
    const convertedLeftTopScreenPoint = convertCartesianToScreen(
      this.element,
      leftTopPoint,
      this.dpr,
    );
    const correctedLeftTopScreenPoint = getScreenPoint(
      convertedLeftTopScreenPoint,
      this.panZoom,
    );
    const gridSquareSize = this.gridSquareLength * this.panZoom.scale;
    const columnCount = baseColumnCount
      ? baseColumnCount
      : this.dataLayer.getColumnCount();
    const rowCount = baseRowCount ? baseRowCount : this.dataLayer.getRowCount();
    this.emitCanvasInfoChangeEvent({
      panZoom: this.panZoom,
      topLeftCornerOffset: correctedLeftTopScreenPoint,
      topRightCornerOffset: {
        x: correctedLeftTopScreenPoint.x + columnCount * gridSquareSize,
        y: correctedLeftTopScreenPoint.y,
      },
      bottomLeftCornerOffset: {
        x: correctedLeftTopScreenPoint.x,
        y: correctedLeftTopScreenPoint.y + rowCount * gridSquareSize,
      },
      bottomRightCornerOffset: {
        x: correctedLeftTopScreenPoint.x + columnCount * gridSquareSize,
        y: correctedLeftTopScreenPoint.y + rowCount * gridSquareSize,
      },
      gridSquareSize,
    });
  }

  emitCanvasInfoChangeEvent(parmas: CanvasInfoChangeParams) {
    this.emit(CanvasEvents.CANVAS_INFO_CHANGE, parmas);
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

  emitLayerChangeEvent(params: LayerChangeParams) {
    this.emit(CanvasEvents.LAYER_CHANGE, params);
  }

  setBrushPattern(pattern: Array<Array<BRUSH_PATTERN_ELEMENT>>) {
    this.interactionLayer.setBrushPattern(pattern);
    this.emitBrushChangeEvent({
      brushColor: this.brushColor,
      brushTool: this.brushTool,
      brushPattern: this.interactionLayer.getBrushPattern(),
    });
  }

  // background related functions ⬇
  setBackgroundMode(backgroundMode?: "checkerboard" | "color") {
    this.backgroundLayer.setBackgroundMode(backgroundMode);
    this.renderBackgroundLayer();
  }

  setBackgroundColor(color: React.CSSProperties["color"]) {
    this.backgroundLayer.setBackgroundColor(color);
    this.interactionLayer.setBackgroundColor(color);
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

  setDefaultPixelColor(color: string) {
    if (color === undefined) {
      return;
    }
    this.dataLayer.setDefaultPixelColor(color);
    this.interactionLayer.setDefaultPixelColor(color);
    this.renderDataLayer();
  }

  setGridSquareLength(length: number) {
    if (length === 0 || length === undefined) {
      return;
    }
    this.gridSquareLength = length;
    this.gridLayer.setGridSquareLength(length);
    this.interactionLayer.setGridSquareLength(length);
    this.dataLayer.setGridSquareLength(length);
    this.adjustMinScaleByGridSquareLength(length);
    this.renderAll();
  }

  adjustMinScaleByGridSquareLength(gridSquareLength: number) {
    if (this.staticMinScale === null) {
      // we can freely dynamically adjust the min scale
      // we should let min scale be the minimum scale that can fit the canvas
      // the minimum grid square length can be 1px
      const newScale = 1 / this.gridSquareLength;
      this.minScale = newScale;
    }
  }

  /**
   * @description This function will set the static min scale of the canvas
   * @param minScale
   * @returns
   */
  setMinScale(minScale: number) {
    if (minScale === undefined) {
      return;
    }
    if (this.staticMaxScale !== null && minScale > this.staticMaxScale) {
      throw new Error("minScale cannot be greater than maxScale");
    }
    this.staticMinScale = minScale;
    this.minScale = minScale;
  }

  /**
   * @description This function will set the static max scale of the canvas
   * @param maxScale
   * @returns
   */
  setMaxScale(maxScale: number) {
    if (maxScale === undefined) {
      return;
    }
    if (this.staticMinScale !== null && maxScale < this.staticMinScale) {
      throw new Error("maxScale cannot be less than minScale");
    }
    this.staticMaxScale = maxScale;
    this.maxScale = maxScale;
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

  setIsDrawingEnabled(isDrawingEnabled: boolean) {
    if (isDrawingEnabled !== undefined) {
      this.isDrawingEnabled = isDrawingEnabled;
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
      brushPattern: this.interactionLayer.getBrushPattern(),
    });
  }

  setIsAltPressed(isAltPressed: boolean) {
    this.isAltPressed = isAltPressed;
  }

  changeBrushColor(color: string) {
    this.brushColor = color;
    this.emitBrushChangeEvent({
      brushColor: this.brushColor,
      brushTool: this.brushTool,
      brushPattern: this.interactionLayer.getBrushPattern(),
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

  getBrushColor() {
    return this.brushColor;
  }

  getBrushPattern() {
    return this.interactionLayer.getBrushPattern();
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

  getGridSquareLength() {
    return this.gridSquareLength;
  }

  getMinScale() {
    return this.minScale;
  }

  getMaxScale() {
    return this.maxScale;
  }

  styleMouseCursor = (mouseCoord: Coord) => {
    let hoveredButton: ButtonDirection = this.detectButtonClicked(mouseCoord);
    if (this.mouseMode === MouseMode.EXTENDING) {
      hoveredButton = this.extensionPoint.direction;
    }
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
          const selectedArea = this.interactionLayer.getSelectedArea();
          if (selectedArea) {
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
              const isMouseCoordInSelectedArea = getIsPointInsideRegion(
                mouseCoord,
                selectedArea,
              );
              if (isMouseCoordInSelectedArea) {
                this.element.style.cursor = `grab`;
              }
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

  getLayers() {
    return this.dataLayer.getLayers().map(layer => {
      return {
        id: layer.getId(),
        data: layer.getCopiedData(),
      };
    });
  }

  getLayersAsArray() {
    return this.dataLayer.getLayers().map(layer => {
      return {
        id: layer.getId(),
        data: layer.getDataArray(),
      };
    });
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

  setCurrentLayer(layerId: string) {
    const currentLayer = this.dataLayer.getLayer(layerId);
    if (!currentLayer) {
      throw new Error("Layer not found");
    }
    this.dataLayer.setCurrentLayer(layerId);
    this.emitCurrentLayerStatus();
  }

  addLayer(
    layerId: string,
    insertPosition: number,
    data?: Array<Array<PixelModifyItem>>,
    shouldRecordAction = false,
  ) {
    const createdLayer = this.dataLayer.createLayer(layerId, data);
    this.dataLayer.getLayers().splice(insertPosition, 0, createdLayer);
    if (shouldRecordAction) {
      this.recordAction(
        new LayerCreateAction(layerId, createdLayer, insertPosition),
      );
    }
    this.renderDataLayer();
    this.emitCurrentLayerStatus();
  }

  removeLayer(layerId: string, shouldRecordAction = false) {
    const layer = this.dataLayer.getLayer(layerId);
    if (!layer) {
      throw new Error("Layer not found");
    }
    if (this.dataLayer.getLayers().length === 1) {
      throw new Error("Cannot delete last layer");
    }
    const removeIndex = this.dataLayer.getLayerIndex(layerId);
    this.dataLayer.getLayers().splice(removeIndex, 1);
    if (shouldRecordAction) {
      this.recordAction(
        new LayerDeleteAction(layer.getId(), layer, removeIndex),
      );
    }
    this.renderDataLayer();
    this.emitCurrentLayerStatus();
  }

  showLayer(layerId: string) {
    this.dataLayer.showLayer(layerId);
    this.emitCurrentLayerStatus();
    this.renderDataLayer();
  }

  hideLayer(layerId: string) {
    this.dataLayer.hideLayer(layerId);
    this.emitCurrentLayerStatus();
    this.renderDataLayer();
  }

  /**
   * @description Isolates the layer, i.e. hides all other layers
   * @param layerId Layer Id to be isolated
   */
  isolateLayer(layerId: string) {
    this.dataLayer.isolateLayer(layerId);
    this.emitCurrentLayerStatus();
    this.renderDataLayer();
  }

  /**
   * @description Shows all layers
   */
  showAllLayers() {
    this.dataLayer.showAllLayers();
    this.emitCurrentLayerStatus();
    this.renderDataLayer();
  }

  /**
   * @description This moves the layer to the specified index,
   *              However, the moved information will not be saved in to history
   *              This is because moving a layer from one index to another can happen frequently
   *              If a user wants to record this action, use reorderlayerByIds instead
   * @param layerId layer id to be moved
   * @param toIndex index to be moved to
   */
  changeLayerPosition(layerId: string, toIndex: number) {
    const layer = this.dataLayer.getLayer(layerId);
    if (!layer) {
      throw new Error("Layer not found");
    }
    const fromIndex = this.dataLayer.getLayerIndex(layerId);
    this.dataLayer.getLayers().splice(fromIndex, 1);
    this.dataLayer.getLayers().splice(toIndex, 0, layer);
    this.emitCurrentLayerStatus();
    this.renderDataLayer();
  }

  reorderLayersByIds(layerIds: Array<string>) {
    this.dataLayer.reorderLayersByIds(layerIds);
    this.emitCurrentLayerStatus();
    this.recordAction(
      new LayerReorderAction(this.originalLayerIdsInOrderForHistory, layerIds),
    );
    // update the original layer ids for future recording
    this.originalLayerIdsInOrderForHistory = this.dataLayer
      .getLayers()
      .map(layer => layer.getId());
    this.renderDataLayer();
  }

  /**
   * @summary Sets the data of the pixel array (use with caution, since data will be overwritten!)
   *          This function will reset the undo and redo history since it is unnecessary to keep them when data is set externally
   * @param data Array of PixelModifyItem (It must be a rectangular array, i.e. all rows must have the same length)
   */
  setData(
    data: Array<Array<PixelModifyItem>>,
    layerId?: string,
    isLocalChange = false,
  ) {
    const { isDataValid, rowCount, columnCount } = validateSquareArray(data);
    if (!isDataValid) {
      throw new InvalidSquareDataError();
    }
    // reset history when set data is called
    this.undoHistory = [];
    this.redoHistory = [];
    const leftColumnIndex = data[0][0].columnIndex;
    const topRowIndex = data[0][0].rowIndex;

    // reset data
    const newData = new Map();
    for (let i = 0; i < data.length; i++) {
      newData.set(topRowIndex + i, new Map());
      for (let j = 0; j < data[i].length; j++) {
        newData
          .get(topRowIndex + i)
          .set(leftColumnIndex + j, { color: data[i][j].color });
      }
    }
    if (layerId === undefined) {
      if (this.dataLayer.getLayers().length > 1) {
        throw new UnspecifiedLayerIdError();
      }
      this.dataLayer.setData(newData);
    } else {
      const layer = this.dataLayer.getLayer(layerId);
      if (!layer) {
        throw new LayerNotFoundError(layerId);
      }
      const layerInfo = layer.getDataInfo();
      if (
        layerInfo.rowCount !== rowCount ||
        layerInfo.columnCount !== columnCount
      ) {
        throw new InvalidDataDimensionsError();
      }
      if (
        layerInfo.gridIndices.leftColumnIndex !== leftColumnIndex ||
        layerInfo.gridIndices.topRowIndex !== topRowIndex
      ) {
        throw new InvalidDataIndicesError();
      }
      this.dataLayer.setData(newData, layerId);
    }
    this.gridLayer.setCriterionDataForRendering(this.dataLayer.getData());
    this.gridLayer.setRowCount(rowCount);
    this.gridLayer.setColumnCount(columnCount);

    this.interactionLayer.setDataLayerRowCount(rowCount);
    this.interactionLayer.setDataLayerColumnCount(columnCount);
    this.emitDataChangeEvent({
      isLocalChange,
      data: this.dataLayer.getCopiedData(),
      layerId: this.dataLayer.getCurrentLayer().getId(),
    });
    this.emitGridChangeEvent({
      dimensions: this.dataLayer.getDimensions(),
      indices: this.dataLayer.getGridIndices(),
    });
    this.emitCurrentCanvasInfoStatus();
    this.interactionLayer.setCriterionDataForRendering(
      this.dataLayer.getData(),
    );
    this.dataLayer.setCriterionDataForRendering(this.dataLayer.getData());
    this.interactionLayer.resetCapturedData();

    this.setPanZoom({
      offset: {
        x: -this.panZoom.scale * (columnCount / 2) * this.gridSquareLength,
        y: -this.panZoom.scale * (rowCount / 2) * this.gridSquareLength,
      },
    });
    this.renderAll();
  }

  setLayers(layers: Array<LayerProps>) {
    validateLayers(layers);
    // if validate layers is passed, then we have no problem with layers
    this.dataLayer.setLayers(layers);
    this.originalLayerIdsInOrderForHistory = layers.map(layer => layer.id);
    // reset history when set layer is called
    this.undoHistory = [];
    this.redoHistory = [];
    this.dataLayer.setCurrentLayer(layers[0].id);
    this.gridLayer.setCriterionDataForRendering(this.dataLayer.getData());
    const rowCount = this.dataLayer.getRowCount();
    const columnCount = this.dataLayer.getColumnCount();
    this.gridLayer.setRowCount(rowCount);
    this.gridLayer.setColumnCount(columnCount);
    this.interactionLayer.setDataLayerRowCount(rowCount);
    this.interactionLayer.setDataLayerColumnCount(columnCount);
    this.emitDataChangeEvent({
      isLocalChange: false,
      data: this.dataLayer.getCopiedData(),
      layerId: this.dataLayer.getCurrentLayer().getId(),
    });
    this.emitGridChangeEvent({
      dimensions: this.dataLayer.getDimensions(),
      indices: this.dataLayer.getGridIndices(),
    });
    this.emitCurrentCanvasInfoStatus();
    this.interactionLayer.setCriterionDataForRendering(
      this.dataLayer.getData(),
    );
    this.dataLayer.setCriterionDataForRendering(this.dataLayer.getData());
    this.interactionLayer.resetCapturedData();
    this.setPanZoom({
      offset: {
        x: -this.panZoom.scale * (columnCount / 2) * this.gridSquareLength,
        y: -this.panZoom.scale * (rowCount / 2) * this.gridSquareLength,
      },
    });
    this.emitCurrentLayerStatus();
    this.renderAll();
  }

  setPanZoom({
    offset,
    scale,
    baseColumnCount,
    baseRowCount,
  }: Partial<PanZoom> & { baseColumnCount?: number; baseRowCount?: number }) {
    const columnCount = baseColumnCount
      ? baseColumnCount
      : this.dataLayer.getColumnCount();
    const rowCount = baseRowCount ? baseRowCount : this.dataLayer.getRowCount();
    if (scale) {
      this.panZoom.scale = scale;
    }
    if (offset) {
      const correctedOffset = { ...offset };
      // rowCount * this.gridSquareLength * this.panZoom.scale < this.height
      // Offset changes when grid is bigger than canvas
      const isGridRowsBiggerThanCanvas =
        rowCount * this.gridSquareLength * this.panZoom.scale > this.height;
      const isGridColumnsBiggerThanCanvas =
        columnCount * this.gridSquareLength * this.panZoom.scale > this.width;

      const minXPosition = isGridColumnsBiggerThanCanvas
        ? -(columnCount * this.gridSquareLength * this.panZoom.scale) -
          (this.width / 2) * this.panZoom.scale
        : (-this.width / 2) * this.panZoom.scale;

      const minYPosition = isGridRowsBiggerThanCanvas
        ? -rowCount * this.gridSquareLength * this.panZoom.scale -
          (this.height / 2) * this.panZoom.scale
        : (-this.height / 2) * this.panZoom.scale;

      const maxXPosition = isGridColumnsBiggerThanCanvas
        ? this.width - (this.width / 2) * this.panZoom.scale
        : this.width -
          columnCount * this.gridSquareLength * this.panZoom.scale -
          (this.width / 2) * this.panZoom.scale;
      const maxYPosition = isGridRowsBiggerThanCanvas
        ? this.height - (this.height / 2) * this.panZoom.scale
        : this.height -
          rowCount * this.gridSquareLength * this.panZoom.scale -
          (this.height / 2) * this.panZoom.scale;
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
    this.emitCurrentCanvasInfoStatus(baseColumnCount, baseRowCount);
  }

  relayPanZoomToOtherLayers() {
    this.dataLayer.setPanZoom(this.panZoom);
    this.gridLayer.setPanZoom(this.panZoom);
    this.interactionLayer.setPanZoom(this.panZoom);
  }

  handleExtension = (evt: TouchyEvent) => {
    evt.preventDefault();
    const interactionLayer = this.interactionLayer;
    let interactionCapturedData = interactionLayer.getCapturedData();
    if (!interactionCapturedData) {
      // we will copy the data to interaction layer
      interactionLayer.setCapturedData(this.dataLayer.getCopiedData());
      interactionCapturedData = interactionLayer.getCapturedData();
    }
    // data layer row count and column count differs from interaction layer row count and column count
    const dataLayerRowCount = this.dataLayer.getRowCount();
    const dataLayerColumnCount = this.dataLayer.getColumnCount();
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

    const updatedRowCount =
      buttonDirection === ButtonDirection.TOP ||
      buttonDirection === ButtonDirection.TOPLEFT ||
      buttonDirection === ButtonDirection.TOPRIGHT
        ? dataLayerRowCount + mouseOffsetChangeYAmount
        : dataLayerRowCount - mouseOffsetChangeYAmount;
    const updatedColumnCount =
      buttonDirection === ButtonDirection.TOPLEFT ||
      buttonDirection === ButtonDirection.BOTTOMLEFT ||
      buttonDirection === ButtonDirection.LEFT
        ? dataLayerColumnCount + mouseOffsetChangeXAmount
        : dataLayerColumnCount - mouseOffsetChangeXAmount;
    const interactionLayerRowCount = getRowCountFromData(
      interactionCapturedData,
    );
    const interactionLayerColumnCount = getColumnCountFromData(
      interactionCapturedData,
    );
    const minimumCount = interactionLayer.getMinimumCount();

    if (buttonDirection) {
      const isRowSizeModifiable = !(
        buttonDirection === ButtonDirection.LEFT ||
        buttonDirection === ButtonDirection.RIGHT
      );
      const isColumnSizeModifiable = !(
        buttonDirection === ButtonDirection.TOP ||
        buttonDirection === ButtonDirection.BOTTOM
      );
      if (isRowSizeModifiable) {
        if (updatedRowCount > interactionLayerRowCount) {
          this.extendInteractionGridBy(buttonDirection, {
            x: 0,
            y: updatedRowCount - interactionLayerRowCount,
          });
        } else {
          if (updatedRowCount >= minimumCount) {
            this.shortenInteractionGridBy(buttonDirection, {
              x: 0,
              y: interactionLayerRowCount - updatedRowCount,
            });
          } else {
            this.shortenInteractionGridBy(buttonDirection, {
              x: 0,
              y: interactionLayerRowCount - minimumCount,
            });
          }
        }
      }
      if (isColumnSizeModifiable) {
        if (updatedColumnCount > interactionLayerColumnCount) {
          this.extendInteractionGridBy(buttonDirection, {
            x: updatedColumnCount - interactionLayerColumnCount,
            y: 0,
          });
        } else {
          if (updatedColumnCount >= minimumCount) {
            this.shortenInteractionGridBy(buttonDirection, {
              x: interactionLayerColumnCount - updatedColumnCount,
              y: 0,
            });
          } else {
            this.shortenInteractionGridBy(buttonDirection, {
              x: interactionLayerColumnCount - minimumCount,
              y: 0,
            });
          }
        }
      }
      this.interactionLayer.setCriterionDataForRendering(
        this.interactionLayer.getCapturedData(),
      );
      this.renderAll();
    }
  };

  addGridIndices({
    rowIndices,
    columnIndices,
    data,
    layerId,
    isLocalChange = false,
  }: AddGridIndicesParams) {
    const { validColumnIndices, validRowIndices } =
      this.dataLayer.addGridIndices({
        rowIndicesToAdd: rowIndices,
        columnIndicesToAdd: columnIndices,
      });
    const modifiedLayerId = layerId
      ? layerId
      : this.dataLayer.getCurrentLayer().getId();
    const modifiedPixels =
      data && data.length > 0
        ? this.dataLayer.updatePixelColors(data, modifiedLayerId)
        : [];
    const addedOrDeletedRows = validRowIndices.map(rowIndex => {
      return {
        index: rowIndex,
        isDelete: false,
      };
    });
    const addedOrDeletedColumns = validColumnIndices.map(columnIndex => {
      return {
        index: columnIndex,
        isDelete: false,
      };
    });
    if (
      validColumnIndices.length === 0 &&
      validRowIndices.length === 0 &&
      modifiedPixels.length === 0
    ) {
      return;
    }

    this.recordSizeChangeAction(
      validRowIndices,
      validColumnIndices,
      [],
      [],
      modifiedPixels.map(pixel => ({
        ...pixel,
        color: pixel.previousColor,
        previousColor: pixel.color,
      })),
    );
    this.emitDataChangeEvent({
      isLocalChange,
      data: this.dataLayer.getCopiedData(),
      layerId: modifiedLayerId,
      delta: {
        modifiedPixels,
        addedOrDeletedRows,
        addedOrDeletedColumns,
      },
    });
    const updatedData = this.dataLayer.getCopiedData();
    const updatedColumnCount = getColumnCountFromData(updatedData);
    const updatedRowCount = getRowCountFromData(updatedData);
    const updatedDimensions = {
      rowCount: updatedRowCount,
      columnCount: updatedColumnCount,
    };
    const updatedGridIndices = getGridIndicesFromData(updatedData);
    if (addedOrDeletedColumns.length !== 0 || addedOrDeletedRows.length !== 0) {
      this.emitGridChangeEvent({
        dimensions: updatedDimensions,
        indices: updatedGridIndices,
      });
      this.emitCurrentCanvasInfoStatus();
    }
    this.relayDataDimensionsToLayers();
    this.dataLayer.setCriterionDataForRendering(this.dataLayer.getData());
    this.interactionLayer.resetCapturedData();
    this.interactionLayer.setCriterionDataForRendering(
      this.dataLayer.getData(),
    );
    this.renderAll();
  }

  deleteGridIndices({
    rowIndices,
    columnIndices,
    layerId,
    isLocalChange = false,
  }: DeleteGridIndicesParams) {
    const { validColumnIndices, validRowIndices, swipedPixels } =
      this.dataLayer.deleteGridIndices({
        rowIndicesToDelete: rowIndices,
        columnIndicesToDelete: columnIndices,
      });
    const modifiedLayerId = layerId
      ? layerId
      : this.dataLayer.getCurrentLayer().getId();
    const addedOrDeletedRows = validRowIndices.map(rowIndex => {
      return {
        index: rowIndex,
        isDelete: true,
      };
    });
    const addedOrDeletedColumns = validColumnIndices.map(columnIndex => {
      return {
        index: columnIndex,
        isDelete: true,
      };
    });
    if (
      validColumnIndices.length === 0 &&
      validRowIndices.length === 0 &&
      swipedPixels.length === 0
    ) {
      return;
    }

    this.recordSizeChangeAction(
      [],
      [],
      validRowIndices,
      validColumnIndices,
      swipedPixels,
    );
    this.emitDataChangeEvent({
      isLocalChange,
      data: this.dataLayer.getCopiedData(),
      layerId: modifiedLayerId,
      delta: {
        // there will be no modified pixels since rows and columns are deleted
        modifiedPixels: [],
        addedOrDeletedRows,
        addedOrDeletedColumns,
      },
    });
    const updatedData = this.dataLayer.getCopiedData();
    const updatedColumnCount = getColumnCountFromData(updatedData);
    const updatedRowCount = getRowCountFromData(updatedData);
    const updatedDimensions = {
      rowCount: updatedRowCount,
      columnCount: updatedColumnCount,
    };
    const updatedGridIndices = getGridIndicesFromData(updatedData);
    if (addedOrDeletedColumns.length !== 0 || addedOrDeletedRows.length !== 0) {
      this.emitGridChangeEvent({
        dimensions: updatedDimensions,
        indices: updatedGridIndices,
      });
      this.emitCurrentCanvasInfoStatus();
    }
    this.relayDataDimensionsToLayers();
    this.dataLayer.setCriterionDataForRendering(this.dataLayer.getData());
    this.interactionLayer.resetCapturedData();
    this.interactionLayer.setCriterionDataForRendering(
      this.dataLayer.getData(),
    );
    this.renderAll();
  }

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
      x: this.gridSquareLength * extendAmount.x * this.panZoom.scale,
      y: this.gridSquareLength * extendAmount.y * this.panZoom.scale,
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
          y: this.panZoom.offset.y,
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
          x: this.panZoom.offset.x,
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
          x: this.panZoom.offset.x,
          y: this.panZoom.offset.y - panZoomDiff.y,
        },
        baseRowCount,
        baseColumnCount,
      });
    } else if (direction === ButtonDirection.BOTTOMLEFT) {
      this.setPanZoom({
        offset: {
          x: this.panZoom.offset.x - panZoomDiff.x,
          y: this.panZoom.offset.y,
        },
        baseRowCount,
        baseColumnCount,
      });
    } else if (direction === ButtonDirection.BOTTOMRIGHT) {
      this.setPanZoom({
        offset: {
          x: this.panZoom.offset.x,
          y: this.panZoom.offset.y,
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
          y: this.panZoom.offset.y + panZoomDiff.y * 2,
        },
        baseColumnCount,
        baseRowCount,
      });
    } else if (direction === ButtonDirection.BOTTOM) {
      this.setPanZoom({
        offset: {
          x: this.panZoom.offset.x,
          y: this.panZoom.offset.y,
        },
        baseColumnCount,
        baseRowCount,
      });
    } else if (direction === ButtonDirection.LEFT) {
      this.setPanZoom({
        offset: {
          x: this.panZoom.offset.x + panZoomDiff.x * 2,
          y: this.panZoom.offset.y,
        },
        baseColumnCount,
        baseRowCount,
      });
    } else if (direction === ButtonDirection.RIGHT) {
      this.setPanZoom({
        offset: {
          x: this.panZoom.offset.x,
          y: this.panZoom.offset.y,
        },
        baseColumnCount,
        baseRowCount,
      });
    } else if (direction === ButtonDirection.TOPLEFT) {
      this.setPanZoom({
        offset: {
          x: this.panZoom.offset.x + panZoomDiff.x * 2,
          y: this.panZoom.offset.y + panZoomDiff.y * 2,
        },
        baseRowCount,
        baseColumnCount,
      });
    } else if (direction === ButtonDirection.TOPRIGHT) {
      this.setPanZoom({
        offset: {
          x: this.panZoom.offset.x,
          y: this.panZoom.offset.y + panZoomDiff.y * 2,
        },
        baseRowCount,
        baseColumnCount,
      });
    } else if (direction === ButtonDirection.BOTTOMLEFT) {
      this.setPanZoom({
        offset: {
          x: this.panZoom.offset.x + panZoomDiff.x * 2,
          y: this.panZoom.offset.y,
        },
        baseRowCount,
        baseColumnCount,
      });
    } else if (direction === ButtonDirection.BOTTOMRIGHT) {
      this.setPanZoom({
        offset: {
          x: this.panZoom.offset.x,
          y: this.panZoom.offset.y,
        },
        baseRowCount,
        baseColumnCount,
      });
    }
  }

  // we should allow panning with pinch zoom too
  handlePinchZoom = (evt: TouchyEvent) => {
    if (!this.isPanZoomable || this.interactionLayer.getCapturedData()) {
      return;
    }
    // TODO: allo panning when pinch zooming
    const currentPinchCenter = getCenterCartCoordFromTwoTouches(
      evt,
      this.element,
      this.panZoom,
      this.dpr,
    );
    if (!currentPinchCenter) {
      return;
    }
    this.panPoint.lastMousePos = currentPinchCenter;
    const newZoomInfo = calculateNewPanZoomFromPinchZoom(
      evt,
      this.element,
      this.panZoom,
      this.zoomSensitivity,
      this.pinchZoomDiff,
      this.minScale,
      this.maxScale,
    );
    if (newZoomInfo) {
      this.pinchZoomDiff = newZoomInfo.pinchZoomDiff;
      this.setPanZoom({
        scale: newZoomInfo.panZoom.scale,
        offset: newZoomInfo.panZoom.offset,
      });
    }
  };

  handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === "KeyZ" && (e.ctrlKey || e.metaKey)) {
      this.undo();
    }
    if (e.code === "KeyY" && (e.ctrlKey || e.metaKey)) {
      this.redo();
    }
  };

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
    const lastMousePos = { ...this.panPoint.lastMousePos };
    const point = getPointFromTouchyEvent(evt, this.element, this.panZoom);
    const currentMousePos: Coord = { x: point.offsetX, y: point.offsetY };
    this.panPoint.lastMousePos = currentMousePos;
    const mouseDiff = diffPoints(lastMousePos, currentMousePos);
    const offset = diffPoints(this.panZoom.offset, mouseDiff);
    this.setPanZoom({ offset });
    return;
  };

  // this will be only used by the current device user
  private drawPixelInInteractionLayer(
    rowIndex: number,
    columnIndex: number,
    brushPattern: Array<Array<BRUSH_PATTERN_ELEMENT>>,
  ) {
    const interactionLayer = this.interactionLayer;
    const data = this.dataLayer.getData();
    const brushPatternWidth = brushPattern.length;
    const brushPatternHeight = brushPattern[0].length;
    const brushPatternCenterRowIndex = Math.floor(brushPatternHeight / 2);
    const brushPatternCenterColumnIndex = Math.floor(brushPatternWidth / 2);
    if (this.brushTool === BrushTool.ERASER) {
      for (let i = 0; i < brushPattern.length; i++) {
        for (let j = 0; j < brushPattern[i].length; j++) {
          const brushPatternItem = brushPattern[i][j];
          if (brushPatternItem === 0) {
            continue;
          }
          const previousColor = data
            .get(rowIndex + i - brushPatternCenterRowIndex)
            ?.get(columnIndex + j - brushPatternCenterColumnIndex)?.color;
          interactionLayer.addToErasedPixelRecords(CurrentDeviceUserId, {
            rowIndex: rowIndex + i - brushPatternCenterRowIndex,
            columnIndex: columnIndex + j - brushPatternCenterColumnIndex,
            color: "",
            previousColor,
          });
        }
      }
    } else if (this.brushTool === BrushTool.DOT) {
      for (let i = 0; i < brushPattern.length; i++) {
        for (let j = 0; j < brushPattern[i].length; j++) {
          const brushPatternItem = brushPattern[i][j];
          if (brushPatternItem === 0) {
            continue;
          }
          const {
            topRowIndex,
            leftColumnIndex,
            bottomRowIndex,
            rightColumnIndex,
          } = getGridIndicesFromData(data);
          const rowIndexToColor = rowIndex + i - brushPatternCenterRowIndex;
          const columnIndexToColor =
            columnIndex + j - brushPatternCenterColumnIndex;
          if (
            rowIndexToColor < topRowIndex ||
            rowIndexToColor > bottomRowIndex ||
            columnIndexToColor < leftColumnIndex ||
            columnIndexToColor > rightColumnIndex
          ) {
            continue;
          }
          const previousColor = data
            .get(rowIndexToColor)
            ?.get(columnIndexToColor)?.color;
          interactionLayer.addToStrokePixelRecords(CurrentDeviceUserId, {
            rowIndex: rowIndexToColor,
            columnIndex: columnIndexToColor,
            color: this.brushColor,
            previousColor,
          });
        }
      }
    } else if (this.brushTool === BrushTool.PAINT_BUCKET) {
      const gridIndices = getGridIndicesFromData(data);
      const initialSelectedColor = data.get(rowIndex)?.get(columnIndex)?.color;
      if (initialSelectedColor === this.brushColor) {
        return;
      }
      this.colorPixelsArea(initialSelectedColor, gridIndices, {
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
      const modifiedPixels = [];
      const addedOrDeletedRows: Array<{
        index: number;
        isDelete: boolean;
      }> = [];
      const addedOrDeletedColumns: Array<{
        index: number;
        isDelete: boolean;
      }> = [];
      if (pixelModifyItems.length !== 0) {
        // when pixels are stroked we only need to consider added rows and columns
        const { totalAddedColumnIndices, totalAddedRowIndices } =
          this.dataLayer.colorPixels(
            pixelModifyItems,
            this.dataLayer.getCurrentLayer().getId(),
          );
        // record single player mode color change action
        this.recordColorChangeAction(pixelModifyItems);
        // we record modified pixels
        modifiedPixels.push(...pixelModifyItems);
        // we record the delta of the added rows and columns
        addedOrDeletedColumns.push(
          ...totalAddedColumnIndices.map(index => ({
            index,
            isDelete: false,
          })),
        );
        addedOrDeletedRows.push(
          ...totalAddedRowIndices.map(index => ({
            index,
            isDelete: false,
          })),
        );
        this.emitStrokeEndEvent({
          strokedPixels: pixelModifyItems,
          data: this.dataLayer.getCopiedData(),
          strokeTool: this.brushTool,
        });
      }

      const capturedData = interactionLayer.getCapturedData();
      // if there is capturedData, it means that the user has changed the dimension
      if (capturedData) {
        // for action of grid change, we do not need to consider modifiedPixels
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
        if (topRowDiff < 0) {
          const amount = -topRowDiff;
          const addedRowIndices = Array.from(
            new Array(amount),
            (_, i) => dataGridIndices.topRowIndex - i - 1,
          );
          addedOrDeletedRows.push(
            ...addedRowIndices.map(index => ({
              index,
              isDelete: false,
            })),
          );
        } else if (topRowDiff > 0) {
          const amount = topRowDiff;
          const deletedRowIndices = Array.from(
            new Array(amount),
            (_, i) => dataGridIndices.topRowIndex + i,
          );
          addedOrDeletedRows.push(
            ...deletedRowIndices.map(index => ({
              index,
              isDelete: true,
            })),
          );
        }
        if (leftColumnDiff < 0) {
          const amount = -leftColumnDiff;
          const addedColumnIndices = Array.from(
            new Array(amount),
            (_, i) => dataGridIndices.leftColumnIndex - i - 1,
          );
          addedOrDeletedColumns.push(
            ...addedColumnIndices.map(index => ({
              index,
              isDelete: false,
            })),
          );
        } else if (leftColumnDiff > 0) {
          const amount = leftColumnDiff;
          const deletedColumnIndices = Array.from(
            new Array(amount),
            (_, i) => dataGridIndices.leftColumnIndex + i,
          );
          addedOrDeletedColumns.push(
            ...deletedColumnIndices.map(index => ({
              index,
              isDelete: true,
            })),
          );
        }
        if (bottomRowDiff > 0) {
          const amount = bottomRowDiff;
          const addedRowIndices = Array.from(
            new Array(amount),
            (_, i) => dataGridIndices.bottomRowIndex + i + 1,
          );
          addedOrDeletedRows.push(
            ...addedRowIndices.map(index => ({
              index,
              isDelete: false,
            })),
          );
        } else if (bottomRowDiff < 0) {
          const amount = -bottomRowDiff;
          const deletedRowIndices = Array.from(
            new Array(amount),
            (_, i) => dataGridIndices.bottomRowIndex - i,
          );
          addedOrDeletedRows.push(
            ...deletedRowIndices.map(index => ({
              index,
              isDelete: true,
            })),
          );
        }
        if (rightColumnDiff > 0) {
          const amount = rightColumnDiff;
          const addedColumnIndices = Array.from(
            new Array(amount),
            (_, i) => dataGridIndices.rightColumnIndex + i + 1,
          );
          addedOrDeletedColumns.push(
            ...addedColumnIndices.map(index => ({
              index,
              isDelete: false,
            })),
          );
        } else if (rightColumnDiff < 0) {
          const amount = -rightColumnDiff;
          const deletedColumnIndices = Array.from(
            new Array(amount),
            (_, i) => dataGridIndices.rightColumnIndex - i,
          );
          addedOrDeletedColumns.push(
            ...deletedColumnIndices.map(index => ({
              index,
              isDelete: true,
            })),
          );
        }

        if (
          addedOrDeletedColumns.length !== 0 ||
          addedOrDeletedRows.length !== 0
        ) {
          const addedColumIndices = addedOrDeletedColumns
            .filter(item => item.isDelete === false)
            .map(el => el.index);
          const addedRowIndices = addedOrDeletedRows
            .filter(item => item.isDelete === false)
            .map(el => el.index);
          const deletedColumnIndices = addedOrDeletedColumns
            .filter(item => item.isDelete === true)
            .map(el => el.index);
          const deletedRowIndices = addedOrDeletedRows
            .filter(item => item.isDelete === true)
            .map(el => el.index);

          this.dataLayer.addGridIndices({
            rowIndicesToAdd: addedRowIndices,
            columnIndicesToAdd: addedColumIndices,
          });
          const swipedPixels = this.dataLayer.deleteGridIndices({
            rowIndicesToDelete: deletedRowIndices,
            columnIndicesToDelete: deletedColumnIndices,
          }).swipedPixels;
          this.recordSizeChangeAction(
            addedRowIndices,
            addedColumIndices,
            deletedRowIndices,
            deletedColumnIndices,
            swipedPixels,
          );
        }
      }
      // this will handle all data change actions done by the current device user
      // no need to record the action of the current device user in any other places
      const updatedData = this.dataLayer.getCopiedData();
      // we only emit data change event when there is a change
      if (
        modifiedPixels.length !== 0 ||
        addedOrDeletedRows.length !== 0 ||
        addedOrDeletedColumns.length !== 0
      ) {
        this.emitDataChangeEvent({
          isLocalChange: true,
          data: updatedData,
          layerId: this.dataLayer.getCurrentLayer().getId(),
          delta: {
            modifiedPixels: modifiedPixels,
            addedOrDeletedRows: addedOrDeletedRows,
            addedOrDeletedColumns: addedOrDeletedColumns,
          },
        });
      }
      const updatedColumnCount = getColumnCountFromData(updatedData);
      const updatedRowCount = getRowCountFromData(updatedData);
      const updatedDimensions = {
        rowCount: updatedRowCount,
        columnCount: updatedColumnCount,
      };
      const updatedGridIndices = getGridIndicesFromData(updatedData);
      // we only emit grid change event when there is a change in deleted or added rows or columns
      if (
        addedOrDeletedColumns.length !== 0 ||
        addedOrDeletedRows.length !== 0
      ) {
        this.emitGridChangeEvent({
          dimensions: updatedDimensions,
          indices: updatedGridIndices,
        });
        this.emitCurrentCanvasInfoStatus();
      }

      // deletes the records of the current user
      interactionLayer.deleteErasedPixelRecord(CurrentDeviceUserId);
      interactionLayer.deleteStrokePixelRecord(CurrentDeviceUserId);
      this.dataLayer.setCriterionDataForRendering(this.dataLayer.getData());
    }
    this.relayDataDimensionsToLayers();
    this.interactionLayer.setCriterionDataForRendering(
      this.dataLayer.getData(),
    );
    interactionLayer.resetCapturedData();
    this.renderAll();
  }

  /**
   * @description records the size change action of the user interaction
   */
  recordSizeChangeAction(
    rowIndicesToAdd: Array<number>,
    columnIndicesToAdd: Array<number>,
    rowIndicesToDelete: Array<number>,
    columnIndicesToDelete: Array<number>,
    deletedPixels: Array<PixelModifyItem>,
  ) {
    this.recordAction(
      new ColorSizeChangeAction(
        deletedPixels,
        rowIndicesToAdd,
        columnIndicesToAdd,
        rowIndicesToDelete,
        columnIndicesToDelete,
        this.dataLayer.getCurrentLayer().getId(),
      ),
    );
  }

  recordColorChangeAction(pixelModifyItems: Array<ColorChangeItem>) {
    this.recordAction(
      new ColorChangeAction(
        pixelModifyItems,
        this.dataLayer.getCurrentLayer().getId(),
      ),
    );
  }

  commitAction(action: Action) {
    const type = action.getType();
    const layerId = action.getLayerId();
    if (type !== ActionType.SelectAreaMove) {
      // we will disable the select area move tool after the action is committed
      this.interactionLayer.setSelectedArea(null);
      this.setBrushTool(BrushTool.DOT);
    }
    const modifiedPixels = [];
    const addedOrDeletedColumns = [];
    const addedOrDeletedRows = [];
    switch (type) {
      case ActionType.ColorChange:
        const colorChangeAction = action as ColorChangeAction;
        this.dataLayer.updatePixelColors(colorChangeAction.data, layerId);
        modifiedPixels.push(...colorChangeAction.data);
        break;

      case ActionType.ColorSizeChange:
        const colorSizeChangeAction = action as ColorSizeChangeAction;
        const colorSizeChangeRowsToAdd = Array.from(
          colorSizeChangeAction.rowIndicesToAdd,
        );
        const colorSizeChangeRowsToDelete = Array.from(
          colorSizeChangeAction.rowIndicesToDelete,
        );
        const colorSizeChangeColumnsToAdd = Array.from(
          colorSizeChangeAction.columnIndicesToAdd,
        );
        const colorSizeChangeColumnsToDelete = Array.from(
          colorSizeChangeAction.columnIndicesToDelete,
        );
        this.dataLayer.deleteGridIndices({
          rowIndicesToDelete: colorSizeChangeRowsToDelete,
          columnIndicesToDelete: colorSizeChangeColumnsToDelete,
        });
        this.dataLayer.addGridIndices({
          rowIndicesToAdd: colorSizeChangeRowsToAdd,
          columnIndicesToAdd: colorSizeChangeColumnsToAdd,
        });
        addedOrDeletedColumns.push(
          ...colorSizeChangeColumnsToDelete.map(index => ({
            index,
            isDelete: true,
          })),
          ...colorSizeChangeColumnsToAdd.map(index => ({
            index,
            isDelete: false,
          })),
        );
        addedOrDeletedRows.push(
          ...colorSizeChangeRowsToDelete.map(index => ({
            index,
            isDelete: true,
          })),
          ...colorSizeChangeRowsToAdd.map(index => ({
            index,
            isDelete: false,
          })),
        );
        // we do not need to care for colorchangemode. Erase since the grids are already deleted
        const colorSizeChangePixels = colorSizeChangeAction.data;
        // add the modified pixels to the modifiedPixels array
        modifiedPixels.push(...colorSizeChangePixels);
        this.dataLayer.updatePixelColors(colorSizeChangePixels, layerId);
        break;

      case ActionType.SelectAreaMove:
        const selectAreamoveAction = action as SelectAreaMoveAction;
        const updatedPixels = this.dataLayer.updatePixelColors(
          selectAreamoveAction.data,
          layerId,
        );
        modifiedPixels.push(...updatedPixels);
        this.brushTool = BrushTool.SELECT;
        this.interactionLayer.setSelectedArea(
          selectAreamoveAction.newSelectedArea,
        );
        break;
      case ActionType.LayerCreate:
        const layerCreateAction = action as LayerDeleteAction;
        this.addLayer(
          layerCreateAction.layerId,
          layerCreateAction.removeIndex,
          layerCreateAction.layer.getDataArray(),
        );
        break;
      case ActionType.LayerDelete:
        const layerDeleteAction = action as LayerCreateAction;
        this.removeLayer(layerDeleteAction.layerId);
        if (
          this.dataLayer.getCurrentLayer().getId() === layerDeleteAction.layerId
        ) {
          this.dataLayer.setCurrentLayer(this.dataLayer.getLayers()[0].getId());
        }
        break;
      case ActionType.LayerOrderChange:
        const layerOrderChangeAction = action as LayerReorderAction;
        this.dataLayer.reorderLayersByIds(
          layerOrderChangeAction.reorderdLayerIds,
        );
        break;
    }
    this.emitCurrentLayerStatus();
    if (!this.dataLayer.getLayer(layerId)) {
      return;
    }
    const updatedData = this.dataLayer.getLayer(layerId).getCopiedData();
    this.emitGridChangeEvent({
      dimensions: {
        rowCount: getRowCountFromData(updatedData),
        columnCount: getColumnCountFromData(updatedData),
      },
      indices: getGridIndicesFromData(updatedData),
    });
    // undo and redo can happen only by the current device user
    // this is why we emit data change event with `isLocalChange = true`
    this.emitDataChangeEvent({
      isLocalChange: true,
      data: updatedData,
      layerId: layerId,
      delta: {
        modifiedPixels: modifiedPixels,
        addedOrDeletedRows: addedOrDeletedRows,
        addedOrDeletedColumns: addedOrDeletedColumns,
      },
    });
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

  erasePixels(
    data: Array<{ rowIndex: number; columnIndex: number }>,
    layerId?: string,
    isLocalChange = false,
  ) {
    const { dataForAction } = this.dataLayer.erasePixels(data, layerId);
    const modifiedLayerId = layerId
      ? layerId
      : this.dataLayer.getCurrentLayer().getId();
    if (this.interactionLayer.getCapturedData() !== null) {
      this.interactionLayer.erasePixels(data);
    }
    // we don't need to relay data dimensions to layers because there will be no
    // row column change in erasePixels
    this.recordAction(new ColorChangeAction(dataForAction, modifiedLayerId));
    this.emitDataChangeEvent({
      isLocalChange,
      data: this.dataLayer.getLayer(modifiedLayerId).getCopiedData(),
      layerId: modifiedLayerId,
      delta: {
        modifiedPixels: dataForAction,
        addedOrDeletedColumns: [],
        addedOrDeletedRows: [],
      },
    });
    this.renderAll();
  }

  // this only applies for multiplayer mode or user direct function call
  colorPixels(
    data: Array<PixelModifyItem>,
    layerId?: string,
    isLocalChange = false,
  ) {
    const { dataForAction, totalAddedColumnIndices, totalAddedRowIndices } =
      this.dataLayer.colorPixels(data, layerId);
    const modifiedLayerId = layerId
      ? layerId
      : this.dataLayer.getCurrentLayer().getId();
    if (this.interactionLayer.getCapturedData() !== null) {
      //only color pixels in interaction layer if there is a captured data
      this.interactionLayer.colorPixels(data);
      this.interactionLayer.setCriterionDataForRendering(
        this.interactionLayer.getCapturedData(),
      );
    } else {
      this.interactionLayer.setCriterionDataForRendering(
        this.dataLayer.getLayer(modifiedLayerId).getData(),
      );
    }
    this.relayDataDimensionsToLayers();
    this.recordAction(
      new ColorSizeChangeAction(
        // in color size change action we record the previous color
        dataForAction.map(item => {
          return {
            rowIndex: item.rowIndex,
            columnIndex: item.columnIndex,
            color: item.previousColor,
          };
        }),
        totalAddedRowIndices,
        totalAddedColumnIndices,
        [],
        [],
        modifiedLayerId,
      ),
    );

    this.emitDataChangeEvent({
      isLocalChange,
      data: this.dataLayer.getLayer(modifiedLayerId).getCopiedData(),
      layerId: modifiedLayerId,
      delta: {
        modifiedPixels: dataForAction,
        addedOrDeletedColumns: totalAddedColumnIndices.map(columnIndex => ({
          index: columnIndex,
          isDelete: false,
        })),
        addedOrDeletedRows: totalAddedRowIndices.map(rowIndex => ({
          index: rowIndex,
          isDelete: false,
        })),
      },
    });
    this.dataLayer.setCriterionDataForRendering(
      this.dataLayer.getLayer(modifiedLayerId).getData(),
    );
    this.renderAll();
  }

  // this will be only used by the current device user
  private colorPixelsArea(
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
  }

  onMouseDown(evt: TouchyEvent) {
    evt.preventDefault();
    const point = getPointFromTouchyEvent(evt, this.element, this.panZoom);
    this.panPoint.lastMousePos = { x: point.offsetX, y: point.offsetY };
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
    // rowKeyOrderMap is a sorted map of rowKeys
    const rowIndices = Array.from(this.dataLayer.getRowKeyOrderMap().keys());
    // columnKeyOrderMap is a sorted map of columnKeys
    const columnIndices = Array.from(
      this.dataLayer.getColumnKeyOrderMap().keys(),
    );
    const pixelIndex = getPixelIndexFromMouseCartCoord(
      mouseCartCoord,
      rowIndices,
      columnIndices,
      this.gridSquareLength,
    );

    // if pixelIndex is set it means that the mouse is in the grid
    // then we it is safe to say that mouse mode is drawing
    this.mouseMode = pixelIndex ? MouseMode.DRAWING : MouseMode.PANNING;
    const buttonDirection = this.detectButtonClicked(mouseCartCoord);
    if (buttonDirection) {
      this.mouseMode = MouseMode.EXTENDING;
    }
    if (this.brushTool === BrushTool.SELECT) {
      this.mouseMode = MouseMode.DRAWING;
    }

    if (this.mouseMode === MouseMode.DRAWING) {
      // we only need to care about select tool when mouse mode is set to drawing
      if (this.brushTool === BrushTool.SELECT) {
        // brush tool select also means mouse is drawng
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
            const coloredPixels = this.getColoredPixelsInSelectedArea(
              previousSelectedArea,
              "",
            );
            this.interactionLayer.setExtendingSelectedArea(
              previousSelectedArea,
            );
            this.interactionLayer.setExtendingSelectedPixels(coloredPixels);
            this.interactionLayer.setCapturedBaseExtendingSelectedArea(
              previousSelectedArea,
            );
            this.interactionLayer.setCapturedBaseExtendingSelectedAreaPixels(
              coloredPixels,
            );
            this.dataLayer.erasePixels(coloredPixels);
            this.dataLayer.render();
            this.interactionLayer.render();

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
          this.interactionLayer.setSelectingArea(null);
          const coloredPixels = this.getColoredPixelsInSelectedArea(
            previousSelectedArea!,
            "",
          );

          this.dataLayer.erasePixels(coloredPixels);
          this.interactionLayer.setSelectedAreaPixels(coloredPixels);
          this.interactionLayer.setMovingSelectedPixels(coloredPixels);
          this.interactionLayer.setMovingSelectedArea(previousSelectedArea);
          this.dataLayer.render();
          this.interactionLayer.render();

          // move the pixels to interaction layer
        }
      } else if (this.brushTool === BrushTool.DOT) {
        if (pixelIndex) {
          this.drawPixelInInteractionLayer(
            pixelIndex.rowIndex,
            pixelIndex.columnIndex,
            this.interactionLayer.getBrushPattern(),
          );
          this.renderInteractionLayer();
        }
      }
    } else if (this.mouseMode === MouseMode.PANNING) {
      // mouse mode is panning
      const touchesCount =
        evt.touches && evt.touches.length ? evt.touches.length : 0;
      if (touchesCount === 2) {
        this.mouseMode = MouseMode.PINCHZOOMING;
        const centerCartCoord = getCenterCartCoordFromTwoTouches(
          evt,
          this.element,
          this.panZoom,
          this.dpr,
        );
        if (centerCartCoord) {
          this.mouseDownWorldPos = {
            x: centerCartCoord.x,
            y: centerCartCoord.y,
          };
          this.panPoint.lastMousePos = {
            x: centerCartCoord.x,
            y: centerCartCoord.y,
          };
        } else {
          this.mouseMode = MouseMode.NULL;
        }
      } else if (touchesCount > 2) {
        this.mouseMode = MouseMode.NULL;
      }
    } else if (this.mouseMode === MouseMode.EXTENDING) {
      const isGridFixed = this.gridLayer.getIsGridFixed();
      if (!isGridFixed) {
        if (buttonDirection) {
          this.extensionPoint.direction = buttonDirection;
          this.mouseMode = MouseMode.EXTENDING;
        }
      }
    }
    this.previousMouseMoveWorldPos = this.mouseDownWorldPos;
  }

  private getColoredPixelsInSelectedArea(
    selectedArea: SelectAreaRange,
    newColor: string,
  ): Array<ColorChangeItem> {
    const data = this.dataLayer.getData();
    const rowCount = this.dataLayer.getRowCount();
    const columnCount = this.dataLayer.getColumnCount();
    const rowKeys = getRowKeysFromData(data);
    const columnKeys = getColumnKeysFromData(data);
    const sortedRowKeys = rowKeys.sort((a, b) => a - b);
    const sortedColumnKeys = columnKeys.sort((a, b) => a - b);
    const includedPixelsIndices = convertWorldPosAreaToPixelGridArea(
      selectedArea,
      rowCount,
      columnCount,
      this.gridSquareLength,
      sortedRowKeys,
      sortedColumnKeys,
    )?.includedPixelsIndices;
    if (!includedPixelsIndices) {
      return [];
    }
    const { topRowIndex, bottomRowIndex, leftColumnIndex, rightColumnIndex } =
      getGridIndicesFromData(data);
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
          color: newColor,
        });
      }
    }
    const filteredSelectedAreaPixels = selectedAreaPixels.filter(
      ({ rowIndex, columnIndex }) =>
        rowIndex >= topRowIndex &&
        rowIndex <= bottomRowIndex &&
        columnIndex >= leftColumnIndex &&
        columnIndex <= rightColumnIndex,
    );
    return filteredSelectedAreaPixels;
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

    if (this.mouseMode === MouseMode.NULL) {
      if (this.brushTool === BrushTool.SELECT) {
        const selectedArea = this.interactionLayer.getSelectedArea();
        if (selectedArea) {
          this.gridLayer.render();
          this.gridLayer.renderSelection(selectedArea);
        }
        return;
      }
      // just show hover pixel, and show hovered button
      const rowIndices = Array.from(this.dataLayer.getRowKeyOrderMap().keys());
      // columnKeyOrderMap is a sorted map of columnKeys
      const columnIndices = Array.from(
        this.dataLayer.getColumnKeyOrderMap().keys(),
      );
      const hoveredPixel = this.interactionLayer.getHoveredPixel();

      const pixelIndex = getPixelIndexFromMouseCartCoord(
        mouseCartCoord,
        rowIndices,
        columnIndices,
        this.gridSquareLength,
      );
      if (pixelIndex) {
        if (
          // We should also consider when the hovered pixel is null
          !hoveredPixel ||
          hoveredPixel.rowIndex !== pixelIndex.rowIndex ||
          hoveredPixel.columnIndex !== pixelIndex.columnIndex
        ) {
          this.interactionLayer.setHoveredPixel({
            rowIndex: pixelIndex.rowIndex,
            columnIndex: pixelIndex.columnIndex,
            color:
              this.brushTool !== BrushTool.ERASER ? this.brushColor : "white",
          });
          this.emitHoverPixelChangeEvent({
            indices: pixelIndex,
          });
          this.renderInteractionLayer();
        }
      } else {
        this.emitHoverPixelChangeEvent({
          indices: null,
        });
        this.interactionLayer.setHoveredPixel(null);
        this.renderInteractionLayer();
      }

      const buttonDirection = this.detectButtonClicked(mouseCartCoord);
      this.gridLayer.setHoveredButton(buttonDirection);

      this.renderGridLayer();
    } else if (this.mouseMode === MouseMode.EXTENDING) {
      if (this.gridLayer.getIsGridFixed()) {
        return;
      }
      const buttonDirection = this.extensionPoint.direction;
      if (!this.interactionLayer.getCapturedData()) {
        this.gridLayer.setHoveredButton(buttonDirection);
        this.renderGridLayer();
      }
      this.handleExtension(evt);
    } else if (this.mouseMode === MouseMode.PANNING) {
      if (!this.isPanZoomable) {
        return;
      }
      this.handlePanning(evt);
    } else if (this.mouseMode === MouseMode.PINCHZOOMING) {
      this.handlePinchZoom(evt);
    } else if (this.mouseMode == MouseMode.DRAWING) {
      // rowKeyOrderMap is a sorted map of rowKeys
      const rowIndices = Array.from(this.dataLayer.getRowKeyOrderMap().keys());
      // columnKeyOrderMap is a sorted map of columnKeys
      const columnIndices = Array.from(
        this.dataLayer.getColumnKeyOrderMap().keys(),
      );
      const pixelIndex = getPixelIndexFromMouseCartCoord(
        mouseCartCoord,
        rowIndices,
        columnIndices,
        this.gridSquareLength,
      );

      // select tool
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
            this.isAltPressed,
          );
          this.gridLayer.render();
          this.gridLayer.renderSelection(
            this.interactionLayer.getExtendingSelectedArea(),
          );
          this.interactionLayer.render();
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
            startPixelIndex: {
              rowIndex:
                previousSelectedArea.startPixelIndex.rowIndex - pixelWiseDeltaY,
              columnIndex:
                previousSelectedArea.startPixelIndex.columnIndex -
                pixelWiseDeltaX,
            },
            endPixelIndex: {
              rowIndex:
                previousSelectedArea.endPixelIndex.rowIndex - pixelWiseDeltaY,
              columnIndex:
                previousSelectedArea.endPixelIndex.columnIndex -
                pixelWiseDeltaX,
            },
          });

          this.interactionLayer.setMovingSelectedPixels(
            newMovingSelectedPixels,
          );
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
        // other tools: draw, erase, paint bucket
        if (pixelIndex) {
          this.drawPixelInInteractionLayer(
            pixelIndex.rowIndex,
            pixelIndex.columnIndex,
            this.interactionLayer.getBrushPattern(),
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
                this.interactionLayer.getBrushPattern(),
              );
            });
          }
          this.renderInteractionLayer();
          if (this.brushTool === BrushTool.ERASER) {
            this.renderErasedPixelsFromInteractionLayerInDataLayer();
          }
        }
      }
    }

    this.previousMouseMoveWorldPos = this.mouseMoveWorldPos;
  }

  getSelectedArea() {
    return this.interactionLayer.getSelectedArea();
  }

  onKeyDown(e: KeyboardEvent) {
    if (e.code === "KeyZ" && (e.ctrlKey || e.metaKey)) {
      this.undo();
    } else if (e.code === "KeyY" && (e.ctrlKey || e.metaKey)) {
      this.redo();
    } else if (e.code === "Backspace" || e.code === "Delete") {
      if (this.interactionLayer.getSelectedArea()) {
        if (this.interactionLayer.getSelectedAreaPixels().length === 0) return;
        const previousSelectedAreaPixels =
          this.interactionLayer.getSelectedAreaPixels();
        if (
          !previousSelectedAreaPixels ||
          previousSelectedAreaPixels.length === 0
        )
          return;

        const { dataForAction } = this.dataLayer.erasePixels(
          this.interactionLayer.getSelectedAreaPixels(),
        );
        this.recordAction(
          new SelectAreaMoveAction(
            [
              ...dataForAction.map(pixel => ({
                ...pixel,
                color: "",
              })),
              ...dataForAction,
            ],
            this.interactionLayer.getSelectedArea(),
            this.interactionLayer.getSelectedArea(),
            this.dataLayer.getCurrentLayer().getId(),
          ),
        );
        this.dataLayer.render();
      }
    } else if (e.code === "Escape") {
      this.interactionLayer.setExtendingSelectedArea(null);
      this.interactionLayer.setExtendingSelectedPixels([]);
      this.interactionLayer.setMovingSelectedArea(null);
      this.interactionLayer.setMovingSelectedPixels([]);
      this.interactionLayer.setSelectingArea(null);
      this.interactionLayer.setSelectedArea(null);
      this.interactionLayer.setSelectedAreaPixels([]);
      this.gridLayer.render();
    } else if (e.code === "AltLeft") {
      const pixelsThatAreCurrentlyExtending =
        this.interactionLayer.getExtendingSelectedPixels();
      const currentExtendingArea =
        this.interactionLayer.getExtendingSelectedArea();
      if (pixelsThatAreCurrentlyExtending && currentExtendingArea) {
        this.interactionLayer.setCapturedBaseExtendingSelectedArea(
          currentExtendingArea,
        );
        this.interactionLayer.setCapturedBaseExtendingSelectedAreaPixels(
          pixelsThatAreCurrentlyExtending,
        );
      }
      this.isAltPressed = true;
    }
  }

  onKeyUp(e: KeyboardEvent<HTMLDivElement>) {
    if (e.code === "AltLeft") {
      const pixelsThatAreCurrentlyExtending =
        this.interactionLayer.getExtendingSelectedPixels();
      const currentExtendingArea =
        this.interactionLayer.getExtendingSelectedArea();
      if (pixelsThatAreCurrentlyExtending && currentExtendingArea) {
        this.interactionLayer.setCapturedBaseExtendingSelectedArea(
          currentExtendingArea,
        );
        this.interactionLayer.setCapturedBaseExtendingSelectedAreaPixels(
          pixelsThatAreCurrentlyExtending,
        );
      }

      this.isAltPressed = false;
    }
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
          startPixelIndex: region.includedPixelsIndices[0],
          endPixelIndex:
            region.includedPixelsIndices[
              region.includedPixelsIndices.length - 1
            ],
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

  relayExtendingSelectedAreaToSelectedArea() {
    // we must record the action
    const previousSelectedArea = this.interactionLayer.getSelectedArea();
    const previousSelectedAreaPixels =
      this.interactionLayer.getSelectedAreaPixels();
    const finalSelectedArea = this.interactionLayer.getExtendingSelectedArea();
    const finalSelectedAreaPixels =
      this.interactionLayer.getExtendingSelectedPixels();
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
      .map(item => {
        const previousColor = data
          .get(item.rowIndex)
          .get(item.columnIndex)?.color;
        return {
          ...item,
          color: item.previousColor,
          previousColor,
        };
      });
    const { dataForAction } = this.dataLayer.colorPixels(
      filteredFinalSelectedAreaPixels,
      this.dataLayer.getCurrentLayer().getId(),
    );
    const newSelectedAreaColorChangeItems = dataForAction;
    const previousSelectedAreaColorChangeItems = previousSelectedAreaPixels;
    this.recordAction(
      new SelectAreaMoveAction(
        [
          ...newSelectedAreaColorChangeItems,
          ...previousSelectedAreaColorChangeItems,
        ],
        previousSelectedArea,
        finalSelectedArea,
        this.dataLayer.getCurrentLayer().getId(),
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
      this.emitDataChangeEvent({
        isLocalChange: true,
        data: newData,
        layerId: this.dataLayer.getCurrentLayer().getId(),
        delta: {
          modifiedPixels: effectiveColorChangeItems,
          addedOrDeletedColumns: [],
          addedOrDeletedRows: [],
        },
      });
    }
    this.interactionLayer.setSelectedArea(finalSelectedArea);
    this.interactionLayer.setSelectedAreaPixels(
      filteredFinalSelectedAreaPixels,
    );
    this.interactionLayer.setExtendingSelectedArea(null);
    this.interactionLayer.setExtendingSelectedPixels(null);
    this.interactionLayer.setDirectionToExtendSelectedArea(null);
    this.gridLayer.render();
    this.gridLayer.renderSelection(finalSelectedArea);
    this.interactionLayer.setSelectedAreaPixels(
      filteredFinalSelectedAreaPixels,
    );
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
      this.dataLayer.getCurrentLayer().getId(),
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
        this.dataLayer.getCurrentLayer().getId(),
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
      this.emitDataChangeEvent({
        isLocalChange: true,
        data: newData,
        layerId: this.dataLayer.getCurrentLayer().getId(),
        delta: {
          modifiedPixels: effectiveColorChangeItems,
          addedOrDeletedColumns: [],
          addedOrDeletedRows: [],
        },
      });
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
    this.mouseMode = MouseMode.NULL;
    if (this.brushTool === BrushTool.SELECT) {
      this.relaySelectingAreaToSelectedArea();
      this.relayMovingSelectedAreaToSelectedArea();
      this.relayExtendingSelectedAreaToSelectedArea();
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
    this.relayInteractionDataToDataLayer();
    this.pinchZoomDiff = undefined;
    this.gridLayer.setHoveredButton(null);
    this.renderGridLayer();
    const selectedArea = this.interactionLayer.getSelectedArea();
    if (selectedArea) {
      this.gridLayer.renderSelection(selectedArea);
    }
    // we make mouse down world position null
    this.mouseDownWorldPos = null;
    this.mouseDownPanZoom = null;
    this.previousMouseMoveWorldPos = null;
    return;
  }

  onMouseOut(evt: TouchEvent) {
    evt.preventDefault();
    this.relayInteractionDataToDataLayer();

    this.interactionLayer.setSelectingArea(null);
    if (this.gridLayer.getHoveredButton() !== null) {
      this.emitHoverPixelChangeEvent({
        indices: null,
      });
    }
    this.gridLayer.setHoveredButton(null);
    this.renderGridLayer();
    const selectedArea = this.interactionLayer.getSelectedArea();
    if (selectedArea) {
      this.gridLayer.renderSelection(selectedArea);
    }
    return;
  }

  renderGridLayer() {
    this.gridLayer.render();
  }

  // clear will delete all layer data and history
  clear() {
    const clearedPixels = this.dataLayer.clear();
    // this clear callback is undoable
    this.undoHistory = [];
    this.redoHistory = [];
    for (let i = 0; i < clearedPixels.length; i++) {
      const { layerId, data } = clearedPixels[i];
      this.emitDataChangeEvent({
        isLocalChange: true,
        layerId,
        data: this.dataLayer.getLayer(layerId).getCopiedData(),
        delta: {
          addedOrDeletedColumns: [],
          addedOrDeletedRows: [],
          modifiedPixels: data,
        },
      });
    }
    this.renderDataLayer();
  }

  downloadImage(options: ImageDownloadOptions) {
    const data = this.dataLayer.getData();
    const columnCount = this.getColumnCount();
    const rowCount = this.getRowCount();
    const allRowKeys = getRowKeysFromData(data);
    const allColumnKeys = getColumnKeysFromData(data);
    const rowKeyOrderMap = createRowKeyOrderMapfromData(data);
    const columnKeyOrderMap = createColumnKeyOrderMapfromData(data);
    const { topRowIndex, bottomRowIndex, leftColumnIndex, rightColumnIndex } =
      getGridIndicesFromData(data);
    if (options.type === "png") {
      const imageCanvas = document.createElement("canvas");
      imageCanvas.width = columnCount * this.gridSquareLength;
      imageCanvas.height = rowCount * this.gridSquareLength;
      const imageContext = imageCanvas.getContext("2d")!;
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
        if (options && options.isGridVisible) {
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
    } else if (options.type === "svg") {
      const svgDom = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      );
      let validTopRowIndex = rowCount - 1;
      let validBottomRowIndex = 0;
      let validLeftColumnIndex = columnCount - 1;
      let validRightColumnIndex = 0;
      const validPixelModifyItems: Array<PixelModifyItem> = [];

      for (let i = 0; i < allRowKeys.length; i++) {
        const rowKey = allRowKeys[i];
        for (let j = 0; j < allColumnKeys.length; j++) {
          const columnKey = allColumnKeys[j];
          const color = data.get(rowKey)?.get(columnKey)?.color;
          if (color) {
            validTopRowIndex = Math.min(validTopRowIndex, rowKey);
            validBottomRowIndex = Math.max(validBottomRowIndex, rowKey);
            validLeftColumnIndex = Math.min(validLeftColumnIndex, columnKey);
            validRightColumnIndex = Math.max(validRightColumnIndex, columnKey);
            validPixelModifyItems.push({
              rowIndex: i,
              columnIndex: j,
              color: color,
            });
          }
        }
      }
      const validTopRowIndexOrder = rowKeyOrderMap.get(validTopRowIndex);
      const validLeftColumnIndexOrder =
        columnKeyOrderMap.get(validLeftColumnIndex);
      const svgWidth =
        (validRightColumnIndex - validLeftColumnIndex + 1) *
        this.gridSquareLength;
      const svgHeight =
        (validBottomRowIndex - validTopRowIndex + 1) * this.gridSquareLength;
      svgDom.setAttribute("width", `${svgWidth}`);
      svgDom.setAttribute("height", `${svgHeight}`);
      if (validPixelModifyItems.length === 0) {
        throw new NoDataToMakeSvgError();
      }
      for (let i = 0; i < validPixelModifyItems.length; i++) {
        const { rowIndex, columnIndex, color } = validPixelModifyItems[i];
        const svgRect = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect",
        );
        const correctedRowIndex = rowIndex - validTopRowIndexOrder;
        const correctedColumnIndex = columnIndex - validLeftColumnIndexOrder;
        svgRect.setAttribute(
          "y",
          `${correctedRowIndex * this.gridSquareLength}`,
        );
        svgRect.setAttribute(
          "x",
          `${correctedColumnIndex * this.gridSquareLength}`,
        );
        svgRect.setAttribute("width", `${this.gridSquareLength}`);
        svgRect.setAttribute("height", `${this.gridSquareLength}`);
        svgRect.setAttribute("fill", `${color}`);
        svgDom.appendChild(svgRect);
      }
      const svgString = new XMLSerializer().serializeToString(svgDom);
      const anchor = document.createElement("a");
      anchor.href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
        svgString,
      )}`;
      anchor.download = "dotting.svg";
      anchor.click();
    } else {
      throw new UnrecognizedDownloadOptionError();
    }
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
        x: 0,
        y: 0,
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
    touchy(this.element, removeEvent, "mousemove", this.handlePinchZoom);
    this.element.removeEventListener("wheel", this.handleWheel);
  }
}
