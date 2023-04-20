import { ButtonDirection } from ".";
import { PixelChangeRecords } from "../../helpers/PixelChangeRecords";
import { convertCartesianToScreen, getScreenPoint } from "../../utils/math";
import { drawExtendButton } from "../../utils/shapes";
import { BaseLayer } from "./baseLayer";
import { DefaultButtonHeight, DefaultGridSquareLength } from "./config";
import { Coord, PixelModifyItem } from "./types";

export default class InteractionLayer extends BaseLayer {
  private isPanZoomable: boolean;

  private isGridFixed: boolean;

  private strokedPixelRecords: PixelChangeRecords;

  private erasedPixelRecords: PixelChangeRecords;

  private swipedPixels: Array<PixelModifyItem> = [];

  private indicatorPixels: Array<PixelModifyItem> = [];

  private isInteractionEnabled: boolean = true;

  private isInteractionApplied: boolean = true;

  private hoveredButton: ButtonDirection | null = null;

  private columnCount: number;

  private rowCount: number;

  private gridSquareLength: number = DefaultGridSquareLength;

  private buttonHeight: number = DefaultButtonHeight;

  private buttonMargin: number = DefaultButtonHeight / 2 + 5;

  constructor({ canvas }: { canvas: HTMLCanvasElement }) {
    super({ canvas });
  }

  setIndicatorPixels(indicatorPixels: Array<PixelModifyItem>) {
    this.indicatorPixels = indicatorPixels;
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

  setColumnCount(columnCount: number) {
    this.columnCount = columnCount;
  }

  setRowCount(rowCount: number) {
    this.rowCount = rowCount;
  }

  // interaction element is the element that is used to interact with the canvas
  getElement() {
    return this.element;
  }

  render() {}
}
