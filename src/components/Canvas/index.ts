import {
  addPoints,
  convertCartesianToScreen,
  diffPoints,
  directionPoints,
  distPoints,
  getScreenPoint,
  getWorldPoint,
  gradientPoints,
} from "../../utils/math";
import Queue from "../../utils/queue";
import EventDispatcher from "../../utils/eventDispatcher";
import {
  BrushMode,
  CanvasEvents,
  Coord,
  DottingData,
  ImageDownloadOptions,
  PanZoom,
  PixelData,
  PixelModifyItem,
} from "./types";
import { Indices } from "../../utils/types";
import { isValidIndicesRange } from "../../utils/validation";
import { addEvent, removeEvent, touchy, TouchyEvent } from "../../utils/touch";

export enum MouseMode {
  DRAWING = "DRAWING",
  PANNING = "PANNING",
  EXTENDING = "EXTENDING",
  NULL = "NULL",
}

export enum ButtonDirection {
  TOP = "TOP",
  BOTTOM = "BOTTOM",
  LEFT = "LEFT",
  RIGHT = "RIGHT",
  NULL = "NULL",
}

export default class Canvas extends EventDispatcher {
  private MAX_SCALE = 1.5;

  private MIN_SCALE = 0.3;

  private ZOOM_SENSITIVITY = 200;

  private buttonHeight: number = 20;

  private buttonMargin: number = this.buttonHeight / 2 + 5;

  private element: HTMLCanvasElement;

  private gridSquareLength: number = 20;

  private origin = { x: 0, y: 0 };

  private pinchZoomPrevDiff = 0;

  private checkerboard: boolean;

  private checkerboardColor: React.CSSProperties["color"];

  private checkerboardAlpha: number;

  private isPanZoomable: boolean;

  private isGridFixed: boolean;

  private gridStrokeColor: string;

  private gridStrokeWidth: number;

  private isGridVisible: boolean;

  private strokedPixels: Array<PixelModifyItem> = [];

  private indicatorPixels: Array<PixelModifyItem> = [];

  private mouseMode: MouseMode = MouseMode.NULL;

  private hoveredButton: ButtonDirection | null = null;

  private brushColor: string;

  private brushMode: BrushMode = BrushMode.DOT;

  private data: DottingData = new Map<
    // this number is rowIndex
    number,
    Map<
      // this number is columnIndex
      number,
      PixelData
    >
  >();

  private hoveredPixel: {
    rowIndex: number;
    columnIndex: number;
  } | null = null;

  private panZoom: PanZoom = {
    scale: 1,
    offset: this.origin,
  };

  private panPoint: { lastMousePos: Coord } = {
    lastMousePos: this.origin,
  };

  private extensionPoint: {
    lastMousePos: Coord;
    direction: ButtonDirection | null;
  } = {
    lastMousePos: this.origin,
    direction: null,
  };

  private width = 0;

  private height = 0;

  private dpr = 1;

  private ctx: CanvasRenderingContext2D;

  constructor(
    canvas: HTMLCanvasElement,
    initData?: Array<Array<PixelData>>,
    checkerboard?: boolean,
    checkerboardColor?: React.CSSProperties["color"],
    checkerboardAlpha?: number,
    isPanZoomable?: boolean,
    gridStrokeColor?: string,
    gridStrokeWidth?: number,
    isGridVisible?: boolean,
    isGridFixed?: boolean,
    initBrushColor?: string,
    initIndicatorData?: Array<PixelModifyItem>
  ) {
    super();

    this.element = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.checkerboard = checkerboard ? checkerboard : false;
    this.checkerboardColor = checkerboardColor ? checkerboardColor : "#E1DFE1";
    this.checkerboardAlpha = checkerboardAlpha
      ? checkerboardAlpha >= 1
        ? 1
        : checkerboardAlpha < 0
        ? 0
        : checkerboardAlpha
      : 1;
    this.isPanZoomable = isPanZoomable ? isPanZoomable : true;
    this.isGridFixed = isGridFixed ? isGridFixed : false;
    this.gridStrokeColor = gridStrokeColor ? gridStrokeColor : "#000";
    this.gridStrokeWidth = gridStrokeWidth ? gridStrokeWidth : 1;
    this.isGridVisible = isGridVisible ? isGridVisible : true;
    this.brushColor = initBrushColor ? initBrushColor : "#FF0000";
    this.indicatorPixels = initIndicatorData ? initIndicatorData : [];

    let isInitDataValid = true;
    if (initData) {
      const initRowCount = initData.length;
      if (initRowCount < 2) {
        isInitDataValid = false;
      } else {
        const initColumnCount = initData[0].length;
        if (initColumnCount < 2) {
          isInitDataValid = false;
        } else {
          for (let i = 0; i < initRowCount; i++) {
            if (initData[i].length !== initColumnCount) {
              isInitDataValid = false;
              break;
            }
          }
        }
      }
    }

    // we will apply the initData only when the rowCount and columnCount are valid
    this.initialize(isInitDataValid ? initData : undefined);
  }

  setCanvasData(data: DottingData) {
    this.data = data;
    this.render();
  }

  setIndicatorPixels(indicatorPixels: Array<PixelModifyItem>) {
    this.indicatorPixels = indicatorPixels;
    this.render();
  }

  setGridStrokeColor(gridStrokeColor: string) {
    if (gridStrokeColor !== "" || gridStrokeColor !== undefined) {
      this.gridStrokeColor = gridStrokeColor;
    }
    this.render();
  }

  setGridStrokeWidth(gridStrokeWidth: number) {
    if (gridStrokeWidth !== 0 || gridStrokeWidth !== undefined) {
      this.gridStrokeWidth = gridStrokeWidth;
    }
    this.render();
  }

  setIsGridVisible(isGridVisible: boolean) {
    if (isGridVisible !== undefined) {
      this.isGridVisible = isGridVisible;
    }
    this.render();
  }

  setIsGridFixed(isGridFixed: boolean) {
    if (isGridFixed !== undefined) {
      this.isGridFixed = isGridFixed;
    }
    this.render();
  }

  setIsPanZoomable(isPanZoomable: boolean) {
    if (isPanZoomable !== undefined) {
      this.isPanZoomable = isPanZoomable;
    }
  }

  //http://jsfiddle.net/dX9Y3/

  detectMouseOnButton(coord: Coord): ButtonDirection | null {
    const gridsHeight = this.gridSquareLength * this.getRowCount();
    const gridsWidth = this.gridSquareLength * this.getColumnCount();
    const topButtonPos: Coord = {
      x: -gridsWidth / 2,
      y: -gridsHeight / 2 - this.buttonMargin - this.buttonHeight / 2,
    };
    const bottomButtonPos: Coord = {
      x: -gridsWidth / 2,
      y: gridsHeight / 2 + this.buttonMargin - this.buttonHeight / 2,
    };

    const leftButtonPos: Coord = {
      x: -gridsWidth / 2 - this.buttonMargin - this.buttonHeight / 2,
      y: -gridsHeight / 2,
    };

    const rightButtonPos: Coord = {
      x: gridsWidth / 2 + this.buttonMargin - this.buttonHeight / 2,
      y: -gridsHeight / 2,
    };

    const x = coord.x;
    const y = coord.y;
    const topButtonRect = {
      x: topButtonPos.x,
      y: topButtonPos.y,
      width: gridsWidth,
      height: this.buttonHeight,
    };
    const bottomButtonRect = {
      x: bottomButtonPos.x,
      y: bottomButtonPos.y,
      width: gridsWidth,
      height: this.buttonHeight,
    };
    const leftButtonRect = {
      x: leftButtonPos.x,
      y: leftButtonPos.y,
      width: this.buttonHeight,
      height: gridsHeight,
    };
    const rightButtonRect = {
      x: rightButtonPos.x,
      y: rightButtonPos.y,
      width: this.buttonHeight,
      height: gridsHeight,
    };

    if (
      x >= topButtonRect.x &&
      x <= topButtonRect.x + topButtonRect.width &&
      y >= topButtonRect.y &&
      y <= topButtonRect.y + topButtonRect.height
    ) {
      return ButtonDirection.TOP;
    } else if (
      x >= bottomButtonRect.x &&
      x <= bottomButtonRect.x + bottomButtonRect.width &&
      y >= bottomButtonRect.y &&
      y <= bottomButtonRect.y + bottomButtonRect.height
    ) {
      return ButtonDirection.BOTTOM;
    } else if (
      x >= leftButtonRect.x &&
      x <= leftButtonRect.x + leftButtonRect.width &&
      y >= leftButtonRect.y &&
      y <= leftButtonRect.y + leftButtonRect.height
    ) {
      return ButtonDirection.LEFT;
    } else if (
      x >= rightButtonRect.x &&
      x <= rightButtonRect.x + rightButtonRect.width &&
      y >= rightButtonRect.y &&
      y <= rightButtonRect.y + rightButtonRect.height
    ) {
      return ButtonDirection.RIGHT;
    } else {
      return null;
    }
  }

  detectButtonClicked(coord: Coord): ButtonDirection | null {
    return this.detectMouseOnButton(coord);
  }

  drawTopButton(opacity: number) {
    const gridsWidth = this.gridSquareLength * this.getColumnCount();
    const gridsHeight = this.gridSquareLength * this.getRowCount();

    const ctx = this.ctx;
    ctx.save();
    const buttonPos: Coord = {
      x: -gridsWidth / 2,
      y: -gridsHeight / 2 - this.buttonMargin,
    };
    let convertedScreenPoint = convertCartesianToScreen(
      this.element,
      buttonPos,
      this.dpr
    );
    const correctedScreenPoint = getScreenPoint(
      convertedScreenPoint,
      this.panZoom
    );
    ctx.fillStyle = "#E1DFE1";
    ctx.globalAlpha = opacity;
    ctx.fillRect(
      correctedScreenPoint.x,
      correctedScreenPoint.y - (this.buttonHeight / 2) * this.panZoom.scale,
      gridsWidth * this.panZoom.scale,
      this.buttonHeight * this.panZoom.scale
    );
    ctx.restore();
    this.drawArrowHead(
      ctx,
      correctedScreenPoint.x + (gridsWidth * this.panZoom.scale) / 2,
      correctedScreenPoint.y - (this.buttonHeight / 2) * this.panZoom.scale,
      Math.PI * 2,
      this.panZoom.scale,
      opacity
    );
    this.drawArrowHead(
      ctx,
      correctedScreenPoint.x + (gridsWidth * this.panZoom.scale) / 2,
      correctedScreenPoint.y + (this.buttonHeight / 2) * this.panZoom.scale,
      Math.PI,
      this.panZoom.scale,
      opacity
    );
  }

  drawBottomButton(opacity: number) {
    const ctx = this.ctx;
    ctx.save();
    const gridsWidth = this.gridSquareLength * this.getColumnCount();
    const gridsHeight = this.gridSquareLength * this.getRowCount();
    const buttonPos: Coord = {
      x: -gridsWidth / 2,
      y: gridsHeight / 2 + this.buttonMargin,
    };
    let convertedScreenPoint = convertCartesianToScreen(
      this.element,
      buttonPos,
      this.dpr
    );
    const correctedScreenPoint = getScreenPoint(
      convertedScreenPoint,
      this.panZoom
    );
    ctx.fillStyle = "#E1DFE1";
    ctx.globalAlpha = opacity;
    ctx.fillRect(
      correctedScreenPoint.x,
      correctedScreenPoint.y - (this.buttonHeight / 2) * this.panZoom.scale,
      gridsWidth * this.panZoom.scale,
      this.buttonHeight * this.panZoom.scale
    );
    ctx.restore();
    this.drawArrowHead(
      ctx,
      correctedScreenPoint.x + (gridsWidth * this.panZoom.scale) / 2,
      correctedScreenPoint.y - (this.buttonHeight / 2) * this.panZoom.scale,
      Math.PI * 2,
      this.panZoom.scale,
      opacity
    );
    this.drawArrowHead(
      ctx,
      correctedScreenPoint.x + (gridsWidth * this.panZoom.scale) / 2,
      correctedScreenPoint.y + (this.buttonHeight / 2) * this.panZoom.scale,
      Math.PI,
      this.panZoom.scale,
      opacity
    );
  }
  drawArrowHead(ctx, x, y, radians, scale, opacity) {
    ctx.save();
    ctx.beginPath();
    ctx.translate(x, y);
    ctx.rotate(radians);
    ctx.moveTo(0, 0);
    ctx.lineTo(10 * scale, 6 * scale);
    ctx.lineTo(-10 * scale, 6 * scale);
    ctx.closePath();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = "#bbbbbb";
    ctx.fill();
    ctx.restore();
  }

  drawLeftButton(opacity: number) {
    const ctx = this.ctx;

    ctx.save();
    const gridsWidth = this.gridSquareLength * this.getColumnCount();
    const gridsHeight = this.gridSquareLength * this.getRowCount();
    const buttonPos: Coord = {
      x: -gridsWidth / 2 - this.buttonMargin,
      y: -gridsHeight / 2,
    };
    let convertedScreenPoint = convertCartesianToScreen(
      this.element,
      buttonPos,
      this.dpr
    );
    const correctedScreenPoint = getScreenPoint(
      convertedScreenPoint,
      this.panZoom
    );

    ctx.fillStyle = "#E1DFE1";
    ctx.globalAlpha = opacity;
    ctx.fillRect(
      correctedScreenPoint.x - (this.buttonHeight / 2) * this.panZoom.scale,
      correctedScreenPoint.y,
      this.buttonHeight * this.panZoom.scale,
      gridsHeight * this.panZoom.scale
    );
    ctx.restore();
    this.drawArrowHead(
      ctx,
      correctedScreenPoint.x - (this.buttonHeight / 2) * this.panZoom.scale,
      correctedScreenPoint.y + (gridsHeight * this.panZoom.scale) / 2,
      -Math.PI / 2,
      this.panZoom.scale,
      opacity
    );
    this.drawArrowHead(
      ctx,
      correctedScreenPoint.x + (this.buttonHeight / 2) * this.panZoom.scale,
      correctedScreenPoint.y + (gridsHeight * this.panZoom.scale) / 2,
      Math.PI / 2,
      this.panZoom.scale,
      opacity
    );
  }

  drawRightButton(opacity: number) {
    const ctx = this.ctx;
    ctx.save();
    const gridsWidth = this.gridSquareLength * this.getColumnCount();
    const gridsHeight = this.gridSquareLength * this.getRowCount();
    const buttonPos: Coord = {
      x: gridsWidth / 2 + this.buttonMargin,
      y: -gridsHeight / 2,
    };
    let convertedScreenPoint = convertCartesianToScreen(
      this.element,
      buttonPos,
      this.dpr
    );
    const correctedScreenPoint = getScreenPoint(
      convertedScreenPoint,
      this.panZoom
    );
    ctx.fillStyle = "#E1DFE1";
    ctx.globalAlpha = opacity;
    ctx.fillRect(
      correctedScreenPoint.x - (this.buttonHeight / 2) * this.panZoom.scale,
      correctedScreenPoint.y,
      this.buttonHeight * this.panZoom.scale,
      gridsHeight * this.panZoom.scale
    );
    ctx.restore();
    this.drawArrowHead(
      ctx,
      correctedScreenPoint.x - (this.buttonHeight / 2) * this.panZoom.scale,
      correctedScreenPoint.y + (gridsHeight * this.panZoom.scale) / 2,
      -Math.PI / 2,
      this.panZoom.scale,
      opacity
    );
    this.drawArrowHead(
      ctx,
      correctedScreenPoint.x + (this.buttonHeight / 2) * this.panZoom.scale,
      correctedScreenPoint.y + (gridsHeight * this.panZoom.scale) / 2,
      Math.PI / 2,
      this.panZoom.scale,
      opacity
    );
  }

  drawButtons() {
    this.drawTopButton(this.hoveredButton === ButtonDirection.TOP ? 0.8 : 0.4);
    this.drawBottomButton(
      this.hoveredButton === ButtonDirection.BOTTOM ? 0.8 : 0.4
    );
    this.drawLeftButton(
      this.hoveredButton === ButtonDirection.LEFT ? 0.8 : 0.4
    );
    this.drawRightButton(
      this.hoveredButton === ButtonDirection.RIGHT ? 0.8 : 0.4
    );
  }

  drawCheckerboard() {
    const squareLength = this.gridSquareLength * this.panZoom.scale;
    // leftTopPoint is a cartesian coordinate
    const leftTopPoint: Coord = {
      x: -((this.getColumnCount() / 2) * this.gridSquareLength),
      y: -((this.getRowCount() / 2) * this.gridSquareLength),
    };
    const ctx = this.ctx;
    let convertedLetTopScreenPoint = convertCartesianToScreen(
      this.element,
      leftTopPoint,
      this.dpr
    );
    const correctedLeftTopScreenPoint = getScreenPoint(
      convertedLetTopScreenPoint,
      this.panZoom
    );

    for (let i = 0; i < this.getRowCount(); i++) {
      for (let j = 0; j < this.getColumnCount(); j++) {
        const isEvenRow = i % 2 === 0;
        const isEvenCol = j % 2 === 0;

        const color = isEvenRow
          ? isEvenCol
            ? "white"
            : this.checkerboardColor
          : isEvenCol
          ? this.checkerboardColor
          : "white";
        const alpha = this.checkerboardAlpha;

        if (color) {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = color;
          ctx.fillRect(
            j * squareLength + correctedLeftTopScreenPoint.x,
            i * squareLength + correctedLeftTopScreenPoint.y,
            squareLength,
            squareLength
          );
          ctx.restore();
        }
      }
    }
  }

  drawRects() {
    const squareLength = this.gridSquareLength * this.panZoom.scale;
    // leftTopPoint is a cartesian coordinate
    const leftTopPoint: Coord = {
      x: -((this.getColumnCount() / 2) * this.gridSquareLength),
      y: -((this.getRowCount() / 2) * this.gridSquareLength),
    };
    const ctx = this.ctx;
    let convertedLetTopScreenPoint = convertCartesianToScreen(
      this.element,
      leftTopPoint,
      this.dpr
    );
    const correctedLeftTopScreenPoint = getScreenPoint(
      convertedLetTopScreenPoint,
      this.panZoom
    );

    const allRowKeys = Array.from(this.data.keys());
    const allColumnKeys = Array.from(this.data.get(allRowKeys[0])!.keys());
    const currentTopIndex = Math.min(...allRowKeys);
    const currentLeftIndex = Math.min(...allColumnKeys);

    ctx.save();
    for (let i = 0; i < this.getRowCount(); i++) {
      for (let j = 0; j < this.getColumnCount(); j++) {
        // console.log(i, j, this.data.get(i)?.get(j)?.color);
        const rowIndex = i + currentTopIndex;
        const columnIndex = j + currentLeftIndex;

        const color = this.data.get(rowIndex)?.get(columnIndex)?.color;
        if (this.indicatorPixels.length !== 0) {
          const indicator = this.indicatorPixels.find(
            (pixel) =>
              pixel.rowIndex === rowIndex && pixel.columnIndex === columnIndex
          );
          if (indicator) {
            const relativeRowIndex = rowIndex - currentTopIndex;
            const relativeColumnIndex = columnIndex - currentLeftIndex;
            ctx.save();
            ctx.fillStyle = indicator.color;
            ctx.globalAlpha = 0.5;
            ctx.fillRect(
              relativeColumnIndex * squareLength +
                correctedLeftTopScreenPoint.x,
              relativeRowIndex * squareLength + correctedLeftTopScreenPoint.y,
              squareLength,
              squareLength
            );
            ctx.restore();
          }
        }
        if (
          this.hoveredPixel &&
          this.hoveredPixel.rowIndex === rowIndex &&
          this.hoveredPixel.columnIndex === columnIndex
        ) {
          ctx.save();
          const { rowIndex, columnIndex } = this.hoveredPixel;
          const relativeRowIndex = rowIndex - currentTopIndex;
          const relativeColumnIndex = columnIndex - currentLeftIndex;
          if (this.brushMode !== BrushMode.ERASER) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = this.brushColor;
            if (color === this.brushColor) {
              ctx.globalAlpha = 1;
            }

            ctx.fillRect(
              relativeColumnIndex * squareLength +
                correctedLeftTopScreenPoint.x,
              relativeRowIndex * squareLength + correctedLeftTopScreenPoint.y,
              squareLength,
              squareLength
            );
            ctx.restore();
            continue;
          } else {
            if (color) {
              ctx.globalAlpha = 0.2;
              ctx.fillStyle = color;
              ctx.fillRect(
                relativeColumnIndex * squareLength +
                  correctedLeftTopScreenPoint.x,
                relativeRowIndex * squareLength + correctedLeftTopScreenPoint.y,
                squareLength,
                squareLength
              );
              ctx.restore();
              continue;
            }
          }
          ctx.restore();
        }
        if (!color) {
          continue;
        }
        ctx.fillStyle = color;

        ctx.fillRect(
          j * squareLength + correctedLeftTopScreenPoint.x,
          i * squareLength + correctedLeftTopScreenPoint.y,
          squareLength,
          squareLength
        );
      }
    }
    ctx.restore();
  }

  drawGrids() {
    const squareLength = this.gridSquareLength * this.panZoom.scale;
    // leftTopPoint is a cartesian coordinate
    const leftTopPoint: Coord = {
      x: -((this.getColumnCount() / 2) * this.gridSquareLength),
      y: -((this.getRowCount() / 2) * this.gridSquareLength),
    };
    const ctx = this.ctx;
    let convertedScreenPoint = convertCartesianToScreen(
      this.element,
      leftTopPoint,
      this.dpr
    );
    const correctedScreenPoint = getScreenPoint(
      convertedScreenPoint,
      this.panZoom
    );

    // const leftTopScreenPoint = convertCartesianToScreen(
    //   this.element,
    //   correctedPosition,
    //   this.dpr
    // );

    ctx.save();
    ctx.lineWidth = this.gridStrokeWidth;
    ctx.strokeStyle = this.gridStrokeColor;

    for (let i = 0; i <= this.getColumnCount(); i++) {
      if (i === 0 || i === this.getColumnCount()) {
        ctx.beginPath();
        ctx.moveTo(
          correctedScreenPoint.x + i * squareLength,
          correctedScreenPoint.y - this.gridStrokeWidth / 2
        );
        ctx.lineTo(
          correctedScreenPoint.x + i * squareLength,
          correctedScreenPoint.y +
            this.getRowCount() * squareLength +
            this.gridStrokeWidth / 2
        );
        ctx.stroke();
        ctx.closePath();
      }
      ctx.beginPath();
      ctx.moveTo(
        correctedScreenPoint.x + i * squareLength,
        correctedScreenPoint.y
      );
      ctx.lineTo(
        correctedScreenPoint.x + i * squareLength,
        correctedScreenPoint.y + this.getRowCount() * squareLength
      );
      ctx.stroke();
      ctx.closePath();
    }
    for (let j = 0; j <= this.getRowCount(); j++) {
      if (j === 0 || j === this.getRowCount()) {
        ctx.beginPath();
        ctx.moveTo(
          correctedScreenPoint.x - this.gridStrokeWidth / 2,
          correctedScreenPoint.y + j * squareLength
        );
        ctx.lineTo(
          correctedScreenPoint.x +
            this.getColumnCount() * squareLength +
            this.gridStrokeWidth / 2,
          correctedScreenPoint.y + j * squareLength
        );
        ctx.stroke();
        ctx.closePath();
      }
      ctx.beginPath();
      ctx.moveTo(
        correctedScreenPoint.x,
        correctedScreenPoint.y + j * squareLength
      );
      ctx.lineTo(
        correctedScreenPoint.x + this.getColumnCount() * squareLength,
        correctedScreenPoint.y + j * squareLength
      );
      ctx.stroke();
      ctx.closePath();
    }
    ctx.restore();
  }

  getData() {
    return this.data;
  }

  getDataArray() {
    const dataArray: Array<Array<PixelData>> = [];
    const allRows = Array.from(this.data.entries());
    for (let i = 0; i < allRows.length; i++) {
      const columns = Array.from(allRows[i][1]);
      const columnPixels = columns.map((element) => element[1]);
      dataArray.push(columnPixels);
    }
    return dataArray;
  }

  getGridIndices() {
    const allRowKeys = Array.from(this.data.keys());
    const allColumnKeys = Array.from(this.data.get(allRowKeys[0])!.keys());
    const currentTopIndex = Math.min(...allRowKeys);
    const currentLeftIndex = Math.min(...allColumnKeys);
    return {
      topRowIndex: currentTopIndex,
      bottomRowIndex: currentTopIndex + allRowKeys.length - 1,
      leftColumnIndex: currentLeftIndex,
      rightColumnIndex: currentLeftIndex + allColumnKeys.length - 1,
    };
  }

  getDimensions() {
    return {
      columnCount: this.getColumnCount(),
      rowCount: this.getRowCount(),
    };
  }

  /**
   * This erases the pixels in the grid.
   * @param data An array of data about position of change
   */
  erasePixels(data: Array<{ rowIndex: number; columnIndex: number }>) {
    const currentCanvasIndices = this.getGridIndices();
    const validData = data.filter((change) => {
      const { rowIndex, columnIndex } = change;
      return (
        rowIndex >= currentCanvasIndices.topRowIndex &&
        rowIndex <= currentCanvasIndices.bottomRowIndex &&
        columnIndex >= currentCanvasIndices.leftColumnIndex &&
        columnIndex <= currentCanvasIndices.rightColumnIndex
      );
    });

    for (let i = 0; i < validData.length; i++) {
      const { rowIndex, columnIndex } = validData[i];
      this.data.get(rowIndex)!.set(columnIndex, { color: "" });
    }
    this.render();
  }
  /**
   * This changes the color in the grid.
   * @param data An array of data about position of change and wanted color
   */
  colorPixels(data: Array<PixelModifyItem>) {
    const rowIndices = data.map((change) => change.rowIndex);
    const columnIndices = data.map((change) => change.columnIndex);
    const minRowIndex = Math.min(...rowIndices);
    const maxRowIndex = Math.max(...rowIndices);
    const minColumnIndex = Math.min(...columnIndices);
    const maxColumnIndex = Math.min(...columnIndices);
    const currentCanvasIndices = this.getGridIndices();
    if (minRowIndex < currentCanvasIndices.topRowIndex) {
      for (
        let index = currentCanvasIndices.topRowIndex - 1;
        minRowIndex <= index;
        index--
      ) {
        this.extendGrid(ButtonDirection.TOP);
      }
    }
    if (maxRowIndex > currentCanvasIndices.bottomRowIndex) {
      for (
        let index = currentCanvasIndices.bottomRowIndex + 1;
        maxRowIndex >= index;
        index++
      ) {
        this.extendGrid(ButtonDirection.BOTTOM);
      }
    }
    if (minColumnIndex < currentCanvasIndices.leftColumnIndex) {
      for (
        let index = currentCanvasIndices.leftColumnIndex - 1;
        minColumnIndex <= index;
        index--
      ) {
        this.extendGrid(ButtonDirection.LEFT);
      }
    }
    if (maxColumnIndex > currentCanvasIndices.rightColumnIndex) {
      for (
        let index = currentCanvasIndices.rightColumnIndex + 1;
        maxColumnIndex >= index;
        index++
      ) {
        this.extendGrid(ButtonDirection.RIGHT);
      }
    }

    for (const change of data) {
      this.data
        .get(change.rowIndex)!
        .set(change.columnIndex, { color: change.color });
    }
    this.emit(CanvasEvents.DATA_CHANGE, this.data);
    this.render();
  }

  reset() {
    this.scale(1, 1);
    this.panZoom = {
      scale: 1,
      offset: this.origin,
    };
    this.clear();
  }

  getContext() {
    return this.ctx;
  }

  getPanZoom() {
    return this.panZoom;
  }

  getCanvasElement() {
    return this.element;
  }

  getDpr() {
    return this.dpr;
  }

  initialize(initData?: Array<Array<PixelData>>) {
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

    if (initData) {
      for (let i = 0; i < initData.length; i++) {
        this.data.set(i, new Map());
        for (let j = 0; j < initData[i].length; j++) {
          this.data.get(i)!.set(j, { color: initData[i][j].color });
        }
      }
    } else {
      for (let i = 0; i < 6; i++) {
        this.data.set(i, new Map());
        for (let j = 0; j < 8; j++) {
          this.data.get(i)!.set(j, { color: "" });
        }
      }
    }
  }

  emitGridEvent() {
    const allRowKeys = Array.from(this.data.keys());
    const allColumnKeys = Array.from(this.data.get(allRowKeys[0])!.keys());
    const dimensions = {
      columnCount: this.getColumnCount(),
      rowCount: this.getRowCount(),
    };
    const indices = {
      topRowIndex: Math.min(...allRowKeys),
      bottomRowIndex: Math.max(...allRowKeys),
      leftColumnIndex: Math.min(...allColumnKeys),
      rightColumnIndex: Math.max(...allColumnKeys),
    };
    this.emit(CanvasEvents.GRID_CHANGE, dimensions, indices);
  }

  emitHoverPixelChangeEvent() {
    this.emit(CanvasEvents.HOVER_PIXEL_CHANGE, this.hoveredPixel);
  }

  emitDataEvent() {
    this.emit(CanvasEvents.DATA_CHANGE, this.data);
  }

  emitBrushChangeEvent() {
    this.emit(CanvasEvents.BRUSH_CHANGE, this.brushColor, this.brushMode);
  }

  getMouseCartCoord(evt: TouchyEvent) {
    evt.preventDefault();
    const point = this.getPointFromTouchyEvent(evt);
    const pointCoord = { x: point.offsetX, y: point.offsetY };
    const diffPointsOfMouseOffset = getWorldPoint(pointCoord, this.panZoom);
    const mouseCartCoord = diffPoints(diffPointsOfMouseOffset, {
      x: this.element.width / this.dpr / 2,
      y: this.element.height / this.dpr / 2,
    });
    return mouseCartCoord;
  }

  changeBrushColor(color: string) {
    this.brushColor = color;
    this.emit(CanvasEvents.BRUSH_CHANGE, this.brushColor, this.brushMode);
  }

  changeBrushMode(brushMode: BrushMode) {
    this.brushMode = brushMode;
    this.emit(CanvasEvents.BRUSH_CHANGE, this.brushColor, this.brushMode);
  }

  getPixelIndexFromMouseCartCoord(mouseCartCoord: Coord) {
    const leftTopPoint: Coord = {
      x: -((this.getColumnCount() / 2) * this.gridSquareLength),
      y: -((this.getRowCount() / 2) * this.gridSquareLength),
    };
    if (
      mouseCartCoord.x > leftTopPoint.x &&
      mouseCartCoord.x <
        leftTopPoint.x + this.getColumnCount() * this.gridSquareLength &&
      mouseCartCoord.y > leftTopPoint.y &&
      mouseCartCoord.y <
        leftTopPoint.y + this.getRowCount() * this.gridSquareLength
    ) {
      // The above conditions are to check if the mouse is in the grid
      const allRowKeys = Array.from(this.data.keys());
      const allColumnKeys = Array.from(this.data.get(allRowKeys[0])!.keys());
      const currentTopIndex = Math.min(...allRowKeys);
      const currentLeftIndex = Math.min(...allColumnKeys);
      const rowOffset = Math.floor(
        (mouseCartCoord.y - leftTopPoint.y) / this.gridSquareLength
      );
      const columnOffset = Math.floor(
        (mouseCartCoord.x - leftTopPoint.x) / this.gridSquareLength
      );
      return {
        rowIndex: currentTopIndex + rowOffset,
        columnIndex: currentLeftIndex + columnOffset,
      };
    }
    return null;
  }

  downloadImage(props?: ImageDownloadOptions) {
    const imageCanvas = document.createElement("canvas");
    const columnCount = this.getColumnCount();
    const rowCount = this.getRowCount();
    imageCanvas.width = columnCount * this.gridSquareLength;
    imageCanvas.height = rowCount * this.gridSquareLength;
    const imageContext = imageCanvas.getContext("2d")!;
    const allRowKeys = Array.from(this.data.keys());
    const allColumnKeys = Array.from(this.data.get(allRowKeys[0])!.keys());
    const currentTopIndex = Math.min(...allRowKeys);
    const currentLeftIndex = Math.min(...allColumnKeys);
    for (let i = 0; i < rowCount; i++) {
      for (let j = 0; j < columnCount; j++) {
        const rowIndex = i + currentTopIndex;
        const columnIndex = j + currentLeftIndex;
        const pixel = this.data.get(rowIndex)!.get(columnIndex);
        if (pixel && pixel.color) {
          const pixelCoord = {
            x: j * this.gridSquareLength,
            y: i * this.gridSquareLength,
          };
          imageContext.save();
          imageContext.fillStyle = pixel.color;
          imageContext.fillRect(
            pixelCoord.x,
            pixelCoord.y,
            this.gridSquareLength,
            this.gridSquareLength
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
            rowCount * this.gridSquareLength
          );
          imageContext.stroke();
          imageContext.closePath();
        }
        for (let j = 0; j <= this.getRowCount(); j++) {
          imageContext.beginPath();
          imageContext.moveTo(0, j * this.gridSquareLength);
          imageContext.lineTo(
            columnCount * this.gridSquareLength,
            j * this.gridSquareLength
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

  /**
   * This function colors the pixel in the grid
   * @param rowIndex
   * @param columnIndex
   */
  drawPixel(rowIndex: number, columnIndex: number) {
    // This erases the pixel if the brush mode is eraser
    if (this.brushMode === BrushMode.ERASER) {
      this.data.get(rowIndex)!.set(columnIndex, { color: "" });
      this.emit(CanvasEvents.DATA_CHANGE, this.data);
    } else if (this.brushMode === BrushMode.DOT) {
      // this draws the pixel if the brush mode is brush

      if (
        // draw Pixel can be called multiple times for the same pixel
        // we only want to add the pixel to the strokedPixels array if it is a new pixel
        // the first condition is to push the array if it is empty
        this.strokedPixels.length === 0 ||
        this.strokedPixels[this.strokedPixels.length - 1].rowIndex !==
          rowIndex ||
        this.strokedPixels[this.strokedPixels.length - 1].columnIndex !==
          columnIndex
      ) {
        // we preserve the intention of the user coloring the same pixel twice
        // remember that the strokedPixels array is stored in order
        this.strokedPixels.push({
          rowIndex,
          columnIndex,
          color: this.brushColor,
        });
      }

      if (this.data.get(rowIndex)!.get(columnIndex).color !== this.brushColor) {
        this.data.get(rowIndex)!.set(columnIndex, { color: this.brushColor });
        this.emit(CanvasEvents.DATA_CHANGE, this.data);
      }
    } else if (this.brushMode === BrushMode.PAINT_BUCKET) {
      /* 🪣 this paints same color area / with selected brush color. */

      const gridIndices = this.getGridIndices();
      if (!isValidIndicesRange(rowIndex, columnIndex, gridIndices)) {
        return;
      }

      const initialSelectedColor = this.data
        .get(rowIndex)
        ?.get(columnIndex)?.color;
      if (initialSelectedColor === this.brushColor) {
        return;
      }

      this.paintSameColorRegion(initialSelectedColor, gridIndices, {
        rowIndex,
        columnIndex,
      });
      this.emit(CanvasEvents.DATA_CHANGE, this.data);
      this.emit(CanvasEvents.STROKE_END, this.strokedPixels, this.data);
    }
    this.render();
  }

  paintSameColorRegion(
    initialColor: string,
    gridIndices: Indices,
    currentIndices: { rowIndex: number; columnIndex: number }
  ): void {
    const indicesQueue = new Queue<{ rowIndex: number; columnIndex: number }>();
    indicesQueue.enqueue(currentIndices);

    while (indicesQueue.size() > 0) {
      const { rowIndex, columnIndex } = indicesQueue.dequeue()!;
      if (!isValidIndicesRange(rowIndex, columnIndex, gridIndices)) {
        continue;
      }

      const currentPixel = this.data.get(rowIndex)?.get(columnIndex);
      if (!currentPixel || currentPixel?.color !== initialColor) {
        continue;
      }

      this.data.get(rowIndex)!.set(columnIndex, { color: this.brushColor });
      this.strokedPixels.push({
        rowIndex,
        columnIndex,
        color: this.brushColor,
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
    const point = this.getPointFromTouchyEvent(evt);
    this.panPoint.lastMousePos = { x: point.offsetX, y: point.offsetY };

    const mouseCartCoord = this.getMouseCartCoord(evt);
    const pixelIndex = this.getPixelIndexFromMouseCartCoord(mouseCartCoord);
    if (pixelIndex) {
      this.emit(CanvasEvents.HOVER_PIXEL_CHANGE, null);
      this.drawPixel(pixelIndex.rowIndex, pixelIndex.columnIndex);
    }
    this.mouseMode = pixelIndex ? MouseMode.DRAWING : MouseMode.PANNING;
    if (!this.isGridFixed) {
      const buttonDirection = this.detectButtonClicked(mouseCartCoord);
      if (buttonDirection) {
        this.extensionPoint.lastMousePos = {
          x: mouseCartCoord.x,
          y: mouseCartCoord.y,
        };
        this.extensionPoint.direction = buttonDirection;
        this.mouseMode = MouseMode.EXTENDING;
        touchy(this.element, addEvent, "mousemove", this.handleExtension);
      }
    }

    if (this.mouseMode === MouseMode.PANNING) {
      touchy(this.element, addEvent, "mousemove", this.handlePanning);
      touchy(this.element, addEvent, "mousemove", this.handlePinchZoom);
    }
  }

  handleExtension = (evt: TouchyEvent) => {
    evt.preventDefault();
    const minAmountForExtension = this.gridSquareLength / 2;
    if (window.TouchEvent && evt instanceof TouchEvent) {
      if (evt.touches.length > 1) {
        return;
      }
    }
    const mouseCartCoord = this.getMouseCartCoord(evt);
    const buttonDirection = this.extensionPoint.direction;
    const extensionAmount = diffPoints(
      this.extensionPoint.lastMousePos,
      mouseCartCoord
    );

    if (buttonDirection) {
      switch (buttonDirection) {
        case ButtonDirection.TOP:
          if (extensionAmount.y > minAmountForExtension) {
            this.extendGrid(ButtonDirection.TOP);
            this.extensionPoint.lastMousePos.y -= this.gridSquareLength / 2;
          } else if (extensionAmount.y < -minAmountForExtension) {
            this.shortenGrid(ButtonDirection.TOP);
            this.extensionPoint.lastMousePos.y += this.gridSquareLength / 2;
          }
          break;
        case ButtonDirection.BOTTOM:
          if (extensionAmount.y < -minAmountForExtension) {
            this.extendGrid(ButtonDirection.BOTTOM);
            this.extensionPoint.lastMousePos.y += this.gridSquareLength / 2;
          } else if (extensionAmount.y > minAmountForExtension) {
            this.shortenGrid(ButtonDirection.BOTTOM);
            this.extensionPoint.lastMousePos.y -= this.gridSquareLength / 2;
          }
          break;
        case ButtonDirection.LEFT:
          if (extensionAmount.x > minAmountForExtension) {
            this.extendGrid(ButtonDirection.LEFT);
            this.extensionPoint.lastMousePos.x -= this.gridSquareLength / 2;
          } else if (extensionAmount.x < -minAmountForExtension) {
            this.shortenGrid(ButtonDirection.LEFT);
            this.extensionPoint.lastMousePos.x += this.gridSquareLength / 2;
          }
          break;
        case ButtonDirection.RIGHT:
          if (extensionAmount.x < -minAmountForExtension) {
            this.extendGrid(ButtonDirection.RIGHT);
            this.extensionPoint.lastMousePos.x += this.gridSquareLength / 2;
          } else if (extensionAmount.x > minAmountForExtension) {
            this.shortenGrid(ButtonDirection.RIGHT);
            this.extensionPoint.lastMousePos.x -= this.gridSquareLength / 2;
          }
          break;
      }
      this.render();
    }
  };

  extendGrid(direction: ButtonDirection) {
    const currentRowCount = this.getRowCount();
    const currentColumnCount = this.getColumnCount();
    const allRowKeys = Array.from(this.data.keys());
    const allColumnKeys = Array.from(this.data.get(allRowKeys[0])!.keys());
    const currentTopIndex = Math.min(...allRowKeys);
    const currentLeftIndex = Math.min(...allColumnKeys);
    const currentBottomIndex = currentTopIndex + currentRowCount - 1;
    const currentRightIndex = currentLeftIndex + currentColumnCount - 1;

    switch (direction) {
      case ButtonDirection.TOP:
        const newTopIndex = currentTopIndex - 1;
        this.data.set(newTopIndex, new Map());
        for (let i = currentLeftIndex; i <= currentRightIndex; i++) {
          this.data.get(newTopIndex)!.set(i, { color: "" });
        }
        this.setPanZoom({
          offset: {
            x: this.panZoom.offset.x,
            y:
              this.panZoom.offset.y -
              (this.gridSquareLength / 2) * this.panZoom.scale,
          },
        });
        break;
      case ButtonDirection.BOTTOM:
        const newBottomIndex = currentBottomIndex + 1;
        this.data.set(newBottomIndex, new Map());
        for (let i = currentLeftIndex; i <= currentRightIndex; i++) {
          this.data.get(newBottomIndex)!.set(i, { color: "" });
        }
        this.setPanZoom({
          offset: {
            x: this.panZoom.offset.x,
            y:
              this.panZoom.offset.y +
              (this.gridSquareLength / 2) * this.panZoom.scale,
          },
        });
        break;
      case ButtonDirection.LEFT:
        const newLeftIndex = currentLeftIndex - 1;
        this.data.forEach((row) => {
          row.set(newLeftIndex, { color: "" });
        });
        this.setPanZoom({
          offset: {
            x:
              this.panZoom.offset.x -
              (this.gridSquareLength / 2) * this.panZoom.scale,
            y: this.panZoom.offset.y,
          },
        });

        break;
      case ButtonDirection.RIGHT:
        const newRightIndex = currentRightIndex + 1;
        this.data.forEach((row) => {
          row.set(newRightIndex, { color: "" });
        });
        this.setPanZoom({
          offset: {
            x:
              this.panZoom.offset.x +
              (this.gridSquareLength / 2) * this.panZoom.scale,
            y: this.panZoom.offset.y,
          },
        });
        break;
      default:
        break;
    }
    this.emit(CanvasEvents.DATA_CHANGE, this.data);

    const newAllRowKeys = Array.from(this.data.keys());
    const newAllColumnKeys = Array.from(
      this.data.get(newAllRowKeys[0])!.keys()
    );
    const dimensions = {
      columnCount: this.getColumnCount(),
      rowCount: this.getRowCount(),
    };
    const indices = {
      topRowIndex: Math.min(...newAllRowKeys),
      bottomRowIndex: Math.max(...newAllRowKeys),
      leftColumnIndex: Math.min(...newAllColumnKeys),
      rightColumnIndex: Math.max(...newAllColumnKeys),
    };
    this.emit(CanvasEvents.GRID_CHANGE, dimensions, indices);
    this.render();
  }

  shortenGrid(direction: ButtonDirection) {
    const allRowKeys = Array.from(this.data.keys());
    const allColumnKeys = Array.from(this.data.get(allRowKeys[0])!.keys());
    const currentTopIndex = Math.min(...allRowKeys);
    const currentLeftIndex = Math.min(...allColumnKeys);
    const currentBottomIndex = currentTopIndex + this.getRowCount() - 1;
    const currentRightIndex = currentLeftIndex + this.getColumnCount() - 1;
    switch (direction) {
      case ButtonDirection.TOP:
        if (allRowKeys.length <= 2) {
          break;
        }
        this.data.delete(currentTopIndex);
        this.setPanZoom({
          offset: {
            x: this.panZoom.offset.x,
            y:
              this.panZoom.offset.y +
              (this.gridSquareLength / 2) * this.panZoom.scale,
          },
        });
        break;
      case ButtonDirection.BOTTOM:
        if (allRowKeys.length <= 2) {
          break;
        }
        this.data.delete(currentBottomIndex);
        this.setPanZoom({
          offset: {
            x: this.panZoom.offset.x,
            y:
              this.panZoom.offset.y -
              (this.gridSquareLength / 2) * this.panZoom.scale,
          },
        });

        break;
      case ButtonDirection.LEFT:
        if (allColumnKeys.length <= 2) {
          break;
        }
        this.data.forEach((row) => {
          row.delete(currentLeftIndex);
        });
        this.setPanZoom({
          offset: {
            x:
              this.panZoom.offset.x +
              (this.gridSquareLength / 2) * this.panZoom.scale,
            y: this.panZoom.offset.y,
          },
        });

        break;
      case ButtonDirection.RIGHT:
        if (allColumnKeys.length <= 2) {
          break;
        }
        this.data.forEach((row) => {
          row.delete(currentRightIndex);
        });
        this.setPanZoom({
          offset: {
            x:
              this.panZoom.offset.x -
              (this.gridSquareLength / 2) * this.panZoom.scale,
            y: this.panZoom.offset.y,
          },
        });
        break;
      default:
        break;
    }

    this.emit(CanvasEvents.DATA_CHANGE, this.data);

    const newAllRowKeys = Array.from(this.data.keys());
    const newAllColumnKeys = Array.from(
      this.data.get(newAllRowKeys[0])!.keys()
    );
    const dimensions = {
      columnCount: this.getColumnCount(),
      rowCount: this.getRowCount(),
    };
    const indices = {
      topRowIndex: Math.min(...newAllRowKeys),
      bottomRowIndex: Math.max(...newAllRowKeys),
      leftColumnIndex: Math.min(...newAllColumnKeys),
      rightColumnIndex: Math.max(...newAllColumnKeys),
    };
    this.emit(CanvasEvents.GRID_CHANGE, dimensions, indices);
    this.render();
  }

  onMouseMove(evt: TouchyEvent) {
    evt.preventDefault();

    const mouseCartCoord = this.getMouseCartCoord(evt);
    const pixelIndex = this.getPixelIndexFromMouseCartCoord(mouseCartCoord);
    if (pixelIndex) {
      if (this.mouseMode === MouseMode.DRAWING) {
        this.drawPixel(pixelIndex.rowIndex, pixelIndex.columnIndex);
      } else {
        // if previous hovered pixel has an outdated index, emit new index
        if (
          // We should also consider when the hovered pixel is null
          !this.hoveredPixel ||
          this.hoveredPixel.rowIndex !== pixelIndex.rowIndex ||
          this.hoveredPixel.columnIndex !== pixelIndex.columnIndex
        ) {
          this.emit(CanvasEvents.HOVER_PIXEL_CHANGE, pixelIndex);
        }
        this.hoveredPixel = pixelIndex;

        this.render();
      }
    } else {
      // if previous hovered pixel was not null, emit null
      if (this.hoveredPixel !== null) {
        this.emit(CanvasEvents.HOVER_PIXEL_CHANGE, null);
      }
      this.hoveredPixel = null;
      this.render();
    }

    const buttonDirection = this.detectMouseOnButton(mouseCartCoord);
    if (buttonDirection) {
      this.hoveredButton = buttonDirection;
      this.render();
      return;
    } else {
      if (this.mouseMode !== MouseMode.EXTENDING) {
        this.hoveredButton = null;
      }
      this.render();
    }
  }

  removePanListeners() {
    touchy(this.element, removeEvent, "mousemove", this.handlePanning);
    touchy(this.element, removeEvent, "mousemove", this.handlePinchZoom);
  }

  onMouseUp() {
    this.mouseMode = MouseMode.NULL;
    if (this.strokedPixels.length !== 0) {
      this.emit(CanvasEvents.STROKE_END, this.strokedPixels, this.data);
      this.strokedPixels = [];
    }
    touchy(this.element, removeEvent, "mousemove", this.handlePanning);
    touchy(this.element, removeEvent, "mousemove", this.handlePinchZoom);
    touchy(this.element, removeEvent, "mousemove", this.handleExtension);
    this.pinchZoomPrevDiff = undefined;
    this.hoveredButton = null;
  }

  onMouseOut() {
    if (this.mouseMode === MouseMode.PANNING) {
      return;
    }
    touchy(this.element, removeEvent, "mousemove", this.handleExtension);
    touchy(this.element, removeEvent, "mousemove", this.handlePanning);
    touchy(this.element, removeEvent, "mousemove", this.handlePinchZoom);
    if (this.hoveredPixel !== null) {
      this.emit(CanvasEvents.HOVER_PIXEL_CHANGE, null);
    }
    this.hoveredButton = null;
  }

  getColumnCount() {
    if (this.data.size === 0) return 0;
    return this.data.entries().next().value[1].size as number;
  }

  getRowCount() {
    return this.data.size;
  }

  setPanZoom(param: Partial<PanZoom>) {
    const { scale, offset } = param;

    if (scale) {
      this.panZoom.scale = scale;
    }
    if (offset) {
      let correctedOffset = { ...offset };
      const columnCount = this.data.entries().next().value[1].size;
      const rowCount = this.data.size;

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

      // if (rowCount * this.gridSquareLength * this.panZoom.scale > this.height) {
      // correctedOffset.y =
      //   (rowCount * this.gridSquareLength * this.panZoom.scale) / 2 -
      //   (this.height / 2) * this.panZoom.scale;
      // }
      // if (
      //   columnCount * this.gridSquareLength * this.panZoom.scale <
      //   this.width
      // ) {
      //   correctedOffset.x =
      //     (columnCount * this.gridSquareLength * this.panZoom.scale) / 2 -
      //     (this.width / 2) * this.panZoom.scale;
      // }

      this.panZoom.offset = correctedOffset;
    }

    this.render();
    //reset the offset
    // this.panZoom.offset = [0, 0];
  }

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
    const point = this.getPointFromTouchyEvent(evt);

    const currentMousePos: Coord = { x: point.offsetX, y: point.offsetY };
    this.panPoint.lastMousePos = currentMousePos;
    const mouseDiff = diffPoints(lastMousePos, currentMousePos);
    const offset = diffPoints(this.panZoom.offset, mouseDiff);
    // this.panZoom.offset = offset;
    this.setPanZoom({ offset });
    return;
  };

  returnScrollOffsetFromMouseOffset = (
    mouseOffset: Coord,
    panZoom: PanZoom,
    newScale: number
  ) => {
    //this is the correct version
    const worldPos = getWorldPoint(mouseOffset, panZoom);
    const newMousePos = getScreenPoint(worldPos, {
      scale: newScale,
      offset: panZoom.offset,
    });
    const scaleOffset = diffPoints(mouseOffset, newMousePos);
    const offset = addPoints(panZoom.offset, scaleOffset);

    return offset;
  };

  handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (!this.isPanZoomable) {
      return;
    }
    if (e.ctrlKey) {
      const zoom = 1 - e.deltaY / this.ZOOM_SENSITIVITY;
      let newScale = this.panZoom.scale * zoom;

      if (newScale > this.MAX_SCALE) {
        newScale = this.MAX_SCALE;
      }
      if (newScale < this.MIN_SCALE) {
        newScale = this.MIN_SCALE;
      }
      const mouseOffset = { x: e.offsetX, y: e.offsetY };
      const newOffset = this.returnScrollOffsetFromMouseOffset(
        mouseOffset,
        this.panZoom,
        newScale
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

  setMouseMode(mode: MouseMode) {
    this.mouseMode = mode;
  }

  handlePinchZoom = (evt: TouchyEvent) => {
    evt.preventDefault();
    if (!this.isPanZoomable) {
      return;
    }
    if (window.TouchEvent && evt instanceof TouchEvent) {
      const touchCount = evt.touches.length;
      if (touchCount < 2) {
        return;
      }
      const canvasTouchEventIndexes = [];
      for (let i = 0; i < touchCount; i++) {
        const target = evt.touches.item(i)!.target;
        if (target instanceof HTMLCanvasElement) {
          canvasTouchEventIndexes.push(i);
        }
      }
      if (canvasTouchEventIndexes.length !== 2) {
        return;
      }
      const firstTouch = evt.touches[canvasTouchEventIndexes[0]];
      const secondTouch = evt.touches[canvasTouchEventIndexes[1]];
      const pinchZoomCurrentDiff =
        Math.abs(firstTouch.clientX - secondTouch.clientX) +
        Math.abs(firstTouch.clientY - secondTouch.clientY);
      const firstTouchPoint = this.getPointFromTouch(firstTouch);
      const secondTouchPoint = this.getPointFromTouch(secondTouch);
      const touchCenterPos = {
        x: (firstTouchPoint.offsetX + secondTouchPoint.offsetY) / 2,
        y: (firstTouchPoint.offsetY + secondTouchPoint.offsetY) / 2,
      };

      if (!this.pinchZoomPrevDiff) {
        this.pinchZoomPrevDiff = pinchZoomCurrentDiff;
        return;
      }

      const deltaX = this.pinchZoomPrevDiff - pinchZoomCurrentDiff;
      const zoom = 1 - (deltaX * 2) / this.ZOOM_SENSITIVITY;
      const newScale = this.panZoom.scale * zoom;
      if (this.MIN_SCALE > newScale || newScale > this.MAX_SCALE) {
        return;
      }
      const worldPos = getWorldPoint(touchCenterPos, {
        scale: this.panZoom.scale,
        offset: this.panZoom.offset,
      });
      const newTouchCenterPos = getScreenPoint(worldPos, {
        scale: newScale,
        offset: this.panZoom.offset,
      });
      const scaleOffset = diffPoints(touchCenterPos, newTouchCenterPos);
      const offset = addPoints(this.panZoom.offset, scaleOffset);
      this.setPanZoom!({ offset, scale: newScale });
      this.pinchZoomPrevDiff = pinchZoomCurrentDiff;
    }
  };

  getPointFromTouch(touch: Touch) {
    const r = this.element.getBoundingClientRect();
    let originY = touch.clientY;
    let originX = touch.clientX;
    const offsetX = touch.clientX - r.left;
    const offsetY = touch.clientY - r.top;
    return {
      x: originX - this.panZoom.offset.x,
      y: originY - this.panZoom.offset.y,
      offsetX: offsetX,
      offsetY: offsetY,
    };
  }

  getPointFromTouchyEvent(
    evt: TouchyEvent
  ): Coord & { offsetX: number; offsetY: number } {
    let originY;
    let originX;
    let offsetX;
    let offsetY;
    if (window.TouchEvent && evt instanceof TouchEvent) {
      //this is for tablet or mobile
      let isCanvasTouchIncluded = false;
      let firstCanvasTouchIndex = 0;
      for (let i = 0; i < evt.touches.length; i++) {
        const target = evt.touches.item(i)!.target;
        if (target instanceof HTMLCanvasElement) {
          isCanvasTouchIncluded = true;
          firstCanvasTouchIndex = i;
          break;
        }
      }
      if (isCanvasTouchIncluded) {
        return this.getPointFromTouch(evt.touches[firstCanvasTouchIndex]);
      } else {
        return this.getPointFromTouch(evt.touches[0]);
      }
    } else {
      //this is for PC
      originY = evt.clientY;
      originX = evt.clientX;
      offsetX = evt.offsetX;
      offsetY = evt.offsetY;
    }
    originY += window.scrollY;
    originX += window.scrollX;
    return {
      y: originY - this.panZoom.offset.y,
      x: originX - this.panZoom.offset.x,
      offsetX: offsetX,
      offsetY: offsetY,
    };
  }

  getWidth() {
    return this.width;
  }

  getHeight() {
    return this.height;
  }

  setWidth(width: number, devicePixelRatio?: number) {
    this.width = width;
    this.element.width = devicePixelRatio ? width * devicePixelRatio : width;
    this.element.style.width = `${width}px`;
  }

  setHeight(height: number, devicePixelRatio?: number) {
    this.height = height;
    this.element.height = devicePixelRatio ? height * devicePixelRatio : height;
    this.element.style.height = `${height}px`;
  }

  setSize(width: number, height: number, devicePixelRatio?: number) {
    this.setWidth(width, devicePixelRatio);
    this.setHeight(height, devicePixelRatio);
    this.dpr = devicePixelRatio ? devicePixelRatio : this.dpr;
  }

  scale(x: number, y: number) {
    this.ctx.scale(x, y);
  }

  roundRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) {
    const ctx = this.ctx;
    // if (width < 2 * radius) radius = width / 2;
    // if (height < 2 * radius) radius = height / 2;
    ctx.save();
    ctx.fillStyle = "#FF7C7C";
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.save();
    this.ctx.fillStyle = "white";
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.restore();
    if (this.checkerboard) {
      this.drawCheckerboard();
    }
    this.drawRects();
    if (this.isGridVisible) {
      this.drawGrids();
    }
    if (this.isGridFixed) {
      return;
    }
    this.drawButtons();
  }

  clear() {
    const rowCount = this.getRowCount();
    const columnCount = this.getColumnCount();
    this.data = new Map();
    for (let i = 0; i < rowCount; i++) {
      this.data.set(i, new Map());
      for (let j = 0; j < columnCount; j++) {
        this.data.get(i)!.set(j, { color: "" });
      }
    }
    this.render();
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
