import { convertCartesianToScreen, getScreenPoint } from "../../utils/math";
import { drawExtendButton } from "../../utils/shapes";
import { BaseLayer } from "./BaseLayer";
import {
  ButtonDirection,
  DefaultButtonHeight,
  DefaultGridSquareLength,
} from "./config";
import { Coord, PanZoom } from "./types";

export default class GridLayer extends BaseLayer {
  private columnCount: number;
  private rowCount: number;
  private isGridVisible = true;
  private isGridFixed = false;
  private gridStrokeColor: string;
  private gridStrokeWidth: number;
  private gridSquareLength: number = DefaultGridSquareLength;
  private buttonHeight: number = DefaultButtonHeight;
  private buttonMargin: number = DefaultButtonHeight / 2 + 5;
  private hoveredButton: ButtonDirection | null = null;
  private topButtonDimensions: {
    x: number;
    y: number;
    width: number;
    height: number;
  } = { x: 0, y: 0, width: 0, height: 0 };

  private bottomButtonDimensions: {
    x: number;
    y: number;
    width: number;
    height: number;
  } = { x: 0, y: 0, width: 0, height: 0 };

  private leftButtonDimensions: {
    x: number;
    y: number;
    width: number;
    height: number;
  } = { x: 0, y: 0, width: 0, height: 0 };

  private rightButtonDimensions: {
    x: number;
    y: number;
    width: number;
    height: number;
  } = { x: 0, y: 0, width: 0, height: 0 };

  constructor({
    columnCount,
    rowCount,
    canvas,
  }: {
    columnCount: number;
    rowCount: number;
    canvas: HTMLCanvasElement;
  }) {
    super({ canvas });
    this.columnCount = columnCount;
    this.rowCount = rowCount;
    this.ctx = canvas.getContext("2d")!;
    this.element = canvas;
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

  getIsGridVisible() {
    return this.isGridVisible;
  }

  setIsGridFixed(isGridFixed: boolean) {
    if (isGridFixed !== undefined) {
      this.isGridFixed = isGridFixed;
    }
    this.render();
  }

  getIsGridFixed() {
    return this.isGridFixed;
  }

  setGridStrokeColor(gridStrokeColor: string) {
    if (gridStrokeColor !== "" || gridStrokeColor !== undefined) {
      this.gridStrokeColor = gridStrokeColor;
    }
    this.render();
  }

  getGridStrokeColor() {
    return this.gridStrokeColor;
  }

  setGridStrokeWidth(gridStrokeWidth: number) {
    if (gridStrokeWidth !== 0 || gridStrokeWidth !== undefined) {
      this.gridStrokeWidth = gridStrokeWidth;
    }
    this.render();
  }

  getGridStrokeWidth() {
    return this.gridStrokeWidth;
  }

  setHoveredButton(hoveredButton: ButtonDirection | null) {
    this.hoveredButton = hoveredButton;
    this.render();
  }

  getButtonsDimensions() {
    return {
      top: this.topButtonDimensions,
      bottom: this.bottomButtonDimensions,
      left: this.leftButtonDimensions,
      right: this.rightButtonDimensions,
    };
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
    const width = this.buttonHeight;
    const height = this.rowCount * this.gridSquareLength;
    this.rightButtonDimensions = {
      x: centerPos.x - width / 2,
      y: centerPos.y - height / 2,
      width,
      height,
    };
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
    const width = this.buttonHeight;
    const height = this.rowCount * this.gridSquareLength;
    this.leftButtonDimensions = {
      x: centerPos.x - width / 2,
      y: centerPos.y - height / 2,
      width,
      height,
    };
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
    const width = this.columnCount * this.gridSquareLength;
    const height = this.buttonHeight;
    this.topButtonDimensions = {
      x: centerPos.x - width / 2,
      y: centerPos.y - height / 2,
      width,
      height,
    };
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
    const width = this.columnCount * this.gridSquareLength;
    const height = this.buttonHeight;
    this.bottomButtonDimensions = {
      x: centerPos.x - width / 2,
      y: centerPos.y - height / 2,
      width,
      height,
    };
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

  /**
   * Grid Layer render will be called when:
   * 1. isGridFixed is changed
   * 2. isGridVisible is changed
   * 3. gridStrokeColor is changed
   * 4. gridStrokeWidth is changed
   * 5. panZoom is changed
   * @returns {void}
   */
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
