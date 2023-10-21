import { BaseLayer } from "./BaseLayer";
import {
  ButtonDirection,
  DashedLineOffsetFromPixelCanvas,
  DefaultButtonHeight,
  DefaultButtonMargin,
  DefaultExtendArrowPadding,
  DefaultGridSquareLength,
  ExtensionGuideCircleRadius,
} from "./config";
import { ButtonDimensions, Coord } from "./types";
import { convertCartesianToScreen, getScreenPoint } from "../../utils/math";
import {
  drawArrowHead,
  drawCircle,
  drawExtendButton,
} from "../../utils/shapes";

export default class GridLayer extends BaseLayer {
  private columnCount: number;
  private rowCount: number;
  private isGridVisible = true;
  private isGridFixed = false;
  private gridStrokeColor: string;
  private gridStrokeWidth: number;
  private gridSquareLength: number = DefaultGridSquareLength;
  private buttonHeight: number = DefaultButtonHeight;
  private buttonMargin: number = DefaultButtonMargin;
  private extendArrowPadding: number = DefaultExtendArrowPadding;
  private hoveredButton: ButtonDirection | null = null;
  private topButtonDimensions: ButtonDimensions = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };

  private bottomButtonDimensions: ButtonDimensions = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };

  private leftButtonDimensions: ButtonDimensions = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };

  private rightButtonDimensions: ButtonDimensions = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };

  private topLeftButtonDimensions: ButtonDimensions = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };

  private topRightButtonDimensions: ButtonDimensions = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };

  private bottomLeftButtonDimensions: ButtonDimensions = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };

  private bottomRightButtonDimensions: ButtonDimensions = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };

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
  }

  getIsGridVisible() {
    return this.isGridVisible;
  }

  setIsGridFixed(isGridFixed: boolean) {
    if (isGridFixed !== undefined) {
      this.isGridFixed = isGridFixed;
    }
  }

  getIsGridFixed() {
    return this.isGridFixed;
  }

  getHoveredButton() {
    return this.hoveredButton;
  }

  setGridStrokeColor(gridStrokeColor: string) {
    if (gridStrokeColor !== "" || gridStrokeColor !== undefined) {
      this.gridStrokeColor = gridStrokeColor;
    }
  }

  setGridSquareLength(gridSquareLength: number) {
    this.gridSquareLength = gridSquareLength;
  }

  getGridStrokeColor() {
    return this.gridStrokeColor;
  }

  setGridStrokeWidth(gridStrokeWidth: number) {
    if (gridStrokeWidth !== 0 || gridStrokeWidth !== undefined) {
      this.gridStrokeWidth = gridStrokeWidth;
    }
  }

  getGridStrokeWidth() {
    return this.gridStrokeWidth;
  }

  setHoveredButton(hoveredButton: ButtonDirection | null) {
    this.hoveredButton = hoveredButton;
  }

  getButtonsDimensions() {
    return {
      top: this.topButtonDimensions,
      bottom: this.bottomButtonDimensions,
      left: this.leftButtonDimensions,
      right: this.rightButtonDimensions,
      topLeft: this.topLeftButtonDimensions,
      topRight: this.topRightButtonDimensions,
      bottomLeft: this.bottomLeftButtonDimensions,
      bottomRight: this.bottomRightButtonDimensions,
    };
  }

  findLeftTopPosForButton(
    direction: ButtonDirection,
    buttonWidth: number,
    buttonHeight: number,
  ) {
    const gridsWidth = this.gridSquareLength * this.columnCount;
    const gridsHeight = this.gridSquareLength * this.rowCount;
    const buttonPos: Coord = {
      x: gridsWidth / 2 + this.buttonMargin,
      y: -gridsHeight / 2,
    };
    if (direction === ButtonDirection.LEFT) {
      buttonPos.x = -this.buttonMargin - buttonWidth / 2;
      buttonPos.y = 0;
    } else if (direction === ButtonDirection.RIGHT) {
      buttonPos.x = gridsWidth + this.buttonMargin - buttonWidth / 2;
      buttonPos.y = 0;
    } else if (direction === ButtonDirection.TOP) {
      buttonPos.x = 0;
      buttonPos.y = -this.buttonMargin - buttonHeight / 2;
    } else if (direction === ButtonDirection.BOTTOM) {
      buttonPos.x = 0;
      buttonPos.y = gridsHeight + this.buttonMargin - buttonHeight / 2;
    } else if (direction === ButtonDirection.TOPLEFT) {
      // FIXME cleanup codes
      buttonPos.x = -this.buttonMargin - buttonWidth / 2;
      buttonPos.y = -this.buttonMargin - buttonHeight / 2;
    } else if (direction === ButtonDirection.TOPRIGHT) {
      buttonPos.x = gridsWidth + this.buttonMargin - buttonWidth / 2;
      buttonPos.y = -this.buttonMargin - buttonHeight / 2;
    } else if (direction === ButtonDirection.BOTTOMLEFT) {
      buttonPos.x = -this.buttonMargin - buttonWidth / 2;
      buttonPos.y = gridsHeight + this.buttonMargin - buttonHeight / 2;
    } else if (direction === ButtonDirection.BOTTOMRIGHT) {
      buttonPos.x = gridsWidth + this.buttonMargin - buttonWidth / 2;
      buttonPos.y = gridsHeight + this.buttonMargin - buttonHeight / 2;
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
    return {
      worldPos: buttonPos,
      screenPos: correctedScreenPoint,
    };
  }

  drawRightButton(color: string) {
    const width = this.buttonHeight;
    const height = this.rowCount * this.gridSquareLength;
    const { screenPos, worldPos } = this.findLeftTopPosForButton(
      ButtonDirection.RIGHT,
      width,
      height,
    );
    this.rightButtonDimensions = {
      x: worldPos.x,
      y: worldPos.y,
      width,
      height,
    };
    drawExtendButton(
      this.ctx,
      screenPos,
      color,
      width,
      height,
      this.panZoom.scale,
    );
    drawArrowHead(
      this.ctx,
      screenPos.x + this.extendArrowPadding * this.panZoom.scale,
      screenPos.y + (height * this.panZoom.scale) / 2,
      -Math.PI / 2,
      this.panZoom.scale,
      5,
    );
    drawArrowHead(
      this.ctx,
      screenPos.x + (width - this.extendArrowPadding) * this.panZoom.scale,
      screenPos.y + (height * this.panZoom.scale) / 2,
      Math.PI / 2,
      this.panZoom.scale,
      5,
    );
  }

  drawLeftButton(color: string) {
    const width = this.buttonHeight;
    const height = this.rowCount * this.gridSquareLength;
    const { screenPos, worldPos } = this.findLeftTopPosForButton(
      ButtonDirection.LEFT,
      width,
      height,
    );
    this.leftButtonDimensions = {
      x: worldPos.x,
      y: worldPos.y,
      width,
      height,
    };
    drawExtendButton(
      this.ctx,
      screenPos,
      color,
      width,
      height,
      this.panZoom.scale,
    );
    drawArrowHead(
      this.ctx,
      screenPos.x + this.extendArrowPadding * this.panZoom.scale,
      screenPos.y + (height * this.panZoom.scale) / 2,
      -Math.PI / 2,
      this.panZoom.scale,
      5,
    );
    drawArrowHead(
      this.ctx,
      screenPos.x + (width - this.extendArrowPadding) * this.panZoom.scale,
      screenPos.y + (height * this.panZoom.scale) / 2,
      Math.PI / 2,
      this.panZoom.scale,
      5,
    );
  }

  drawTopButton(color: string) {
    const width = this.columnCount * this.gridSquareLength;
    const height = this.buttonHeight;
    const { screenPos, worldPos } = this.findLeftTopPosForButton(
      ButtonDirection.TOP,
      width,
      height,
    );
    this.topButtonDimensions = {
      x: worldPos.x,
      y: worldPos.y,
      width,
      height,
    };
    drawExtendButton(
      this.ctx,
      screenPos,
      color,
      width,
      height,
      this.panZoom.scale,
    );
    drawArrowHead(
      this.ctx,
      screenPos.x + (width * this.panZoom.scale) / 2,
      screenPos.y + this.extendArrowPadding * this.panZoom.scale,
      Math.PI * 2,
      this.panZoom.scale,
      5,
    );
    drawArrowHead(
      this.ctx,
      screenPos.x + (width * this.panZoom.scale) / 2,
      screenPos.y + (height - this.extendArrowPadding) * this.panZoom.scale,
      Math.PI,
      this.panZoom.scale,
      5,
    );
  }

  drawBottomButton(color: string) {
    const width = this.columnCount * this.gridSquareLength;
    const height = this.buttonHeight;
    const { screenPos, worldPos } = this.findLeftTopPosForButton(
      ButtonDirection.BOTTOM,
      width,
      height,
    );
    this.bottomButtonDimensions = {
      x: worldPos.x,
      y: worldPos.y,
      width,
      height,
    };
    drawExtendButton(
      this.ctx,
      screenPos,
      color,
      width,
      height,
      this.panZoom.scale,
    );
    drawArrowHead(
      this.ctx,
      screenPos.x + (width * this.panZoom.scale) / 2,
      screenPos.y + this.extendArrowPadding * this.panZoom.scale,
      Math.PI * 2,
      this.panZoom.scale,
      5,
    );
    drawArrowHead(
      this.ctx,
      screenPos.x + (width * this.panZoom.scale) / 2,
      screenPos.y + (height - this.extendArrowPadding) * this.panZoom.scale,
      Math.PI,
      this.panZoom.scale,
      5,
    );
  }

  drawDiagonalButtons(color: string, direction: ButtonDirection) {
    const height = this.buttonHeight,
      width = this.buttonHeight;
    const { screenPos, worldPos } = this.findLeftTopPosForButton(
      direction,
      width,
      height,
    );
    drawExtendButton(
      this.ctx,
      screenPos,
      color,
      width,
      height,
      this.panZoom.scale,
    );
    drawArrowHead(
      this.ctx,
      direction === ButtonDirection.TOPLEFT ||
        direction === ButtonDirection.BOTTOMRIGHT
        ? screenPos.x +
            this.extendArrowPadding * Math.sqrt(2) * this.panZoom.scale
        : screenPos.x +
            (width - this.extendArrowPadding * Math.sqrt(2)) *
              this.panZoom.scale,
      screenPos.y + this.extendArrowPadding * Math.sqrt(2) * this.panZoom.scale,
      direction === ButtonDirection.TOPLEFT ||
        direction === ButtonDirection.BOTTOMRIGHT
        ? -(Math.PI * 1) / 4
        : (Math.PI * 1) / 4,
      this.panZoom.scale,
      5,
    );
    drawArrowHead(
      this.ctx,
      direction === ButtonDirection.TOPLEFT ||
        direction === ButtonDirection.BOTTOMRIGHT
        ? screenPos.x +
            (width - this.extendArrowPadding * Math.sqrt(2)) *
              this.panZoom.scale
        : screenPos.x +
            this.extendArrowPadding * Math.sqrt(2) * this.panZoom.scale,
      screenPos.y +
        (height - this.extendArrowPadding * Math.sqrt(2)) * this.panZoom.scale,
      direction === ButtonDirection.TOPLEFT ||
        direction === ButtonDirection.BOTTOMRIGHT
        ? (Math.PI * 3) / 4
        : -(Math.PI * 3) / 4,
      this.panZoom.scale,
      5,
    );
    switch (direction) {
      case ButtonDirection.TOPLEFT: {
        this.topLeftButtonDimensions = {
          x: worldPos.x,
          y: worldPos.y,
          width,
          height,
        };
        break;
      }
      case ButtonDirection.TOPRIGHT: {
        this.topRightButtonDimensions = {
          x: worldPos.x,
          y: worldPos.y,
          width,
          height,
        };
        break;
      }
      case ButtonDirection.BOTTOMLEFT: {
        this.bottomLeftButtonDimensions = {
          x: worldPos.x,
          y: worldPos.y,
          width,
          height,
        };
        break;
      }
      case ButtonDirection.BOTTOMRIGHT: {
        this.bottomRightButtonDimensions = {
          x: worldPos.x,
          y: worldPos.y,
          width,
          height,
        };
        break;
      }
    }
  }

  drawSurroundingDashedLines(correctedLefTopScreenPoint: Coord) {
    const offsetFromPixelCanvas =
      DashedLineOffsetFromPixelCanvas * this.panZoom.scale;
    const ctx = this.ctx;
    ctx.save();
    const dash = 5 * this.panZoom.scale;
    const gap = 5 * this.panZoom.scale;
    ctx.setLineDash([dash, gap]);
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 1;
    const squareLength = this.gridSquareLength * this.panZoom.scale;
    ctx.beginPath();
    ctx.moveTo(
      correctedLefTopScreenPoint.x - offsetFromPixelCanvas,
      correctedLefTopScreenPoint.y - offsetFromPixelCanvas,
    );
    ctx.lineTo(
      correctedLefTopScreenPoint.x +
        this.columnCount * squareLength +
        offsetFromPixelCanvas,
      correctedLefTopScreenPoint.y - offsetFromPixelCanvas,
    );
    ctx.lineTo(
      correctedLefTopScreenPoint.x +
        this.columnCount * squareLength +
        offsetFromPixelCanvas,
      correctedLefTopScreenPoint.y +
        this.rowCount * squareLength +
        offsetFromPixelCanvas,
    );
    ctx.lineTo(
      correctedLefTopScreenPoint.x - offsetFromPixelCanvas,
      correctedLefTopScreenPoint.y +
        this.rowCount * squareLength +
        offsetFromPixelCanvas,
    );
    ctx.lineTo(
      correctedLefTopScreenPoint.x - offsetFromPixelCanvas,
      correctedLefTopScreenPoint.y - offsetFromPixelCanvas,
    );
    ctx.stroke();
    ctx.restore();

    // ctx.save();
    // ctx.strokeStyle = "#333333";
    // ctx.lineWidth = 1;
    // ctx.beginPath();
    // ctx.moveTo(
    //   correctedLefTopScreenPoint.x - offsetFromPixelCanvas * 2,
    //   correctedLefTopScreenPoint.y - offsetFromPixelCanvas * 2,
    // );
    // ctx.lineTo(
    //   correctedLefTopScreenPoint.x +
    //     this.columnCount * squareLength +
    //     offsetFromPixelCanvas * 2,
    //   correctedLefTopScreenPoint.y - offsetFromPixelCanvas * 2,
    // );
    // ctx.lineTo(
    //   correctedLefTopScreenPoint.x +
    //     this.columnCount * squareLength +
    //     offsetFromPixelCanvas * 2,
    //   correctedLefTopScreenPoint.y +
    //     this.rowCount * squareLength +
    //     offsetFromPixelCanvas * 2,
    // );
    // ctx.lineTo(
    //   correctedLefTopScreenPoint.x - offsetFromPixelCanvas * 2,
    //   correctedLefTopScreenPoint.y +
    //     this.rowCount * squareLength +
    //     offsetFromPixelCanvas * 2,
    // );
    // ctx.lineTo(
    //   correctedLefTopScreenPoint.x - offsetFromPixelCanvas * 2,
    //   correctedLefTopScreenPoint.y - offsetFromPixelCanvas * 2,
    // );
    // ctx.stroke();
    // ctx.restore();
  }

  drawCircleButtonAlongDashedLine(correctedLefTopScreenPoint: Coord) {
    const offsetFromPixelCanvas =
      DashedLineOffsetFromPixelCanvas * this.panZoom.scale;
    const ctx = this.ctx;
    const squareLength = this.gridSquareLength * this.panZoom.scale;
    const leftTopCorner = {
      x: correctedLefTopScreenPoint.x - offsetFromPixelCanvas,
      y: correctedLefTopScreenPoint.y - offsetFromPixelCanvas,
    };
    const radius = ExtensionGuideCircleRadius * this.panZoom.scale;
    const topMiddle = {
      x: correctedLefTopScreenPoint.x + (this.columnCount * squareLength) / 2,
      y: correctedLefTopScreenPoint.y - offsetFromPixelCanvas,
    };
    const rightTopCorner = {
      x:
        correctedLefTopScreenPoint.x +
        this.columnCount * squareLength +
        offsetFromPixelCanvas,
      y: correctedLefTopScreenPoint.y - offsetFromPixelCanvas,
    };
    const rightMiddle = {
      x:
        correctedLefTopScreenPoint.x +
        this.columnCount * squareLength +
        offsetFromPixelCanvas,
      y: correctedLefTopScreenPoint.y + (this.rowCount * squareLength) / 2,
    };
    const rightBottomCorner = {
      x:
        correctedLefTopScreenPoint.x +
        this.columnCount * squareLength +
        offsetFromPixelCanvas,
      y:
        correctedLefTopScreenPoint.y +
        this.rowCount * squareLength +
        offsetFromPixelCanvas,
    };
    const bottomMiddle = {
      x: correctedLefTopScreenPoint.x + (this.columnCount * squareLength) / 2,
      y:
        correctedLefTopScreenPoint.y +
        this.rowCount * squareLength +
        offsetFromPixelCanvas,
    };
    const leftBottomCorner = {
      x: correctedLefTopScreenPoint.x - offsetFromPixelCanvas,
      y:
        correctedLefTopScreenPoint.y +
        this.rowCount * squareLength +
        offsetFromPixelCanvas,
    };
    const leftMiddle = {
      x: correctedLefTopScreenPoint.x - offsetFromPixelCanvas,
      y: correctedLefTopScreenPoint.y + (this.rowCount * squareLength) / 2,
    };
    [
      leftTopCorner,
      topMiddle,
      rightTopCorner,
      rightMiddle,
      rightBottomCorner,
      bottomMiddle,
      leftBottomCorner,
      leftMiddle,
    ].forEach(position =>
      drawCircle(ctx, position, radius, "#ffffff", "#5A7FF7", 1),
    );
  }

  drawButtons() {
    const buttonBackgroundColor = "transparent";
    const onHoverbuttonBackgroundColor = "rgba(50,50,50,0.4)";
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
    [
      ButtonDirection.TOPLEFT,
      ButtonDirection.TOPRIGHT,
      ButtonDirection.BOTTOMLEFT,
      ButtonDirection.BOTTOMRIGHT,
    ].forEach(direction =>
      this.drawDiagonalButtons(
        this.hoveredButton === direction
          ? onHoverbuttonBackgroundColor
          : buttonBackgroundColor,
        direction,
      ),
    );
  }

  renderSelection(area: { startWorldPos: Coord; endWorldPos: Coord }) {
    const ctx = this.ctx;
    const { startWorldPos, endWorldPos } = area;
    const convertedStartWorldPos = convertCartesianToScreen(
      this.element,
      startWorldPos,
      this.dpr,
    );
    const convertedEndWorldPos = convertCartesianToScreen(
      this.element,
      endWorldPos,
      this.dpr,
    );
    const startScreenPos = getScreenPoint(convertedStartWorldPos, this.panZoom);
    const endScreenPos = getScreenPoint(convertedEndWorldPos, this.panZoom);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(startScreenPos.x, startScreenPos.y);
    ctx.lineTo(endScreenPos.x, startScreenPos.y);
    ctx.lineTo(endScreenPos.x, endScreenPos.y);
    ctx.lineTo(startScreenPos.x, endScreenPos.y);
    ctx.lineTo(startScreenPos.x, startScreenPos.y);
    ctx.closePath();
    ctx.strokeStyle = "#fc933c";
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.restore();
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
    const columnKeys = this.getColumnKeyOrderMap();
    const rowKeys = this.getRowKeyOrderMap();
    const leftColumnKey = Math.min(...columnKeys.keys());
    const topRowKey = Math.min(...rowKeys.keys());
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    const squareLength = this.gridSquareLength * this.panZoom.scale;
    // leftTopPoint is a cartesian coordinate
    const leftTopPoint: Coord = {
      x: 0,
      y: 0,
    };
    const convertedScreenPoint = convertCartesianToScreen(
      this.element,
      leftTopPoint,
      this.dpr,
    );
    const correctedScreenPoint = getScreenPoint(
      convertedScreenPoint,
      this.panZoom,
    );
    if (!this.isGridFixed) {
      this.drawButtons();
      this.drawSurroundingDashedLines(correctedScreenPoint);
      this.drawCircleButtonAlongDashedLine(correctedScreenPoint);
    }
    if (!this.isGridVisible) {
      return;
    }
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
