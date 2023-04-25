import { Action } from "../../actions/Action";
import EventDispatcher from "../../utils/eventDispatcher";
import {
  addColumnToData,
  addRowToData,
  deleteColumnOfData,
  deleteRowOfData,
  extractColoredPixelsFromColumn,
  extractColoredPixelsFromRow,
  getColumnCountFromData,
  getGridIndicesFromData,
  getRowCountFromData,
} from "../../utils/data";
import { diffPoints } from "../../utils/math";
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
  MouseMode,
  ButtonDirection,
  CurrentDeviceUserId,
  UserId,
} from "./config";
import {
  BrushMode,
  CanvasEvents,
  ColorChangeItem,
  Coord,
  DottingData,
  GridIndices,
  PanZoom,
  PixelData,
  PixelModifyItem,
} from "./types";
import { isValidIndicesRange } from "../../utils/validation";
import Queue from "../../utils/queue";
import { Indices } from "../../utils/types";
import { ColorSizeChangeAction } from "../../actions/ColorSizeChangeAction";
import DataLayer from "./DataLayer";

export default class Editor extends EventDispatcher {
  private gridLayer: GridLayer;
  private interactionLayer: InteractionLayer;
  private dataLayer: DataLayer;
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
  private brushColor = "#FF0000";
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
  private isPanZoomable = true;
  private mouseMode: MouseMode = MouseMode.DOT;
  // TODO: why do we need this? For games?
  private isInteractionEnabled = true;
  // We need isInteractionApplicable to allow multiplayer
  // We must let yorkie-js-sdk to apply change to data layer not the client
  private isInteractionApplicable = true;

  constructor(
    gridCanvas: HTMLCanvasElement,
    interactionCanvas: HTMLCanvasElement,
    dataCanvas: HTMLCanvasElement,
    initData?: Array<Array<PixelData>>,
  ) {
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
      canvas: interactionCanvas,
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

  setIsInteractionEnabled(isInteractionEnabled: boolean) {
    this.isInteractionEnabled = isInteractionEnabled;
  }

  setIsInteractionApplicable(isInteractionApplicable: boolean) {
    this.isInteractionApplicable = isInteractionApplicable;
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

  setPanZoom({ offset, scale }: Partial<PanZoom>) {
    if (offset) {
      this.panZoom.offset.x = offset.x;
      this.panZoom.offset.y = offset.y;
    }
    if (scale) {
      this.panZoom.scale = scale;
    }
  }

  handleExtension = (evt: TouchyEvent) => {
    evt.preventDefault();
    const element = this.getInteractionLayer().getElement();
    const minAmountForExtension = this.gridSquareLength / 2;
    if (window.TouchEvent && evt instanceof TouchEvent) {
      if (evt.touches.length > 1) {
        return;
      }
    }
    const mouseCartCoord = getMouseCartCoord(
      evt,
      element,
      this.panZoom,
      this.dpr,
    );
    const buttonDirection = this.extensionPoint.direction;
    const extensionAmount = diffPoints(
      this.extensionPoint.lastMousePos,
      mouseCartCoord,
    );

    if (buttonDirection) {
      switch (buttonDirection) {
        case ButtonDirection.TOP:
          if (extensionAmount.y > minAmountForExtension) {
            this.extendInteractionGrid(ButtonDirection.TOP);
            this.extensionPoint.lastMousePos.y -= this.gridSquareLength / 2;
          } else if (extensionAmount.y < -minAmountForExtension) {
            this.shortenInteractionGrid(ButtonDirection.TOP);
            this.extensionPoint.lastMousePos.y += this.gridSquareLength / 2;
          }
          break;
        case ButtonDirection.BOTTOM:
          if (extensionAmount.y < -minAmountForExtension) {
            this.extendInteractionGrid(ButtonDirection.BOTTOM);
            this.extensionPoint.lastMousePos.y += this.gridSquareLength / 2;
          } else if (extensionAmount.y > minAmountForExtension) {
            this.shortenInteractionGrid(ButtonDirection.TOP);
            this.extensionPoint.lastMousePos.y -= this.gridSquareLength / 2;
          }
          break;
        case ButtonDirection.LEFT:
          if (extensionAmount.x > minAmountForExtension) {
            this.extendInteractionGrid(ButtonDirection.LEFT);
            this.extensionPoint.lastMousePos.x -= this.gridSquareLength / 2;
          } else if (extensionAmount.x < -minAmountForExtension) {
            this.shortenInteractionGrid(ButtonDirection.LEFT);
            this.extensionPoint.lastMousePos.x += this.gridSquareLength / 2;
          }
          break;
        case ButtonDirection.RIGHT:
          if (extensionAmount.x < -minAmountForExtension) {
            this.extendInteractionGrid(ButtonDirection.RIGHT);
            this.extensionPoint.lastMousePos.x += this.gridSquareLength / 2;
          } else if (extensionAmount.x > minAmountForExtension) {
            this.shortenInteractionGrid(ButtonDirection.RIGHT);
            this.extensionPoint.lastMousePos.x -= this.gridSquareLength / 2;
          }
          break;
      }
      this.renderAll();
    }
  };

  // this extend grid in the real layer.
  // This should not be called with mouse events
  extendGridBy(direction: ButtonDirection, amount: number) {
    for (let i = 0; i < amount; i++) {
      this.dataLayer.extendGrid(direction);
    }
    const dimensions = this.dataLayer.getDimensions();
    const indices = this.dataLayer.getGridIndices();
    this.emit(CanvasEvents.DATA_CHANGE, new Map(this.dataLayer.getData()));
    this.emit(CanvasEvents.GRID_CHANGE, dimensions, indices);
    this.renderAll();
  }

  // we have extend interaction grid inside editor because we must change the panzoom too
  private extendInteractionGrid(direction: ButtonDirection) {
    const interactionLayer = this.getInteractionLayer();
    const interactionCapturedData = interactionLayer.getCapturedData();
    if (!interactionCapturedData) {
      // we will copy the data to interaction layer
      interactionLayer.setCapturedData(new Map(this.dataLayer.getData()));
    }
    interactionLayer.extendCapturedData(direction);
    if (direction === ButtonDirection.TOP) {
      this.setPanZoom({
        offset: {
          x: this.panZoom.offset.x,
          y:
            this.panZoom.offset.y -
            (this.gridSquareLength / 2) * this.panZoom.scale,
        },
      });
    } else if (direction === ButtonDirection.BOTTOM) {
      this.setPanZoom({
        offset: {
          x: this.panZoom.offset.x,
          y:
            this.panZoom.offset.y +
            (this.gridSquareLength / 2) * this.panZoom.scale,
        },
      });
    } else if (direction === ButtonDirection.LEFT) {
      this.setPanZoom({
        offset: {
          x:
            this.panZoom.offset.x -
            (this.gridSquareLength / 2) * this.panZoom.scale,
          y: this.panZoom.offset.y,
        },
      });
    } else if (direction === ButtonDirection.RIGHT) {
      this.setPanZoom({
        offset: {
          x:
            this.panZoom.offset.x +
            (this.gridSquareLength / 2) * this.panZoom.scale,
          y: this.panZoom.offset.y,
        },
      });
    }
  }

  // we have extend interaction grid inside editor because we must change the panzoom too
  private shortenInteractionGrid(direction: ButtonDirection) {
    const interactionLayer = this.getInteractionLayer();
    const interactionCapturedData = interactionLayer.getCapturedData();
    if (!interactionCapturedData) {
      // we will copy the data to interaction layer
      interactionLayer.setCapturedData(new Map(this.dataLayer.getData()));
    }
    interactionLayer.shortenCapturedData(direction);
    if (direction === ButtonDirection.TOP) {
      this.setPanZoom({
        offset: {
          x: this.panZoom.offset.x,
          y:
            this.panZoom.offset.y -
            (this.gridSquareLength / 2) * this.panZoom.scale,
        },
      });
    } else if (direction === ButtonDirection.BOTTOM) {
      this.setPanZoom({
        offset: {
          x: this.panZoom.offset.x,
          y:
            this.panZoom.offset.y +
            (this.gridSquareLength / 2) * this.panZoom.scale,
        },
      });
    } else if (direction === ButtonDirection.LEFT) {
      this.setPanZoom({
        offset: {
          x:
            this.panZoom.offset.x -
            (this.gridSquareLength / 2) * this.panZoom.scale,
          y: this.panZoom.offset.y,
        },
      });
    } else if (direction === ButtonDirection.RIGHT) {
      this.setPanZoom({
        offset: {
          x:
            this.panZoom.offset.x +
            (this.gridSquareLength / 2) * this.panZoom.scale,
          y: this.panZoom.offset.y,
        },
      });
    }
  }

  // This should not be called by mouse events
  shortenGridBy(direction: ButtonDirection, amount: number) {
    for (let i = 0; i < amount; i++) {
      this.dataLayer.shortenGrid(direction);
    }
    const dimensions = this.dataLayer.getDimensions();
    const indices = this.dataLayer.getGridIndices();
    this.emit(CanvasEvents.DATA_CHANGE, new Map(this.dataLayer.getData()));
    this.emit(CanvasEvents.GRID_CHANGE, dimensions, indices);
    this.renderAll();
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

  handlePanning = (evt: TouchyEvent) => {
    if (!this.isPanZoomable) {
      return;
    }
    const element = this.getInteractionLayer().getElement();
    const lastMousePos = this.panPoint.lastMousePos;
    if (window.TouchEvent && evt instanceof TouchEvent) {
      if (evt.touches.length > 1) {
        return;
      }
    }
    const point = getPointFromTouchyEvent(evt, element, this.panZoom);
    const currentMousePos: Coord = { x: point.offsetX, y: point.offsetY };
    this.panPoint.lastMousePos = currentMousePos;
    const mouseDiff = diffPoints(lastMousePos, currentMousePos);
    const offset = diffPoints(this.panZoom.offset, mouseDiff);
    this.setPanZoom({ offset });
    return;
  };

  // this will be only used by the current device user
  private drawPixelInInteractionLayer(rowIndex: number, columnIndex: number) {
    const interactionLayer = this.getInteractionLayer();
    const data = this.dataLayer.getData();
    if (this.mouseMode === MouseMode.ERASER) {
      const previousColor = data.get(rowIndex)?.get(columnIndex).color;
      interactionLayer.addToErasedPixelRecords(CurrentDeviceUserId, {
        rowIndex,
        columnIndex,
        color: "",
        previousColor,
      });
    } else if (this.mouseMode === MouseMode.DOT) {
      const previousColor = data.get(rowIndex)?.get(columnIndex).color;
      interactionLayer.addToStrokePixelRecords(CurrentDeviceUserId, {
        rowIndex,
        columnIndex,
        color: this.brushColor,
        previousColor,
      });
    } else if (this.mouseMode === MouseMode.PAINT_BUCKET) {
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

  private passCurrentUserInteractionToDataLayer() {
    const interactionLayer = this.getInteractionLayer();
    // if isInteractionApplication is false, the below logic should be done by the user
    if (this.isInteractionApplicable) {
      const strokePixelRecords = interactionLayer.getStrokedPixelRecords();
      const strokedPixelModifyItems = strokePixelRecords
        .get(CurrentDeviceUserId)
        .getEffectiveChanges();
      const erasedPixelRecords = interactionLayer.getErasedPixelRecords();
      const erasedPixelModifyItems = erasedPixelRecords
        .get(CurrentDeviceUserId)
        .getEffectiveChanges();
      const pixelModifyItems = [
        ...strokedPixelModifyItems,
        ...erasedPixelModifyItems,
      ];
      if (pixelModifyItems.length !== 0) {
        this.colorPixelInDataLayer(pixelModifyItems);
      }

      const capturedData = interactionLayer.getCapturedData();
      // if there is capturedData, it means that the user has changed the dimension
      if (capturedData) {
        const interactionGridIndices = getGridIndicesFromData(capturedData);
        const dataGridIndices = this.dataLayer.getGridIndices();
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
        if (topRowDiff > 0) {
          this.extendGridBy(ButtonDirection.TOP, topRowDiff);
        } else if (topRowDiff < 0) {
          this.shortenGridBy(ButtonDirection.TOP, -topRowDiff);
        }
        if (leftColumnDiff > 0) {
          this.extendGridBy(ButtonDirection.LEFT, leftColumnDiff);
        } else if (leftColumnDiff < 0) {
          this.shortenGridBy(ButtonDirection.LEFT, -leftColumnDiff);
        }
        if (bottomRowDiff > 0) {
          this.extendGridBy(ButtonDirection.BOTTOM, bottomRowDiff);
        } else if (bottomRowDiff < 0) {
          this.shortenGridBy(ButtonDirection.BOTTOM, -bottomRowDiff);
        }
        if (rightColumnDiff > 0) {
          this.extendGridBy(ButtonDirection.RIGHT, rightColumnDiff);
        } else if (rightColumnDiff < 0) {
          this.shortenGridBy(ButtonDirection.RIGHT, -rightColumnDiff);
        }
      }
      // deletes the records of the current user
      interactionLayer.deleteErasedPixelRecord(CurrentDeviceUserId);
      interactionLayer.deleteStrokePixelRecord(CurrentDeviceUserId);
    }
  }

  recordAction(action: Action) {
    this.undoHistory.push(action);
    this.redoHistory.clear();
  }

  private colorPixelInDataLayer(data: Array<PixelModifyItem>) {
    const rowIndices = data.map(change => change.rowIndex);
    const columnIndices = data.map(change => change.columnIndex);
    const minRowIndex = Math.min(...rowIndices);
    const maxRowIndex = Math.max(...rowIndices);
    const minColumnIndex = Math.min(...columnIndices);
    const maxColumnIndex = Math.max(...columnIndices);
    const currentCanvasIndices = this.getGridIndices();
    const changeAmounts = [];
    if (minRowIndex < currentCanvasIndices.topRowIndex) {
      const amount = currentCanvasIndices.topRowIndex - minRowIndex;
      this.extendGridBy(ButtonDirection.TOP, amount);
      changeAmounts.push({
        direction: ButtonDirection.TOP,
        amount,
      });
    }
    if (maxRowIndex > currentCanvasIndices.bottomRowIndex) {
      const amount = maxRowIndex - currentCanvasIndices.bottomRowIndex;
      this.extendGridBy(ButtonDirection.BOTTOM, amount);
      changeAmounts.push({
        direction: ButtonDirection.BOTTOM,
        amount,
      });
    }
    if (minColumnIndex < currentCanvasIndices.leftColumnIndex) {
      const amount = currentCanvasIndices.leftColumnIndex - minColumnIndex;
      this.extendGridBy(ButtonDirection.LEFT, amount);
      changeAmounts.push({
        direction: ButtonDirection.LEFT,
        amount,
      });
    }
    if (maxColumnIndex > currentCanvasIndices.rightColumnIndex) {
      const amount = maxColumnIndex - currentCanvasIndices.rightColumnIndex;
      this.extendGridBy(ButtonDirection.RIGHT, amount);
      changeAmounts.push({
        direction: ButtonDirection.RIGHT,
        amount,
      });
    }
    const dataForAction = [];
    for (const change of data) {
      const previousColor = this.dataLayer
        .getData()
        .get(change.rowIndex)!
        .get(change.columnIndex)!.color;
      const color = change.color;

      this.dataLayer
        .getData()
        .get(change.rowIndex)!
        .set(change.columnIndex, { color: change.color });
      dataForAction.push({ ...change, color, previousColor });
    }
    this.recordAction(new ColorSizeChangeAction(dataForAction, changeAmounts));
    this.emit(CanvasEvents.DATA_CHANGE, new Map(this.dataLayer.getData()));
    return;
  }

  // this will be only used by the current device user
  private paintSameColorRegion(
    initialColor: string,
    gridIndices: Indices,
    currentIndices: { rowIndex: number; columnIndex: number },
  ): void {
    const interactionLayer = this.getInteractionLayer();
    const indicesQueue = new Queue<{
      rowIndex: number;
      columnIndex: number;
    }>();
    indicesQueue.enqueue(currentIndices);
    const data = this.dataLayer.getData();

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
    const element = this.getInteractionLayer().getElement();
    const point = getPointFromTouchyEvent(evt, element, this.panZoom);
    this.panPoint.lastMousePos = { x: point.offsetX, y: point.offsetY };

    const mouseCartCoord = getMouseCartCoord(
      evt,
      element,
      this.panZoom,
      this.dpr,
    );
    const gridIndices = this.dataLayer.getGridIndices();
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
      this.drawPixelInInteractionLayer(
        pixelIndex.rowIndex,
        pixelIndex.columnIndex,
      );
    }
    this.mouseMode = pixelIndex ? MouseMode.DOT : MouseMode.PANNING;
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
        touchy(element, addEvent, "mousemove", this.handleExtension);
      }
    }

    if (this.mouseMode === MouseMode.PANNING) {
      touchy(element, addEvent, "mousemove", this.handlePanning);
      touchy(element, addEvent, "mousemove", this.handlePinchZoom);
    }
  }

  onMouseMove(evt: TouchEvent) {
    return;
  }

  onMouseUp(evt: TouchEvent) {
    this.passCurrentUserInteractionToDataLayer();
    return;
  }

  onMouseOut(evt: TouchEvent) {
    this.passCurrentUserInteractionToDataLayer();
    return;
  }

  renderGridLayer() {
    return;
  }

  renderAll() {
    this.renderGridLayer();
    this.renderDataLayer();
    this.renderInteractionLayer();
  }

  renderDataLayer() {
    return;
  }

  renderInteractionLayer() {
    return;
  }
}
