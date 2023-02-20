import {
  addPoints,
  convertCartesianToScreen,
  diffPoints,
  directionPoints,
  distPoints,
  getScreenPoint,
  getWorldPoint,
  gradientPoints,
} from "./math";
import EventDispatcher from "./eventDispatcher";
import { Coord, PanZoom } from "./types";
import { addEvent, removeEvent, touchy, TouchyEvent } from "./touch";

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

  private buttonHeight: number = 25;

  private buttonMargin: number = this.buttonHeight / 2 + 5;

  private element: HTMLCanvasElement;

  private gridSquareLength: number = 20;

  private origin = { x: 0, y: 0 };

  private pinchZoomPrevDiff = 0;

  private mouseMode: MouseMode = MouseMode.NULL;

  private data = new Map<
    // this number is rowIndex
    number,
    Map<
      // this number is columnIndex
      number,
      {
        color: string;
      }
    >
  >();

  private history: Array<{
    rowIndex: number;
    columnIndex: number;
    action: "color" | "erase";
  }> = [];

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

  constructor(canvas: HTMLCanvasElement) {
    super();
    this.element = canvas;
    this.ctx = canvas.getContext("2d")!;

    this.initialize();
  }

  //http://jsfiddle.net/dX9Y3/

  detectButtonClicked(coord: Coord): ButtonDirection | null {
    const gridsHeight = this.gridSquareLength * this.getRowCount();
    const gridsWidth = this.gridSquareLength * this.getColumnCount();
    const topButtonPos: Coord = {
      x: -this.buttonHeight / 2,
      y: -gridsHeight / 2 - this.buttonMargin - this.buttonHeight / 2,
    };
    const bottomButtonPos: Coord = {
      x: -this.buttonHeight / 2,
      y: gridsHeight / 2 + this.buttonMargin - this.buttonHeight / 2,
    };

    const leftButtonPos: Coord = {
      x: -gridsWidth / 2 - this.buttonMargin - this.buttonHeight / 2,
      y: -this.buttonHeight / 2,
    };

    const rightButtonPos: Coord = {
      x: gridsWidth / 2 + this.buttonMargin - this.buttonHeight / 2,
      y: -this.buttonHeight / 2,
    };

    const x = coord.x;
    const y = coord.y;
    const topButtonRect = {
      x: topButtonPos.x,
      y: topButtonPos.y,
      width: this.buttonHeight,
      height: this.buttonHeight,
    };
    const bottomButtonRect = {
      x: bottomButtonPos.x,
      y: bottomButtonPos.y,
      width: this.buttonHeight,
      height: this.buttonHeight,
    };
    const leftButtonRect = {
      x: leftButtonPos.x,
      y: leftButtonPos.y,
      width: this.buttonHeight,
      height: this.buttonHeight,
    };
    const rightButtonRect = {
      x: rightButtonPos.x,
      y: rightButtonPos.y,
      width: this.buttonHeight,
      height: this.buttonHeight,
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

  drawTopButton() {
    const ctx = this.ctx;
    ctx.save();
    const gridsHeight = this.gridSquareLength * this.getRowCount();
    const buttonPos: Coord = {
      x: -this.buttonHeight / 2,
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
    ctx.fillStyle = "blue";
    ctx.fillRect(
      correctedScreenPoint.x,
      correctedScreenPoint.y - (this.buttonHeight / 2) * this.panZoom.scale,
      this.buttonHeight * this.panZoom.scale,
      this.buttonHeight * this.panZoom.scale
    );
    ctx.restore();
  }

  drawBottomButton() {
    const ctx = this.ctx;
    ctx.save();
    const gridsHeight = this.gridSquareLength * this.getRowCount();
    const buttonPos: Coord = {
      x: -this.buttonHeight / 2,
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
    ctx.fillStyle = "red";
    ctx.fillRect(
      correctedScreenPoint.x,
      correctedScreenPoint.y - (this.buttonHeight / 2) * this.panZoom.scale,
      this.buttonHeight * this.panZoom.scale,
      this.buttonHeight * this.panZoom.scale
    );
    ctx.restore();
  }

  drawLeftButton() {
    const ctx = this.ctx;

    ctx.save();
    const gridsWidth = this.gridSquareLength * this.getColumnCount();
    const buttonPos: Coord = {
      x: -gridsWidth / 2 - this.buttonMargin,
      y: -this.buttonHeight / 2,
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
    ctx.fillStyle = "green";
    ctx.fillRect(
      correctedScreenPoint.x - (this.buttonHeight / 2) * this.panZoom.scale,
      correctedScreenPoint.y,
      this.buttonHeight * this.panZoom.scale,
      this.buttonHeight * this.panZoom.scale
    );
    ctx.restore();
  }

  drawRightButton() {
    const ctx = this.ctx;
    ctx.save();
    const gridsWidth = this.gridSquareLength * this.getColumnCount();
    const buttonPos: Coord = {
      x: gridsWidth / 2 + this.buttonMargin,
      y: -this.buttonHeight / 2,
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
    ctx.fillStyle = "orange";
    ctx.fillRect(
      correctedScreenPoint.x - (this.buttonHeight / 2) * this.panZoom.scale,
      correctedScreenPoint.y,
      this.buttonHeight * this.panZoom.scale,
      this.buttonHeight * this.panZoom.scale
    );
    ctx.restore();
  }

  drawButtons() {
    this.drawTopButton();
    this.drawBottomButton();
    this.drawLeftButton();
    this.drawRightButton();
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
    ctx.save();
    // ctx.translate(correctedScreenPoint.x, correctedScreenPoint.y);
    // ctx.scale(this.panZoom.scale, this.panZoom.scale);
    const allRowKeys = Array.from(this.data.keys());
    const allColumnKeys = Array.from(this.data.get(allRowKeys[0])!.keys());
    const currentTopIndex = Math.min(...allRowKeys);
    const currentLeftIndex = Math.min(...allColumnKeys);

    for (let i = 0; i < this.getRowCount(); i++) {
      for (let j = 0; j < this.getColumnCount(); j++) {
        // console.log(i, j, this.data.get(i)?.get(j)?.color);
        const rowIndex = i + currentTopIndex;
        const columnIndex = j + currentLeftIndex;
        const color =
          this.data.get(rowIndex)?.get(columnIndex)?.color || "white";
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
    ctx.lineWidth = 1;

    for (let i = 0; i <= this.getColumnCount(); i++) {
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

  initialize() {
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

    //initialize data
    for (let i = 0; i < 6; i++) {
      this.data.set(i, new Map());
      for (let j = 0; j < 8; j++) {
        this.data.get(i)!.set(j, { color: "" });
      }
    }
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

  drawPixelFromCartCoord(mouseCartCoord: Coord) {
    const isColumnCountEven = this.getColumnCount() % 2;
    const isRowCountEven = this.getRowCount() % 2;
    const leftTopPoint: Coord = {
      x: isColumnCountEven
        ? -((this.getColumnCount() / 2) * this.gridSquareLength)
        : -(
            Math.floor(this.getColumnCount() / 2) * this.gridSquareLength +
            this.gridSquareLength * 0.5
          ),
      y: isRowCountEven
        ? -((this.getRowCount() / 2) * this.gridSquareLength)
        : -(
            Math.floor(this.getRowCount() / 2) * this.gridSquareLength +
            this.gridSquareLength * 0.5
          ),
    };
    let isMouseInGrid = false;
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
      isMouseInGrid = true;
      console.log("row", rowOffset, "column", columnOffset);
      this.data
        .get(currentTopIndex + rowOffset)!
        .set(currentLeftIndex + columnOffset, { color: "#ff0000" });
      this.render();
    }
    return isMouseInGrid;
  }

  onMouseDown(evt: TouchyEvent) {
    evt.preventDefault();
    const point = this.getPointFromTouchyEvent(evt);
    const pointCoord = { x: point.offsetX, y: point.offsetY };
    this.panPoint.lastMousePos = { x: point.offsetX, y: point.offsetY };

    if (window.TouchEvent && evt instanceof TouchEvent) {
      const touchCount = evt.touches.length;
      if (touchCount >= 2) {
        const firstTouch = evt.touches[0];
        const secondTouch = evt.touches[1];
        const pinchZoomCurrentDiff =
          Math.abs(firstTouch.clientX - secondTouch.clientX) +
          Math.abs(firstTouch.clientY - secondTouch.clientY);
        this.pinchZoomPrevDiff = pinchZoomCurrentDiff;
      }
    }

    const mouseCartCoord = this.getMouseCartCoord(evt);
    const isMouseInGrid = this.drawPixelFromCartCoord(mouseCartCoord);
    const buttonDirection = this.detectButtonClicked(mouseCartCoord);
    this.mouseMode = isMouseInGrid ? MouseMode.DRAWING : MouseMode.PANNING;
    if (buttonDirection) {
      this.extensionPoint.lastMousePos = {
        x: mouseCartCoord.x,
        y: mouseCartCoord.y,
      };
      this.extensionPoint.direction = buttonDirection;
      this.mouseMode = MouseMode.EXTENDING;
      touchy(this.element, addEvent, "mousemove", this.handleExtension);
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
        console.log("bottom deleted");
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
    this.render();
  }

  onMouseMove(evt: TouchyEvent) {
    evt.preventDefault();
    const point = this.getPointFromTouchyEvent(evt);
    const pointCoord = { x: point.offsetX, y: point.offsetY };
    if (this.mouseMode === MouseMode.DRAWING) {
      const mouseCartCoord = this.getMouseCartCoord(evt);
      this.drawPixelFromCartCoord(mouseCartCoord);
    }
  }

  removePanListeners() {
    touchy(this.element, removeEvent, "mousemove", this.handlePanning);
    touchy(this.element, removeEvent, "mousemove", this.handlePinchZoom);
  }

  onMouseUp() {
    this.mouseMode = MouseMode.NULL;
    touchy(this.element, removeEvent, "mousemove", this.handlePanning);
    touchy(this.element, removeEvent, "mousemove", this.handlePinchZoom);
    touchy(this.element, removeEvent, "mousemove", this.handleExtension);
  }

  onMouseOut() {
    if (this.mouseMode === MouseMode.PANNING) {
      return;
    }
    touchy(this.element, removeEvent, "mousemove", this.handleExtension);
    touchy(this.element, removeEvent, "mousemove", this.handlePanning);
    touchy(this.element, removeEvent, "mousemove", this.handlePinchZoom);
  }

  getColumnCount() {
    if (this.data.size === 0) return 0;
    return this.data.entries().next().value[1].size;
  }

  getRowCount() {
    return this.data.size;
  }

  setPanZoom(param: Partial<PanZoom>) {
    this.emit("setIsPanZoomed");
    const { scale, offset } = param;

    if (scale) {
      this.panZoom.scale = scale;
    }
    if (offset) {
      let correctedOffset = { ...offset };
      const columnCount = this.data.entries().next().value[1].size;
      const rowCount = this.data.size;
      const minXPosition =
        (-(this.width - columnCount * this.gridSquareLength) / 2) *
        this.panZoom.scale;
      const minYPosition =
        (-(this.height - rowCount * this.gridSquareLength) / 2) *
        this.panZoom.scale;
      if (correctedOffset.x < minXPosition) {
        correctedOffset.x = minXPosition;
      }
      if (correctedOffset.y < minYPosition) {
        correctedOffset.y = minYPosition;
      }

      if (
        correctedOffset.x >
        this.width -
          columnCount * this.gridSquareLength * this.panZoom.scale -
          ((this.width - columnCount * this.gridSquareLength) *
            this.panZoom.scale) /
            2
      ) {
        correctedOffset.x =
          this.width -
          columnCount * this.gridSquareLength * this.panZoom.scale -
          ((this.width - columnCount * this.gridSquareLength) *
            this.panZoom.scale) /
            2;
      }
      if (
        correctedOffset.y >
        this.height -
          rowCount * this.gridSquareLength * this.panZoom.scale -
          ((this.height - rowCount * this.gridSquareLength) *
            this.panZoom.scale) /
            2
      ) {
        correctedOffset.y =
          this.height -
          rowCount * this.gridSquareLength * this.panZoom.scale -
          ((this.height - rowCount * this.gridSquareLength) *
            this.panZoom.scale) /
            2;
      }
      this.panZoom.offset = correctedOffset;
    }

    this.render();
    //reset the offset
    // this.panZoom.offset = [0, 0];
  }

  async startResetPanZoom() {
    this.destroy();
    this.initialize();
  }

  handlePanning = (evt: TouchyEvent) => {
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
    if (window.TouchEvent && evt instanceof TouchEvent) {
      const touchCount = evt.touches.length;
      if (!(touchCount >= 2)) {
        return;
      }
      const firstTouch = evt.touches[0];
      const secondTouch = evt.touches[1];
      const pinchZoomCurrentDiff =
        Math.abs(firstTouch.clientX - secondTouch.clientX) +
        Math.abs(firstTouch.clientY - secondTouch.clientY);
      const firstTouchPoint = this.getPointFromTouch(firstTouch);
      const secondTouchPoint = this.getPointFromTouch(secondTouch);
      const touchCenterPos = {
        x: (firstTouchPoint.offsetX + secondTouchPoint.offsetX) / 2,
        y: (firstTouchPoint.offsetY + secondTouchPoint.offsetY) / 2,
      } as Coord;

      const deltaX = this.pinchZoomPrevDiff - pinchZoomCurrentDiff;
      const zoom = 1 - (deltaX * 2) / this.ZOOM_SENSITIVITY;
      const newScale = this.panZoom.scale * zoom;
      if (this.MIN_SCALE > newScale || newScale > this.MAX_SCALE) {
        return;
      }
      const newOffset = this.returnScrollOffsetFromMouseOffset(
        touchCenterPos,
        this.panZoom,
        newScale
      );
      this.setPanZoom({ scale: newScale, offset: newOffset });
      this.pinchZoomPrevDiff = pinchZoomCurrentDiff;
    }
  };

  getPointFromTouch(touch: Touch) {
    const r = this.element.getBoundingClientRect();
    const offsetX = touch.clientX - r.left;
    const offsetY = touch.clientY - r.top;
    return {
      offsetX: offsetX,
      offsetY: offsetY,
    };
  }

  getPointFromTouchyEvent(evt: TouchyEvent) {
    if (window.TouchEvent && evt instanceof TouchEvent) {
      return this.getPointFromTouch(evt.touches[0]);
      // }
    } else {
      // this is for PC
      // offsetX = evt.offsetX;
      // offsetY = evt.offsetY;
      // originY += window.scrollY;
      // originX += window.scrollX;
      return {
        //   y: originY - this.panZoom.offset.y,
        //   x: originX - this.panZoom.offset.x,
        offsetX: evt.offsetX,
        offsetY: evt.offsetY,
      };
    }
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
    this.clear();
    this.ctx.save();
    this.ctx.fillStyle = "white";
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.restore();
    this.drawRects();
    this.drawGrids();
    this.drawButtons();
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
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
