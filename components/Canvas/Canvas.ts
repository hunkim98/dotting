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

export default class Canvas extends EventDispatcher {
  private MAX_SCALE = 1.5;

  private MIN_SCALE = 0.6;

  private ZOOM_SENSITIVITY = 200;

  private element: HTMLCanvasElement;

  private gridSquareLength: number = 20;

  private origin = { x: 0, y: 0 };

  private columnCount = 15;

  private rowCount = 11;

  private pinchZoomPrevDiff = 0;

  private isDragging = false;

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

  drawRects() {
    const squareLength = this.gridSquareLength * this.panZoom.scale;
    // leftTopPoint is a cartesian coordinate
    const leftTopPoint: Coord = {
      x: -((this.columnCount / 2) * this.gridSquareLength),
      y: -((this.rowCount / 2) * this.gridSquareLength),
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
    ctx.save();
    ctx.translate(correctedScreenPoint.x, correctedScreenPoint.y);
    // ctx.scale(this.panZoom.scale, this.panZoom.scale);
    for (let i = 0; i < this.rowCount; i++) {
      for (let j = 0; j < this.columnCount; j++) {
        const color = this.data.get(i)?.get(j)?.color || "white";
        ctx.fillStyle = color;
        ctx.fillRect(
          j * squareLength,
          i * squareLength,
          squareLength,
          squareLength
        );
      }
    }
    ctx.restore();
  }

  drawGrids() {
    const isColumnCountEven = this.columnCount % 2;
    const isRowCountEven = this.rowCount % 2;
    const squareLength = this.gridSquareLength * this.panZoom.scale;
    // leftTopPoint is a cartesian coordinate
    const leftTopPoint: Coord = {
      x: isColumnCountEven
        ? -((this.columnCount / 2) * this.gridSquareLength)
        : -(
            Math.floor(this.columnCount / 2) * this.gridSquareLength +
            this.gridSquareLength * 0.5
          ),
      y: isRowCountEven
        ? -((this.rowCount / 2) * this.gridSquareLength)
        : -(
            Math.floor(this.rowCount / 2) * this.gridSquareLength +
            this.gridSquareLength * 0.5
          ),
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

    for (let i = 0; i <= this.columnCount; i++) {
      ctx.beginPath();
      ctx.moveTo(
        correctedScreenPoint.x + i * squareLength,
        correctedScreenPoint.y
      );
      ctx.lineTo(
        correctedScreenPoint.x + i * squareLength,
        correctedScreenPoint.y + this.rowCount * squareLength
      );
      ctx.stroke();
      ctx.closePath();
    }
    for (let j = 0; j <= this.rowCount; j++) {
      ctx.beginPath();
      ctx.moveTo(
        correctedScreenPoint.x,
        correctedScreenPoint.y + j * squareLength
      );
      ctx.lineTo(
        correctedScreenPoint.x + this.columnCount * squareLength,
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
    for (let i = 0; i < this.rowCount; i++) {
      this.data.set(i, new Map());
      for (let j = 0; j < this.columnCount; j++) {
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
    const isColumnCountEven = this.columnCount % 2;
    const isRowCountEven = this.rowCount % 2;
    const leftTopPoint: Coord = {
      x: isColumnCountEven
        ? -((this.columnCount / 2) * this.gridSquareLength)
        : -(
            Math.floor(this.columnCount / 2) * this.gridSquareLength +
            this.gridSquareLength * 0.5
          ),
      y: isRowCountEven
        ? -((this.rowCount / 2) * this.gridSquareLength)
        : -(
            Math.floor(this.rowCount / 2) * this.gridSquareLength +
            this.gridSquareLength * 0.5
          ),
    };
    let isMouseInGrid = false;
    if (
      mouseCartCoord.x > leftTopPoint.x &&
      mouseCartCoord.x <
        leftTopPoint.x + this.columnCount * this.gridSquareLength &&
      mouseCartCoord.y > leftTopPoint.y &&
      mouseCartCoord.y < leftTopPoint.y + this.rowCount * this.gridSquareLength
    ) {
      const row = Math.floor(
        (mouseCartCoord.y - leftTopPoint.y) / this.gridSquareLength
      );
      const column = Math.floor(
        (mouseCartCoord.x - leftTopPoint.x) / this.gridSquareLength
      );
      isMouseInGrid = true;
      console.log("row", row, "column", column);
      this.data.get(row)!.set(column, { color: "#ff0000" });
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
    this.isDragging = isMouseInGrid;

    if (!isMouseInGrid) {
      touchy(this.element, addEvent, "mousemove", this.handlePanning);
      touchy(this.element, addEvent, "mousemove", this.handlePinchZoom);
    }
  }

  onMouseMove(evt: TouchyEvent) {
    evt.preventDefault();
    const point = this.getPointFromTouchyEvent(evt);
    const pointCoord = { x: point.offsetX, y: point.offsetY };
    if (this.isDragging) {
      const mouseCartCoord = this.getMouseCartCoord(evt);
      this.drawPixelFromCartCoord(mouseCartCoord);
    }
  }

  onMouseUp() {
    this.isDragging = false;
    touchy(this.element, removeEvent, "mousemove", this.handlePanning);
    touchy(this.element, removeEvent, "mousemove", this.handlePinchZoom);
  }

  onMouseOut() {
    touchy(this.element, removeEvent, "mousemove", this.handlePanning);
    touchy(this.element, removeEvent, "mousemove", this.handlePinchZoom);
  }

  setPanZoom(param: Partial<PanZoom>) {
    this.emit("setIsPanZoomed");
    const { scale, offset } = param;

    if (scale) {
      this.panZoom.scale = scale;
    }
    if (offset) {
      console.log(offset);
      let correctedOffset = { ...offset };
      const columnCount = this.data.entries().next().value[1].size;
      const rowCount = this.data.size;
      console.log(this.width, columnCount * this.gridSquareLength);
      // console.log(-columnCount * this.gridSquareLength * this.panZoom.scale);
      const isColumnCountEven = columnCount % 2;
      const isRowCountEven = rowCount % 2;
      let leftTopX = isColumnCountEven
        ? -((columnCount / 2) * this.gridSquareLength) * this.dpr
        : -(
            Math.floor(columnCount / 2) * this.gridSquareLength +
            this.gridSquareLength * 0.5
          ) * this.dpr;
      let leftTopY = isRowCountEven
        ? -((rowCount / 2) * this.gridSquareLength * this.dpr)
        : -(
            Math.floor(rowCount / 2) * this.gridSquareLength +
            this.gridSquareLength * 0.5
          ) * this.dpr;
      // console.log(minXPosition);
      const minXPosition =
        (-(this.width - columnCount * this.gridSquareLength) / 2) *
        this.panZoom.scale;
      const minYPosition =
        (-(this.height - rowCount * this.gridSquareLength) / 2) *
        this.panZoom.scale;
      console.log(minXPosition, minYPosition);
      if (correctedOffset.x < minXPosition) {
        correctedOffset.x = minXPosition;
      }
      if (offset.y < minYPosition) {
        correctedOffset.y = minYPosition;
      }
      this.panZoom.offset = correctedOffset;
    }
    // this.gridSquareLength = this.gridSquareLength * this.panZoom.scale;
    // console.log(this.gridSquareLength);

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

  renderGraph(userId: number) {
    this.reset();
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
