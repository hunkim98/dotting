import { ButtonDirection } from ".";
import { PixelChangeRecords } from "../../helpers/PixelChangeRecords";
import EventDispatcher from "../../utils/eventDispatcher";
import {
  convertCartesianToScreen,
  diffPoints,
  getScreenPoint,
  getWorldPoint,
} from "../../utils/math";
import { drawExtendButton } from "../../utils/shapes";
import { TouchyEvent } from "../../utils/touch";
import { BaseLayer } from "./BaseLayer";
import { DefaultButtonHeight, DefaultGridSquareLength } from "./config";
import { Coord, PixelModifyItem } from "./types";

export default class InteractionLayer extends BaseLayer {
  private isPanZoomable: boolean;

  private strokedPixelRecords: PixelChangeRecords;

  private erasedPixelRecords: PixelChangeRecords;

  private swipedPixels: Array<PixelModifyItem> = [];

  private indicatorPixels: Array<PixelModifyItem> = [];

  private isInteractionEnabled: boolean = true;

  private isInteractionApplied: boolean = true;

  private columnCount: number;

  private rowCount: number;

  private gridSquareLength: number = DefaultGridSquareLength;

  constructor({ canvas }: { canvas: HTMLCanvasElement }) {
    super({ canvas });
  }

  setIndicatorPixels(indicatorPixels: Array<PixelModifyItem>) {
    this.indicatorPixels = indicatorPixels;
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

  /**
   * Interaction Layer render will be called when:
   * 1. The canvas is resized
   * 2. The canvas is panned or zoomed
   * 3. The canvas is mouse clicked or touched
   * 4. The pixel grid is hovered
   * 5. The indicator pixel changes
   */
  render() {}
}
