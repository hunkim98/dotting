import { convertCartesianToScreen, getScreenPoint } from "../../utils/math";
import { drawExtendButton } from "../../utils/shapes";
import { BaseLayer } from "./baseLayer";
import {
  ButtonDirection,
  DefaultButtonHeight,
  DefaultGridSquareLength,
} from "./config";
import { Coord, PanZoom } from "./types";

export default class GridLayer extends BaseLayer {
  private columnCount: number;
  private rowCount: number;
  private isGridVisible: boolean = true;
  private isGridFixed: boolean = false;
  private gridStrokeColor: string;
  private gridStrokeWidth: number;
  private gridSquareLength: number = DefaultGridSquareLength;
  private buttonHeight: number = DefaultButtonHeight;
  private buttonMargin: number = DefaultButtonHeight / 2 + 5;
  private hoveredButton: ButtonDirection | null = null;

  constructor({
    columnCount,
    rowCount,
    canvas,
    isGridVisible,
    gridStrokeColor,
    gridStrokeWidth,
  }: {
    columnCount: number;
    rowCount: number;
    canvas: HTMLCanvasElement;
    isGridVisible?: boolean;
    gridStrokeColor?: string;
    gridStrokeWidth?: number;
  }) {
    super({ canvas });
    this.columnCount = columnCount;
    this.rowCount = rowCount;
    this.ctx = canvas.getContext("2d")!;
    this.element = canvas;
    this.gridStrokeColor = gridStrokeColor ? gridStrokeColor : "#555555";
    this.gridStrokeWidth = gridStrokeWidth ? gridStrokeWidth : 1;
    this.isGridVisible = isGridVisible ? isGridVisible : true;
  }

  setColumnCount(columnCount: number) {
    this.columnCount = columnCount;
  }

  setRowCount(rowCount: number) {
    this.rowCount = rowCount;
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

  setHoveredButton(hoveredButton: ButtonDirection | null) {
    this.hoveredButton = hoveredButton;
    this.render();
  }

  findCenterPosForButton(direction: ButtonDirection) {
    const gridsWidth = this.gridSquareLength * this.columnCount;
    const gridsHeight = this.gridSquareLength * this.rowCount;
    const buttonPos: Coord = {
      x: gridsWidth / 2 + this.buttonMargin,
      y: -gridsHeight / 2,
    };
    if (direction === ButtonDirection.LEFT) {
      buttonPos.x = -gridsWidth / 2 - this.buttonMargin;
      buttonPos.y = -gridsHeight / 2;
    } else if (direction === ButtonDirection.RIGHT) {
      buttonPos.x = gridsWidth / 2 + this.buttonMargin;
      buttonPos.y = -gridsHeight / 2;
    } else if (direction === ButtonDirection.TOP) {
      buttonPos.x = -gridsWidth / 2;
      buttonPos.y = -gridsHeight / 2 - this.buttonMargin;
    } else if (direction === ButtonDirection.BOTTOM) {
      buttonPos.x = -gridsWidth / 2;
      buttonPos.y = gridsHeight / 2 + this.buttonMargin;
    } else {
      throw new Error("Invalid button direction");
    }
    const convertedScreenPos = convertCartesianToScreen(
      this.element,
      buttonPos,
      this.dpr,
    );
    const correctedScreenPoint = getScreenPoint(
      convertedScreenPos,
      this.panZoom,
    );
    return correctedScreenPoint;
  }

  drawRightButton(color: string) {
    const centerPos = this.findCenterPosForButton(ButtonDirection.RIGHT);
    drawExtendButton(
      this.ctx,
      centerPos,
      color,
      this.buttonHeight,
      this.rowCount * this.gridSquareLength,
      this.panZoom.scale,
    );
  }

  drawLeftButton(color: string) {
    const centerPos = this.findCenterPosForButton(ButtonDirection.LEFT);
    drawExtendButton(
      this.ctx,
      centerPos,
      color,
      this.buttonHeight,
      this.rowCount * this.gridSquareLength,
      this.panZoom.scale,
    );
  }

  drawTopButton(color: string) {
    const centerPos = this.findCenterPosForButton(ButtonDirection.TOP);
    drawExtendButton(
      this.ctx,
      centerPos,
      color,
      this.buttonHeight,
      this.columnCount * this.gridSquareLength,
      this.panZoom.scale,
    );
  }

  drawBottomButton(color: string) {
    const centerPos = this.findCenterPosForButton(ButtonDirection.BOTTOM);
    drawExtendButton(
      this.ctx,
      centerPos,
      color,
      this.buttonHeight,
      this.columnCount * this.gridSquareLength,
      this.panZoom.scale,
    );
  }

  drawButtons() {
    const buttonBackgroundColor = "#c8c8c8";
    const onHoverbuttonBackgroundColor = "#b2b2b2";
    this.drawTopButton(
      this.hoveredButton === ButtonDirection.TOP
        ? onHoverbuttonBackgroundColor
        : buttonBackgroundColor,
    );
    this.drawBottomButton(
      this.hoveredButton === ButtonDirection.BOTTOM
        ? onHoverbuttonBackgroundColor
        : buttonBackgroundColor,
    );
    this.drawLeftButton(
      this.hoveredButton === ButtonDirection.LEFT
        ? onHoverbuttonBackgroundColor
        : buttonBackgroundColor,
    );
    this.drawRightButton(
      this.hoveredButton === ButtonDirection.RIGHT
        ? onHoverbuttonBackgroundColor
        : buttonBackgroundColor,
    );
  }

  render() {
    if (!this.isGridFixed) {
      this.drawButtons();
    }
    if (!this.isGridVisible) {
      return;
    }
    const squareLength = this.gridSquareLength * this.panZoom.scale;
    // leftTopPoint is a cartesian coordinate
    const leftTopPoint: Coord = {
      x: -((this.columnCount / 2) * this.gridSquareLength),
      y: -((this.rowCount / 2) * this.gridSquareLength),
    };
    const ctx = this.ctx;
    const convertedScreenPoint = convertCartesianToScreen(
      this.element,
      leftTopPoint,
      this.dpr,
    );
    const correctedScreenPoint = getScreenPoint(
      convertedScreenPoint,
      this.panZoom,
    );

    ctx.save();
    ctx.lineWidth = this.gridStrokeWidth;
    ctx.strokeStyle = this.gridStrokeColor;

    for (let i = 0; i <= this.columnCount; i++) {
      if (i === 0 || i === this.columnCount) {
        ctx.beginPath();
        ctx.moveTo(
          correctedScreenPoint.x + i * squareLength,
          correctedScreenPoint.y - this.gridStrokeWidth / 2,
        );
        ctx.lineTo(
          correctedScreenPoint.x + i * squareLength,
          correctedScreenPoint.y +
            this.rowCount * squareLength +
            this.gridStrokeWidth / 2,
        );
        ctx.stroke();
        ctx.closePath();
      }
      ctx.beginPath();
      ctx.moveTo(
        correctedScreenPoint.x + i * squareLength,
        correctedScreenPoint.y,
      );
      ctx.lineTo(
        correctedScreenPoint.x + i * squareLength,
        correctedScreenPoint.y + this.rowCount * squareLength,
      );
      ctx.stroke();
      ctx.closePath();
    }
    for (let j = 0; j <= this.rowCount; j++) {
      if (j === 0 || j === this.rowCount) {
        ctx.beginPath();
        ctx.moveTo(
          correctedScreenPoint.x - this.gridStrokeWidth / 2,
          correctedScreenPoint.y + j * squareLength,
        );
        ctx.lineTo(
          correctedScreenPoint.x +
            this.columnCount * squareLength +
            this.gridStrokeWidth / 2,
          correctedScreenPoint.y + j * squareLength,
        );
        ctx.stroke();
        ctx.closePath();
      }
      ctx.beginPath();
      ctx.moveTo(
        correctedScreenPoint.x,
        correctedScreenPoint.y + j * squareLength,
      );
      ctx.lineTo(
        correctedScreenPoint.x + this.columnCount * squareLength,
        correctedScreenPoint.y + j * squareLength,
      );
      ctx.stroke();
      ctx.closePath();
    }
    ctx.restore();
  }
}
