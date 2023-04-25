import { PixelChangeRecords } from "../../helpers/PixelChangeRecords";
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
import { convertCartesianToScreen, getScreenPoint } from "../../utils/math";
import { BaseLayer } from "./BaseLayer";
import {
  DefaultGridSquareLength,
  DimensionChangeRecord,
  UserId,
  ButtonDirection,
  TemporaryUserId,
} from "./config";
import {
  ColorChangeItem,
  Coord,
  DottingData,
  GridIndices,
  PixelModifyItem,
} from "./types";

export default class InteractionLayer extends BaseLayer {
  private isPanZoomable: boolean;

  // We make this a map to allow for multiple users to interact with the canvas
  // the key will be the user id
  private strokedPixelRecords: Map<UserId, PixelChangeRecords> = new Map();

  private erasedPixelRecords: Map<UserId, PixelChangeRecords> = new Map();

  private tempStrokedPixels: Array<PixelModifyItem> = [];

  // We make this a map to allow for multiple users to interact with the canvas
  // the key will be the user id
  private dimensionChangeRecord: DimensionChangeRecord = null;

  private swipedPixels: Array<PixelModifyItem> = [];

  private indicatorPixels: Array<PixelModifyItem> = [];

  private dataLayerRowCount: number;

  private dataLayerColumnCount: number;

  // this is to prevent other user's grid change from being applied to the canvas
  // when this is not null we will not render data layer
  // however, when this is not null we should send colored pixels
  private capturedData: DottingData | null = null;

  private capturedDataOriginalIndices: GridIndices | null = null;

  private hoveredPixel: {
    rowIndex: number;
    columnIndex: number;
  } | null = null;

  private gridSquareLength: number = DefaultGridSquareLength;

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
    this.dataLayerColumnCount = columnCount;
    this.dataLayerRowCount = rowCount;
  }

  setIsPanZoomable(isPanZoomable: boolean) {
    if (isPanZoomable !== undefined) {
      this.isPanZoomable = isPanZoomable;
    }
  }

  getCapturedData() {
    return this.capturedData;
  }

  getCapturedDataOriginalIndices() {
    return this.capturedDataOriginalIndices;
  }

  setDataLayerColumnCount(columnCount: number) {
    this.dataLayerColumnCount = columnCount;
  }

  setDataLayerRowCount(rowCount: number) {
    this.dataLayerRowCount = rowCount;
  }

  setCapturedData(gridChangeStartCapturedData: DottingData) {
    this.capturedData = gridChangeStartCapturedData;
    this.capturedDataOriginalIndices = getGridIndicesFromData(
      gridChangeStartCapturedData,
    );
  }

  resetCapturedData() {
    this.capturedData = null;
    this.capturedDataOriginalIndices = null;
    this.deleteStrokePixelRecord(TemporaryUserId);
  }

  getHoveredPixel() {
    return this.hoveredPixel;
  }

  setHoveredPixel(
    hoveredPixel: {
      rowIndex: number;
      columnIndex: number;
    } | null,
  ) {
    this.hoveredPixel = hoveredPixel;
  }

  // interaction element is the element that is used to interact with the canvas
  getElement() {
    return this.element;
  }

  getStrokedPixelRecords() {
    return this.strokedPixelRecords;
  }

  getErasedPixelRecords() {
    return this.erasedPixelRecords;
  }

  getSwipedPixels() {
    return this.swipedPixels;
  }

  getIndicatorPixels() {
    return this.indicatorPixels;
  }

  extendCapturedData(direction: ButtonDirection) {
    if (!this.capturedData) {
      throw new Error("There is no captured data");
    }
    const { topRowIndex, bottomRowIndex, leftColumnIndex, rightColumnIndex } =
      getGridIndicesFromData(this.capturedData);
    if (
      direction === ButtonDirection.TOP ||
      direction === ButtonDirection.BOTTOM
    ) {
      const newRowIndex =
        direction === ButtonDirection.TOP
          ? topRowIndex - 1
          : bottomRowIndex + 1;
      addRowToData(this.capturedData, newRowIndex);
    } else if (
      direction === ButtonDirection.LEFT ||
      direction === ButtonDirection.RIGHT
    ) {
      const newColumnIndex =
        direction === ButtonDirection.LEFT
          ? leftColumnIndex - 1
          : rightColumnIndex + 1;
      addColumnToData(this.capturedData, newColumnIndex);
      this.render();
    }
  }

  shortenCapturedData(direction: ButtonDirection) {
    if (!this.capturedData) {
      throw new Error("There is no captured data");
    }
    const { topRowIndex, bottomRowIndex, leftColumnIndex, rightColumnIndex } =
      getGridIndicesFromData(this.capturedData);
    const columnCount = getColumnCountFromData(this.capturedData);
    const rowCount = getRowCountFromData(this.capturedData);
    const pixelModifyItems: Array<PixelModifyItem> = [];
    if (
      direction === ButtonDirection.TOP ||
      direction === ButtonDirection.BOTTOM
    ) {
      if (rowCount <= 2) {
        return;
      }
      const swipedRowIndex =
        direction === ButtonDirection.TOP ? topRowIndex : bottomRowIndex;
      const swipedRowPixels = extractColoredPixelsFromRow(
        this.capturedData,
        swipedRowIndex,
      );
      pixelModifyItems.concat(swipedRowPixels);
      // delete the row in captured data
      deleteRowOfData(this.capturedData, swipedRowIndex);
    } else if (
      direction === ButtonDirection.LEFT ||
      direction === ButtonDirection.RIGHT
    ) {
      if (columnCount <= 2) {
        return;
      }
      const swipedColumnIndex =
        direction === ButtonDirection.LEFT ? leftColumnIndex : rightColumnIndex;
      const swipedColumnPixels = extractColoredPixelsFromColumn(
        this.capturedData,
        swipedColumnIndex,
      );
      pixelModifyItems.concat(swipedColumnPixels);
      deleteColumnOfData(this.capturedData, swipedColumnIndex);
    }
    this.addToSwipedPixels(pixelModifyItems);
    this.render();
  }

  setIndicatorPixels(indicatorPixels: Array<PixelModifyItem>) {
    this.indicatorPixels = indicatorPixels;
    this.render();
  }

  getDimensionChange() {
    return this.dimensionChangeRecord;
  }

  /**
   * Dimension change during interaction will not be able to be communicated to other users
   * The dimension changes that others make will be communicated after the user finishes interacting
   *
   * This is because there will be an error
   * when two users change one dimension at the same time
   * @param dimensionChangeRecord
   */
  setDimensionChangeRecord(dimensionChangeRecord: DimensionChangeRecord) {
    this.dimensionChangeRecord = dimensionChangeRecord;
    this.render();
  }

  /**
   * This function will be only used by the current device user
   * @param pixelItems
   */
  addToSwipedPixels(pixelItems: Array<PixelModifyItem>) {
    this.swipedPixels.push(...pixelItems);
  }

  /**
   * In the interaction layer,
   * This will only collect information of presence updating information
   * @param userId User id of the user who is changing the dimension
   * (the user of the current device will have id "current-device-user-id"
   * @param dimensionChangeRecord
   */
  addToStrokePixelRecords(userId: UserId, pixelItem: ColorChangeItem) {
    if (!this.strokedPixelRecords.has(userId)) {
      this.strokedPixelRecords.set(userId, new PixelChangeRecords());
    }
    this.strokedPixelRecords.get(userId)?.record(pixelItem);
    this.render();
  }

  getAllStrokePixels() {
    const allStrokePixels: Array<ColorChangeItem> = [];
    this.strokedPixelRecords.forEach(pixelChangeRecords => {
      allStrokePixels.push(...pixelChangeRecords.getEffectiveChanges());
    });
    return allStrokePixels;
  }

  addToErasedPixelRecords(userId: UserId, pixelItem: ColorChangeItem) {
    if (!this.erasedPixelRecords.has(userId)) {
      this.erasedPixelRecords.set(userId, new PixelChangeRecords());
    }
    this.erasedPixelRecords.get(userId)?.record(pixelItem);
    this.render();
  }

  getAllErasedPixels() {
    const allErasedPixels: Array<ColorChangeItem> = [];
    this.erasedPixelRecords.forEach(pixelChangeRecords => {
      allErasedPixels.push(...pixelChangeRecords.getEffectiveChanges());
    });
    return allErasedPixels;
  }

  deleteErasedPixelRecord(userId: UserId) {
    this.erasedPixelRecords.delete(userId);
    this.render();
  }

  deleteStrokePixelRecord(userId: UserId) {
    this.strokedPixelRecords.delete(userId);
    this.render();
  }

  // this will be called when multiplayer user (finishes) changing the color
  // while the user is changing the dimensions of the canvas
  colorPixels(data: Array<PixelModifyItem>) {
    this.tempStrokedPixels.concat(data);
    return;
  }

  /**
   * Interaction Layer render will be called when:
   * 1. The canvas is resized
   * 2. The canvas is panned or zoomed
   * 3. The canvas is mouse clicked or touched
   * 4. The pixel grid is hovered
   * 5. The indicator pixel changes
   */
  render() {
    const squareLength = this.gridSquareLength * this.panZoom.scale;
    // leftTopPoint is a cartesian coordinate
    const doesCapturedDataExist = this.capturedData !== null;
    const rowCount = this.capturedData
      ? getRowCountFromData(this.capturedData)
      : this.dataLayerRowCount;
    const columnCount = this.capturedData
      ? getColumnCountFromData(this.capturedData)
      : this.dataLayerColumnCount;
    const leftTopPoint: Coord = {
      x: -((columnCount / 2) * this.gridSquareLength),
      y: -((rowCount / 2) * this.gridSquareLength),
    };
    const ctx = this.ctx;
    const convertedLetTopScreenPoint = convertCartesianToScreen(
      this.element,
      leftTopPoint,
      this.dpr,
    );
    const correctedLeftTopScreenPoint = getScreenPoint(
      convertedLetTopScreenPoint,
      this.panZoom,
    );
    const allStrokedPixels = this.getAllStrokePixels().filter(item => {
      if (!doesCapturedDataExist) {
        return true;
      } else {
        const gridIndices = getGridIndicesFromData(this.capturedData);
        return (
          item.rowIndex >= gridIndices.topRowIndex &&
          item.rowIndex <= gridIndices.bottomRowIndex &&
          item.columnIndex >= gridIndices.leftColumnIndex &&
          item.columnIndex <= gridIndices.rightColumnIndex
        );
      }
    });
    const tempColorPixelsToStroke = this.tempStrokedPixels
      .filter(item => item.color !== "")
      .filter(item => {
        if (!doesCapturedDataExist) {
          return;
        } else {
          const gridIndices = getGridIndicesFromData(this.capturedData);
          return (
            item.rowIndex >= gridIndices.topRowIndex &&
            item.rowIndex <= gridIndices.bottomRowIndex &&
            item.columnIndex >= gridIndices.leftColumnIndex &&
            item.columnIndex <= gridIndices.rightColumnIndex
          );
        }
      });
    ctx.save();
    for (const item of allStrokedPixels) {
      ctx.fillStyle = item.color;
      ctx.fillRect(
        item.columnIndex * squareLength + correctedLeftTopScreenPoint.x,
        item.rowIndex * squareLength + correctedLeftTopScreenPoint.y,
        squareLength,
        squareLength,
      );
    }
    for (const item of tempColorPixelsToStroke) {
      ctx.fillStyle = item.color;
      ctx.fillRect(
        item.columnIndex * squareLength + correctedLeftTopScreenPoint.x,
        item.rowIndex * squareLength + correctedLeftTopScreenPoint.y,
        squareLength,
        squareLength,
      );
    }
    ctx.restore();
  }
}
