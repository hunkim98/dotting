import { Action } from "../../actions/Action";
import EventDispatcher from "../../utils/eventDispatcher";
import { getGridIndicesFromData } from "../../utils/data";
import { diffPoints } from "../../utils/math";
import {
  calculateNewPanZoomFromPinchZoom,
  getMouseCartCoord,
  getPixelIndexFromMouseCartCoord,
  getPointFromTouchyEvent,
} from "../../utils/position";
import Stack from "../../utils/stack";
import { TouchyEvent, addEvent, removeEvent, touchy } from "../../utils/touch";
import GridLayer from "./GridLayer";
import InteractionLayer from "./InteractionLayer";
import {
  DefaultGridSquareLength,
  DefaultMaxScale,
  DefaultMinScale,
  DefaultZoomSensitivity,
  MouseMode,
  ButtonDirection,
  CurrentDeviceUserId,
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
import { HoverPixelListener } from "../../../stories/useHandlersComponents";
import { SizeChangeAction } from "../../actions/SizeChangeAction";
import { ColorChangeAction } from "../../actions/ColorChangeAction";

export default class Editor extends EventDispatcher {
  private gridLayer: GridLayer;
  private interactionLayer: InteractionLayer;
  private dataLayer: DataLayer;
  private zoomSensitivity: number = DefaultZoomSensitivity;
  private maxScale: number = DefaultMaxScale;
  private minScale: number = DefaultMinScale;
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

  styleMouseCursor = () => {
    const element = this.interactionLayer.getElement();
    if (
      this.mouseMode !== MouseMode.PANNING &&
      this.mouseMode !== MouseMode.EXTENDING
    ) {
      element.style.cursor = `url("/cursor/${this.mouseMode}.cur"), auto`;
    } else {
      element.style.cursor = `default`;
    }
  };

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

  setWidth(width: number, devicePixelRatio?: number) {
    this.width = width;
    this.dataLayer.setWidth(width, devicePixelRatio);
    this.gridLayer.setWidth(width, devicePixelRatio);
    this.interactionLayer.setWidth(width, devicePixelRatio);
  }

  setHeight(height: number, devicePixelRatio?: number) {
    this.height = height;
    this.dataLayer.setHeight(height, devicePixelRatio);
    this.gridLayer.setHeight(height, devicePixelRatio);
    this.interactionLayer.setHeight(height, devicePixelRatio);
  }

  getWidth() {
    return this.width;
  }

  getHeight() {
    return this.height;
  }

  setSize(width: number, height: number, devicePixelRatio?: number) {
    this.setWidth(width, devicePixelRatio);
    this.setHeight(height, devicePixelRatio);
    this.dpr = devicePixelRatio ? devicePixelRatio : this.dpr;
  }

  setDpr(dpr: number) {
    this.dpr = dpr;
    this.dataLayer.setDpr(dpr);
    this.gridLayer.setDpr(dpr);
    this.interactionLayer.setDpr(dpr);
  }

  setPanZoom({ offset, scale }: Partial<PanZoom>) {
    if (scale) {
      this.panZoom.scale = scale;
    }
    if (offset) {
      const correctedOffset = { ...offset };
      const columnCount = this.dataLayer.getColumnCount();
      const rowCount = this.dataLayer.getRowCount();

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
    this.dataLayer.setPanZoom(this.panZoom);
    this.gridLayer.setPanZoom(this.panZoom);
    this.interactionLayer.setPanZoom(this.panZoom);
    // we must render all when panzoom changes!
    this.renderAll();
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
  extendGridBy(direction: ButtonDirection, amount: number, startIndex: number) {
    const shouldIncreaseIndex =
      direction === ButtonDirection.BOTTOM ||
      direction === ButtonDirection.RIGHT;
    for (let i = 0; i < amount; i++) {
      const index = startIndex + (shouldIncreaseIndex ? i : -i);
      this.dataLayer.extendGrid(direction, index);
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
  shortenGridBy(
    direction: ButtonDirection,
    amount: number,
    startIndex: number,
  ) {
    const shouldIncreaseIndex =
      direction === ButtonDirection.TOP || direction === ButtonDirection.LEFT;
    for (let i = 0; i < amount; i++) {
      const index = startIndex + (shouldIncreaseIndex ? i : -i);
      this.dataLayer.shortenGrid(direction, index);
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

  // adding to undo stack is handled here(only for single player mode)
  // 1. colorChangeAction
  // 2. sizeChangeAction
  private relayInteractionDataToDataLayer() {
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
        // record single player mode color change action
        this.recordInteractionColorChangeAction(pixelModifyItems);
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
        const swipedPixels = interactionLayer.getSwipedPixels();
        let deletedPixels = [];
        let amount = 0;
        let direction: ButtonDirection | null = null;
        let startIndex = 0;
        let isExtendGrid = false;
        if (topRowDiff > 0) {
          this.extendGridBy(
            ButtonDirection.TOP,
            topRowDiff,
            dataGridIndices.topRowIndex,
          );
          isExtendGrid = true;
          amount = topRowDiff;
          direction = ButtonDirection.TOP;
          startIndex = dataGridIndices.topRowIndex;
        } else if (topRowDiff < 0) {
          this.shortenGridBy(
            ButtonDirection.TOP,
            -topRowDiff,
            dataGridIndices.topRowIndex,
          );
          isExtendGrid = false;
          amount = -topRowDiff;
          direction = ButtonDirection.TOP;
          startIndex = dataGridIndices.topRowIndex;
          deletedPixels = swipedPixels.filter(
            pixel => pixel.rowIndex <= startIndex + amount - 1,
          );
        }
        if (leftColumnDiff > 0) {
          this.extendGridBy(
            ButtonDirection.LEFT,
            leftColumnDiff,
            dataGridIndices.leftColumnIndex,
          );
          isExtendGrid = true;
          amount = leftColumnDiff;
          direction = ButtonDirection.LEFT;
          startIndex = dataGridIndices.leftColumnIndex;
        } else if (leftColumnDiff < 0) {
          this.shortenGridBy(
            ButtonDirection.LEFT,
            -leftColumnDiff,
            dataGridIndices.leftColumnIndex,
          );
          isExtendGrid = false;
          amount = -leftColumnDiff;
          direction = ButtonDirection.LEFT;
          startIndex = dataGridIndices.leftColumnIndex;
          deletedPixels = swipedPixels.filter(
            pixel => pixel.columnIndex <= startIndex + amount - 1,
          );
        }
        if (bottomRowDiff > 0) {
          this.extendGridBy(
            ButtonDirection.BOTTOM,
            bottomRowDiff,
            dataGridIndices.bottomRowIndex,
          );
          isExtendGrid = true;
          amount = bottomRowDiff;
          direction = ButtonDirection.BOTTOM;
          startIndex = dataGridIndices.bottomRowIndex;
        } else if (bottomRowDiff < 0) {
          this.shortenGridBy(
            ButtonDirection.BOTTOM,
            -bottomRowDiff,
            dataGridIndices.bottomRowIndex,
          );
          isExtendGrid = false;
          amount = -bottomRowDiff;
          direction = ButtonDirection.BOTTOM;
          startIndex = dataGridIndices.bottomRowIndex;
          deletedPixels = swipedPixels.filter(
            pixel => pixel.rowIndex >= startIndex - amount + 1,
          );
        }
        if (rightColumnDiff > 0) {
          this.extendGridBy(
            ButtonDirection.RIGHT,
            rightColumnDiff,
            dataGridIndices.rightColumnIndex,
          );
          isExtendGrid = true;
          amount = rightColumnDiff;
          direction = ButtonDirection.RIGHT;
          startIndex = dataGridIndices.rightColumnIndex;
        } else if (rightColumnDiff < 0) {
          this.shortenGridBy(
            ButtonDirection.RIGHT,
            -rightColumnDiff,
            dataGridIndices.rightColumnIndex,
          );
          isExtendGrid = false;
          amount = -rightColumnDiff;
          direction = ButtonDirection.RIGHT;
          startIndex = dataGridIndices.rightColumnIndex;
          deletedPixels = swipedPixels.filter(
            pixel => pixel.columnIndex >= startIndex - amount + 1,
          );
        }
        if (direction) {
          this.recordInteractionSizeChangeAction(
            direction,
            deletedPixels,
            amount,
            startIndex,
          );
        }
      }
      interactionLayer.resetCapturedData();
      // deletes the records of the current user
      interactionLayer.deleteErasedPixelRecord(CurrentDeviceUserId);
      interactionLayer.deleteStrokePixelRecord(CurrentDeviceUserId);
    }
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
      this.extendGridBy(
        ButtonDirection.TOP,
        amount,
        currentCanvasIndices.topRowIndex,
      );
      changeAmounts.push({
        direction: ButtonDirection.TOP,
        amount,
      });
    }
    if (maxRowIndex > currentCanvasIndices.bottomRowIndex) {
      const amount = maxRowIndex - currentCanvasIndices.bottomRowIndex;
      this.extendGridBy(
        ButtonDirection.BOTTOM,
        amount,
        currentCanvasIndices.bottomRowIndex,
      );
      changeAmounts.push({
        direction: ButtonDirection.BOTTOM,
        amount,
      });
    }
    if (minColumnIndex < currentCanvasIndices.leftColumnIndex) {
      const amount = currentCanvasIndices.leftColumnIndex - minColumnIndex;
      this.extendGridBy(
        ButtonDirection.LEFT,
        amount,
        currentCanvasIndices.leftColumnIndex,
      );
      changeAmounts.push({
        direction: ButtonDirection.LEFT,
        amount,
      });
    }
    if (maxColumnIndex > currentCanvasIndices.rightColumnIndex) {
      const amount = maxColumnIndex - currentCanvasIndices.rightColumnIndex;
      this.extendGridBy(
        ButtonDirection.RIGHT,
        amount,
        currentCanvasIndices.rightColumnIndex,
      );
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
        this.mouseMode = MouseMode.EXTENDING;
        touchy(element, addEvent, "mousemove", this.handleExtension);
      }
    }

    if (this.mouseMode === MouseMode.PANNING) {
      touchy(element, addEvent, "mousemove", this.handlePanning);
      touchy(element, addEvent, "mousemove", this.handlePinchZoom);
    }
  }

  onMouseMove(evt: TouchyEvent) {
    evt.preventDefault();
    const element = this.getInteractionLayer().getElement();
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
    const hoveredPixel = this.getInteractionLayer().getHoveredPixel();
    if (pixelIndex) {
      if (this.mouseMode === MouseMode.DOT) {
        this.drawPixelInInteractionLayer(
          pixelIndex.rowIndex,
          pixelIndex.columnIndex,
        );
      } else {
        if (
          // We should also consider when the hovered pixel is null
          !hoveredPixel ||
          hoveredPixel.rowIndex !== pixelIndex.rowIndex ||
          hoveredPixel.columnIndex !== pixelIndex.columnIndex
        ) {
          this.emit(CanvasEvents.HOVER_PIXEL_CHANGE, pixelIndex);
        }
        this.getInteractionLayer().setHoveredPixel(pixelIndex);
        this.renderInteractionLayer();
      }
    } else {
      if (hoveredPixel !== null) {
        this.emit(CanvasEvents.HOVER_PIXEL_CHANGE, null);
        this.getInteractionLayer().setHoveredPixel(null);
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

  onMouseUp(evt: TouchEvent) {
    this.relayInteractionDataToDataLayer();
    return;
  }

  onMouseOut(evt: TouchEvent) {
    this.relayInteractionDataToDataLayer();
    return;
  }

  removePanListeners() {
    const element = this.getInteractionLayer().getElement();
    touchy(element, removeEvent, "mousemove", this.handlePanning);
    touchy(element, removeEvent, "mousemove", this.handlePinchZoom);
  }

  renderGridLayer() {
    return;
  }

  clear() {
    const rowCount = this.getRowCount();
    const columnCount = this.getColumnCount();
    this.dataLayer.setData(new Map());
    const data = this.dataLayer.getData();
    for (let i = 0; i < rowCount; i++) {
      data.set(i, new Map());
      for (let j = 0; j < columnCount; j++) {
        data.get(i)!.set(j, { color: "" });
      }
    }
    this.renderDataLayer();
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
