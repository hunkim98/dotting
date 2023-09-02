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
  BRUSH_PATTERN_ELEMENT,
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
  validateSquareArray,
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
    offsetYAmount: number;
    offsetXAmount: number;
  } = {
    direction: null,
    offsetYAmount: 0,
    offsetXAmount: 0,
  };
  private isPanZoomable = true;
  private isAltPressed = false;
  private mouseMode: MouseMode = MouseMode.PANNING;
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
  }: {
    gridCanvas: HTMLCanvasElement;
    interactionCanvas: HTMLCanvasElement;
    dataCanvas: HTMLCanvasElement;
    backgroundCanvas: HTMLCanvasElement;
    initLayers?: Array<LayerProps>;
  }) {
    super();
    // if (layers) {
    //   this.layers = layers.map(layer => {
    //     return {
    //       data: new DottingDataLayer({
    //         data: layer,
    //       }),
    //       id: crypto.randomUUID(),
    //     };
    //   });
    // }
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
    this.renderAll();
  }

  setMinScale(minScale: number) {
    if (minScale === undefined) {
      return;
    }
    if (minScale > this.maxScale) {
      throw new Error("minScale cannot be greater than maxScale");
    }
    this.minScale = minScale;
  }

  setMaxScale(maxScale: number) {
    if (maxScale === undefined) {
      return;
    }
    if (maxScale < this.minScale) {
      throw new Error("maxScale cannot be less than minScale");
    }
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
      throw new Error(`Data is not valid`);
    }
    // reset history when set data is called
    this.undoHistory = [];
    this.redoHistory = [];
    const currentLayer = layerId
      ? this.dataLayer.getLayer(layerId)
      : this.dataLayer.getCurrentLayer();
    const currentData = currentLayer.getData();
    const {
      gridIndices: currentDataGridIndices,
      columnCount: currentDataColumnCount,
      rowCount: currentDataRowCount,
    } = currentLayer.getDataInfo();
    const leftColumnIndex = data[0][0].columnIndex;
    const topRowIndex = data[0][0].rowIndex;

    const originalDataColumnIndices = Array.from(
      new Array(currentDataColumnCount),
      (x, i) => i + currentDataGridIndices.leftColumnIndex,
    );
    const originalDataRowIndices = Array.from(
      new Array(currentDataRowCount),
      (x, i) => i + currentDataGridIndices.topRowIndex,
    );

    const newColumnIndices = Array.from(
      new Array(columnCount),
      (x, i) => i + leftColumnIndex,
    );

    const newRowIndices = Array.from(
      new Array(rowCount),
      (x, i) => i + topRowIndex,
    );

    const columnIndicesToBeRemoved = originalDataColumnIndices.filter(
      index => !newColumnIndices.includes(index),
    );

    const rowIndicesToBeRemoved = originalDataRowIndices.filter(
      index => !newRowIndices.includes(index),
    );

    const columnIndicesToBeAdded = newColumnIndices.filter(
      index => !originalDataColumnIndices.includes(index),
    );

    const rowIndicesToBeAdded = newRowIndices.filter(
      index => !originalDataRowIndices.includes(index),
    );

    const pixelDataToBeRemoved = columnIndicesToBeRemoved.reduce(
      (acc, columnIndex) => {
        const column = currentData.get(columnIndex);
        if (!column) {
          throw new Error("Column not found");
        }
        const pixels = rowIndicesToBeRemoved.map(rowIndex => {
          const pixel = column.get(rowIndex);
          if (!pixel) {
            throw new Error("Pixel not found");
          }
          return {
            color: pixel.color,
            columnIndex,
            rowIndex,
            isDelete: true,
          };
        });
        return [...acc, ...pixels];
      },
      [] as Array<PixelModifyItem & { isDelete: boolean }>,
    );

    const pixelDataToBeAdded = columnIndicesToBeAdded.reduce(
      (acc, columnIndex) => {
        const column = data[columnIndex - leftColumnIndex];
        if (!column) {
          throw new Error("Column not found");
        }
        const pixels = rowIndicesToBeAdded.map(rowIndex => {
          const pixel = column[rowIndex - topRowIndex];
          if (!pixel) {
            throw new Error("Pixel not found");
          }
          return {
            color: pixel.color,
            columnIndex,
            rowIndex,
            isDelete: false,
          };
        });
        return [...acc, ...pixels];
      },
      [] as Array<PixelModifyItem & { isDelete: boolean }>,
    );

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
        throw new Error(
          "Layer id must be specified if there are multiple layers",
        );
      }
      this.dataLayer.setData(newData);
    } else {
      const layer = this.dataLayer.getLayer(layerId);
      if (!layer) {
        throw new Error("Layer not found");
      }
      const layerInfo = layer.getDataInfo();
      if (
        layerInfo.rowCount !== rowCount ||
        layerInfo.columnCount !== columnCount
      ) {
        throw new Error("Data dimensions do not match layer dimensions");
      }
      if (
        layerInfo.gridIndices.leftColumnIndex !== leftColumnIndex ||
        layerInfo.gridIndices.topRowIndex !== topRowIndex
      ) {
        throw new Error("Data indices do not match layer indices");
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

  addRowIndices(rowIndices: Array<number>) {
    for (const rowIndex of rowIndices) {
      this.dataLayer.addRow(rowIndex);
    }
  }

  addColumnIndices(columnIndices: Array<number>) {
    for (const columnIndex of columnIndices) {
      this.dataLayer.addColumn(columnIndex);
    }
  }

  deleteRowIndices(rowIndices: Array<number>) {
    const swipedPixels: Array<PixelModifyItem> = [];
    for (const rowIndex of rowIndices) {
      swipedPixels.push(...this.dataLayer.deleteRow(rowIndex));
    }
  }

  deleteColumnIndices(columnIndices: Array<number>) {
    const swipedPixels: Array<PixelModifyItem> = [];
    for (const columnIndex of columnIndices) {
      swipedPixels.push(...this.dataLayer.deleteColumn(columnIndex));
    }
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
          const previousColor = data
            .get(rowIndex + i - brushPatternCenterRowIndex)
            ?.get(columnIndex + j - brushPatternCenterColumnIndex)?.color;
          interactionLayer.addToStrokePixelRecords(CurrentDeviceUserId, {
            rowIndex: rowIndex + i - brushPatternCenterRowIndex,
            columnIndex: columnIndex + j - brushPatternCenterColumnIndex,
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
        const changeAmounts: Array<{
          direction:
            | ButtonDirection.TOP
            | ButtonDirection.BOTTOM
            | ButtonDirection.LEFT
            | ButtonDirection.RIGHT;
          amount: number;
          startIndex: number;
        }> = [];
        if (topRowDiff < 0) {
          const amount = -topRowDiff;
          const { addedRowIndices } = this.dataLayer.extendGridBy(
            ButtonDirection.TOP,
            amount,
            dataGridIndices.topRowIndex,
          );
          changeAmounts.push({
            direction: ButtonDirection.TOP,
            amount: amount,
            startIndex: dataGridIndices.topRowIndex,
          });
          addedOrDeletedRows.push(
            ...addedRowIndices.map(index => ({
              index,
              isDelete: false,
            })),
          );
        } else if (topRowDiff > 0) {
          const amount = topRowDiff;
          const { deletedRowIndices } = this.dataLayer.shortenGridBy(
            ButtonDirection.TOP,
            amount,
            dataGridIndices.topRowIndex,
          );
          changeAmounts.push({
            direction: ButtonDirection.TOP,
            amount: -amount,
            startIndex: dataGridIndices.topRowIndex,
          });
          addedOrDeletedRows.push(
            ...deletedRowIndices.map(index => ({
              index,
              isDelete: true,
            })),
          );
        }
        if (leftColumnDiff < 0) {
          const amount = -leftColumnDiff;
          const { addedColumnIndices } = this.dataLayer.extendGridBy(
            ButtonDirection.LEFT,
            amount,
            dataGridIndices.leftColumnIndex,
          );
          changeAmounts.push({
            direction: ButtonDirection.LEFT,
            amount: amount,
            startIndex: dataGridIndices.leftColumnIndex,
          });
          addedOrDeletedColumns.push(
            ...addedColumnIndices.map(index => ({
              index,
              isDelete: false,
            })),
          );
        } else if (leftColumnDiff > 0) {
          const amount = leftColumnDiff;
          const { deletedColumnIndices } = this.dataLayer.shortenGridBy(
            ButtonDirection.LEFT,
            amount,
            dataGridIndices.leftColumnIndex,
          );
          changeAmounts.push({
            direction: ButtonDirection.LEFT,
            amount: -amount,
            startIndex: dataGridIndices.leftColumnIndex,
          });
          addedOrDeletedColumns.push(
            ...deletedColumnIndices.map(index => ({
              index,
              isDelete: true,
            })),
          );
        }
        if (bottomRowDiff > 0) {
          const amount = bottomRowDiff;
          const { addedRowIndices } = this.dataLayer.extendGridBy(
            ButtonDirection.BOTTOM,
            amount,
            dataGridIndices.bottomRowIndex,
          );

          changeAmounts.push({
            direction: ButtonDirection.BOTTOM,
            amount: amount,
            startIndex: dataGridIndices.bottomRowIndex,
          });
          addedOrDeletedRows.push(
            ...addedRowIndices.map(index => ({
              index,
              isDelete: false,
            })),
          );
        } else if (bottomRowDiff < 0) {
          const amount = -bottomRowDiff;
          const { deletedRowIndices } = this.dataLayer.shortenGridBy(
            ButtonDirection.BOTTOM,
            amount,
            dataGridIndices.bottomRowIndex,
          );
          changeAmounts.push({
            direction: ButtonDirection.BOTTOM,
            amount: -amount,
            startIndex: dataGridIndices.bottomRowIndex,
          });
          addedOrDeletedRows.push(
            ...deletedRowIndices.map(index => ({
              index,
              isDelete: true,
            })),
          );
        }
        if (rightColumnDiff > 0) {
          const amount = rightColumnDiff;
          const { addedColumnIndices } = this.dataLayer.extendGridBy(
            ButtonDirection.RIGHT,
            amount,
            dataGridIndices.rightColumnIndex,
          );
          changeAmounts.push({
            direction: ButtonDirection.RIGHT,
            amount: amount,
            startIndex: dataGridIndices.rightColumnIndex,
          });
          addedOrDeletedColumns.push(
            ...addedColumnIndices.map(index => ({
              index,
              isDelete: false,
            })),
          );
        } else if (rightColumnDiff < 0) {
          const amount = -rightColumnDiff;
          const { deletedColumnIndices } = this.dataLayer.shortenGridBy(
            ButtonDirection.RIGHT,
            amount,
            dataGridIndices.rightColumnIndex,
          );
          changeAmounts.push({
            direction: ButtonDirection.RIGHT,
            amount: -amount,
            startIndex: dataGridIndices.rightColumnIndex,
          });
          addedOrDeletedColumns.push(
            ...deletedColumnIndices.map(index => ({
              index,
              isDelete: true,
            })),
          );
        }

        if (changeAmounts.length !== 0) {
          this.recordSizeChangeAction(
            changeAmounts,
            this.dataLayer.getSwipedPixels(),
          );
          this.dataLayer.resetSwipedPixels();
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
   * @description records the action of the user interaction
   * @param changeAmounts the amount of change in each direction
   * @param deletedPixels the pixels that are deleted
   */
  recordSizeChangeAction(
    changeAmounts: Array<{
      direction:
        | ButtonDirection.TOP
        | ButtonDirection.BOTTOM
        | ButtonDirection.LEFT
        | ButtonDirection.RIGHT;
      amount: number;
      startIndex: number;
    }>,
    deletedPixels: Array<PixelModifyItem>,
  ) {
    this.recordAction(
      new SizeChangeAction(
        deletedPixels,
        changeAmounts,
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

      case ActionType.SizeChange:
        const sizeChangeAction = action as SizeChangeAction;
        for (let i = 0; i < sizeChangeAction.changeAmounts.length; i++) {
          const change = sizeChangeAction.changeAmounts[i];
          const isExtendAction = change.amount > 0;
          if (isExtendAction) {
            const { addedColumnIndices, addedRowIndices } =
              this.dataLayer.extendGridBy(
                change.direction,
                change.amount,
                change.startIndex,
              );
            addedOrDeletedColumns.push(
              ...addedColumnIndices.map(index => ({
                index,
                isDelete: false,
              })),
            );
            addedOrDeletedRows.push(
              ...addedRowIndices.map(index => ({
                index,
                isDelete: false,
              })),
            );
          } else {
            const { deletedColumnIndices, deletedRowIndices } =
              this.dataLayer.shortenGridBy(
                change.direction,
                -change.amount,
                change.startIndex,
              );
            addedOrDeletedColumns.push(
              ...deletedColumnIndices.map(index => ({
                index,
                isDelete: true,
              })),
            );
            addedOrDeletedRows.push(
              ...deletedRowIndices.map(index => ({
                index,
                isDelete: true,
              })),
            );
          }
          const sizeChangePixels = sizeChangeAction.data;
          this.dataLayer.updatePixelColors(sizeChangePixels, layerId);
          // add the modified pixels to the modifiedPixels array
          modifiedPixels.push(...sizeChangePixels);
        }
        break;

      case ActionType.ColorSizeChange:
        const colorSizeChangeAction = action as ColorSizeChangeAction;
        for (let i = 0; i < colorSizeChangeAction.changeAmounts.length; i++) {
          const change = colorSizeChangeAction.changeAmounts[i];
          const isExtendAction = change.amount > 0;
          if (isExtendAction) {
            const { addedColumnIndices, addedRowIndices } =
              this.dataLayer.extendGridBy(
                change.direction,
                change.amount,
                change.startIndex,
              );
            addedOrDeletedColumns.push(
              ...addedColumnIndices.map(index => ({
                index,
                isDelete: false,
              })),
            );
            addedOrDeletedRows.push(
              ...addedRowIndices.map(index => ({
                index,
                isDelete: false,
              })),
            );
          } else {
            const { deletedColumnIndices, deletedRowIndices } =
              this.dataLayer.shortenGridBy(
                change.direction,
                change.amount,
                change.startIndex,
              );
            addedOrDeletedColumns.push(
              ...deletedColumnIndices.map(index => ({
                index,
                isDelete: true,
              })),
            );
            addedOrDeletedRows.push(
              ...deletedRowIndices.map(index => ({
                index,
                isDelete: true,
              })),
            );
          }
        }
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
    const { changeAmounts, dataForAction } = this.dataLayer.colorPixels(
      data,
      layerId,
    );
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
      new ColorSizeChangeAction(dataForAction, changeAmounts, modifiedLayerId),
    );

    const addedTopRows = changeAmounts.filter(
      change => change.direction === ButtonDirection.TOP,
    );
    const addedRowIndices = new Set<number>();
    const addedBottomRows = changeAmounts.filter(
      change => change.direction === ButtonDirection.BOTTOM,
    );
    for (const change of addedTopRows) {
      for (let j = 0; j < change.amount; j++) {
        addedRowIndices.add(change.startIndex - 1 - j);
      }
    }
    for (const change of addedBottomRows) {
      for (let j = 0; j < change.amount; j++) {
        addedRowIndices.add(change.startIndex + 1 + j);
      }
    }

    const addedColumnIndices = new Set<number>();
    const addedLeftColumns = changeAmounts.filter(
      change => change.direction === ButtonDirection.LEFT,
    );
    const addedRightColumns = changeAmounts.filter(
      change => change.direction === ButtonDirection.RIGHT,
    );
    for (const change of addedLeftColumns) {
      for (let j = 0; j < change.amount; j++) {
        addedColumnIndices.add(change.startIndex - 1 - j);
      }
    }
    for (const change of addedRightColumns) {
      for (let j = 0; j < change.amount; j++) {
        addedColumnIndices.add(change.startIndex + 1 + j);
      }
    }

    this.emitDataChangeEvent({
      isLocalChange,
      data: this.dataLayer.getLayer(modifiedLayerId).getCopiedData(),
      layerId: modifiedLayerId,
      delta: {
        modifiedPixels: dataForAction,
        addedOrDeletedColumns: Array.from(addedColumnIndices).map(
          columnIndex => ({
            index: columnIndex,
            isDelete: false,
          }),
        ),
        addedOrDeletedRows: Array.from(addedRowIndices).map(rowIndex => ({
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
          const coloredPixels = this.getColoredPixelsInSelectedArea(
            previousSelectedArea,
            "",
          );
          this.interactionLayer.setExtendingSelectedArea(previousSelectedArea);
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
    } else {
      if (pixelIndex && this.brushTool !== BrushTool.NONE) {
        this.drawPixelInInteractionLayer(
          pixelIndex.rowIndex,
          pixelIndex.columnIndex,
          this.interactionLayer.getBrushPattern(),
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
    const { includedPixelsIndices } = convertWorldPosAreaToPixelGridArea(
      selectedArea,
      rowCount,
      columnCount,
      this.gridSquareLength,
      sortedRowKeys,
      sortedColumnKeys,
    );
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
              previousSelectedArea.endPixelIndex.columnIndex - pixelWiseDeltaX,
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
    this.mouseMode = MouseMode.PANNING;
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
    touchy(this.element, removeEvent, "mousemove", this.handlePanning);
    touchy(this.element, removeEvent, "mousemove", this.handlePinchZoom);
    touchy(this.element, removeEvent, "mousemove", this.handleExtension);
    this.pinchZoomDiff = undefined;
    this.gridLayer.setHoveredButton(null);
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
    touchy(this.element, removeEvent, "mousemove", this.handlePanning);
    touchy(this.element, removeEvent, "mousemove", this.handlePinchZoom);
    this.element.removeEventListener("wheel", this.handleWheel);
  }
}
