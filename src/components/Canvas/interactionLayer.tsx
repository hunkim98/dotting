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
  // We make this a map to allow for multiple users to interact with the canvas
  // the key will be the user id
  private strokedPixelRecords: Map<UserId, PixelChangeRecords> = new Map();

  private erasedPixelRecords: Map<UserId, PixelChangeRecords> = new Map();

  // this is for tracking pixels that were applied to data canvas
  // while the user was changing the dimensions of the data canvas
  // ( = the captured Data is not null)
  private tempStrokedPixels: Array<PixelModifyItem> = [];

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
    color: string;
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
    this.capturedData = new Map();
    for (const row of Array.from(gridChangeStartCapturedData.entries())) {
      const [rowIndex, rowData] = row;
      this.capturedData.set(rowIndex, new Map(rowData));
    }
    this.capturedDataOriginalIndices = getGridIndicesFromData(
      gridChangeStartCapturedData,
    );
  }

  resetCapturedData() {
    this.capturedData = null;
    this.capturedDataOriginalIndices = null;
    this.deleteStrokePixelRecord(TemporaryUserId);
    this.swipedPixels = [];
  }

  getHoveredPixel() {
    return this.hoveredPixel;
  }

  setHoveredPixel(
    hoveredPixel: {
      rowIndex: number;
      columnIndex: number;
      color: string;
    } | null,
  ) {
    this.hoveredPixel = hoveredPixel;
  }

  getStrokedPixelRecords() {
    return this.strokedPixelRecords;
  }

  getEffectiveStrokePixelChanges(userId: UserId) {
    if (!this.strokedPixelRecords.has(userId)) {
      return [];
    }
    return this.strokedPixelRecords.get(userId)!.getEffectiveChanges();
  }

  getErasedPixelRecords() {
    return this.erasedPixelRecords;
  }

  getEffectiveEraserPixelChanges(userId: UserId) {
    if (!this.erasedPixelRecords.has(userId)) {
      return [];
    }
    return this.erasedPixelRecords.get(userId)!.getEffectiveChanges();
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
      // this.swipedPixels = this.swipedPixels.filter(
      //   swipedPixel => swipedPixel.rowIndex !== newRowIndex,
      // );
      addRowToData(this.capturedData, newRowIndex);
    } else if (
      direction === ButtonDirection.LEFT ||
      direction === ButtonDirection.RIGHT
    ) {
      const newColumnIndex =
        direction === ButtonDirection.LEFT
          ? leftColumnIndex - 1
          : rightColumnIndex + 1;
      // this.swipedPixels = this.swipedPixels.filter(
      //   swipedPixel => swipedPixel.columnIndex !== newColumnIndex,
      // );
      addColumnToData(this.capturedData, newColumnIndex);
    }
  }

  shortenCapturedData(direction: ButtonDirection): boolean {
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
        console.log("row count less than 2");
        return false;
      }
      const swipedRowIndex =
        direction === ButtonDirection.TOP ? topRowIndex : bottomRowIndex;
      const swipedRowPixels = extractColoredPixelsFromRow(
        this.capturedData,
        swipedRowIndex,
      );
      pixelModifyItems.push(...swipedRowPixels);
      // delete the row in captured data
      deleteRowOfData(this.capturedData, swipedRowIndex);
    } else if (
      direction === ButtonDirection.LEFT ||
      direction === ButtonDirection.RIGHT
    ) {
      if (columnCount <= 2) {
        console.log("column count less than 2");
        return false;
      }
      const swipedColumnIndex =
        direction === ButtonDirection.LEFT ? leftColumnIndex : rightColumnIndex;
      const swipedColumnPixels = extractColoredPixelsFromColumn(
        this.capturedData,
        swipedColumnIndex,
      );
      pixelModifyItems.push(...swipedColumnPixels);
      deleteColumnOfData(this.capturedData, swipedColumnIndex);
    }
    this.addToSwipedPixels(pixelModifyItems);
    return true;
  }

  setIndicatorPixels(indicatorPixels: Array<PixelModifyItem>) {
    if (Array.isArray(indicatorPixels)) {
      this.indicatorPixels = indicatorPixels;
    }
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
  }

  deleteStrokePixelRecord(userId: UserId) {
    this.strokedPixelRecords.delete(userId);
  }

  // this will be called when multiplayer user (finishes) changing the color
  // while the user is changing the dimensions of the canvas
  colorPixels(data: Array<PixelModifyItem>) {
    this.tempStrokedPixels.push(...data);
  }

  // this will be called when multiplayer user (finishes) changing the color
  // while the user is changing the dimensions of the canvas
  erasePixels(data: Array<{ rowIndex: number; columnIndex: number }>) {
    this.tempStrokedPixels.push(...data.map(item => ({ ...item, color: "" })));
  }

  renderStrokedPixels(
    correctedLeftTopScreenPoint: Coord,
    squareLength: number,
  ) {
    const ctx = this.ctx;
    const doesCapturedDataExist = this.capturedData !== null;
    const allStrokedPixels = this.getAllStrokePixels().filter(item => {
      if (!doesCapturedDataExist) {
        return true;
      } else {
        const gridIndices = getGridIndicesFromData(this.capturedData);
        return (
          item.rowIndex < gridIndices.topRowIndex ||
          item.rowIndex > gridIndices.bottomRowIndex ||
          item.columnIndex < gridIndices.leftColumnIndex ||
          item.columnIndex > gridIndices.rightColumnIndex
        );
      }
    });
    const tempColorPixelsToStroke = this.tempStrokedPixels
      .filter(item => item.color !== "")
      .filter(item => {
        if (!doesCapturedDataExist) {
          return true;
        } else {
          const gridIndices = getGridIndicesFromData(this.capturedData);
          return (
            item.rowIndex < gridIndices.topRowIndex ||
            item.rowIndex > gridIndices.bottomRowIndex ||
            item.columnIndex < gridIndices.leftColumnIndex ||
            item.columnIndex > gridIndices.rightColumnIndex
          );
        }
      });
    ctx.save();
    for (const item of allStrokedPixels) {
      const relativeRowIndex = this.rowKeyOrderMap.get(item.rowIndex);
      const relativeColumnIndex = this.columnKeyOrderMap.get(item.columnIndex);
      if (relativeRowIndex === undefined || relativeColumnIndex === undefined) {
        continue;
      }
      ctx.fillStyle = item.color;
      ctx.fillRect(
        relativeColumnIndex * squareLength + correctedLeftTopScreenPoint.x,
        relativeRowIndex * squareLength + correctedLeftTopScreenPoint.y,
        squareLength,
        squareLength,
      );
    }
    for (const item of tempColorPixelsToStroke) {
      const relativeRowIndex = this.rowKeyOrderMap.get(item.rowIndex);
      const relativeColumnIndex = this.columnKeyOrderMap.get(item.columnIndex);
      if (relativeRowIndex === undefined || relativeColumnIndex === undefined) {
        continue;
      }
      ctx.fillStyle = item.color;
      ctx.fillRect(
        relativeColumnIndex * squareLength + correctedLeftTopScreenPoint.x,
        relativeRowIndex * squareLength + correctedLeftTopScreenPoint.y,
        squareLength,
        squareLength,
      );
    }
    ctx.restore();
  }

  renderErasedPixels(correctedLeftTopScreenPoint: Coord, squareLength: number) {
    const tempErasePixels = this.tempStrokedPixels.filter(
      item => item.color == "",
    );
    const allErasedPixels = this.getAllErasedPixels();
    const ctx = this.ctx;
    ctx.save();
    for (const item of allErasedPixels) {
      const relativeRowIndex = this.rowKeyOrderMap.get(item.rowIndex);
      const relativeColumnIndex = this.columnKeyOrderMap.get(item.columnIndex);
      if (relativeRowIndex === undefined || relativeColumnIndex === undefined) {
        continue;
      }
      ctx.clearRect(
        relativeColumnIndex * squareLength + correctedLeftTopScreenPoint.x,
        relativeRowIndex * squareLength + correctedLeftTopScreenPoint.y,
        squareLength,
        squareLength,
      );
    }
    for (const item of tempErasePixels) {
      const relativeRowIndex = this.rowKeyOrderMap.get(item.rowIndex);
      const relativeColumnIndex = this.columnKeyOrderMap.get(item.columnIndex);
      if (relativeRowIndex === undefined || relativeColumnIndex === undefined) {
        continue;
      }
      ctx.clearRect(
        relativeColumnIndex * squareLength + correctedLeftTopScreenPoint.x,
        relativeRowIndex * squareLength + correctedLeftTopScreenPoint.y,
        squareLength,
        squareLength,
      );
    }
  }

  renderIndicatorPixels(
    correctedLeftTopScreenPoint: Coord,
    squareLength: number,
  ) {
    if (this.indicatorPixels.length == 0) {
      return;
    }
    const ctx = this.ctx;
    ctx.save();
    for (const item of this.indicatorPixels) {
      ctx.fillStyle = item.color;
      ctx.globalAlpha = 0.5;
      const relativeRowIndex = this.rowKeyOrderMap.get(item.rowIndex);
      const relativeColumnIndex = this.columnKeyOrderMap.get(item.columnIndex);
      if (relativeRowIndex === undefined || relativeColumnIndex === undefined) {
        continue;
      }
      // first erase the color inside the square
      ctx.clearRect(
        relativeColumnIndex * squareLength + correctedLeftTopScreenPoint.x,
        relativeRowIndex * squareLength + correctedLeftTopScreenPoint.y,
        squareLength,
        squareLength,
      );
      ctx.fillRect(
        relativeColumnIndex * squareLength + correctedLeftTopScreenPoint.x,
        relativeRowIndex * squareLength + correctedLeftTopScreenPoint.y,
        squareLength,
        squareLength,
      );
    }
    ctx.restore();
  }

  renderHoveredPixel(correctedLeftTopScreenPoint: Coord, squareLength: number) {
    if (this.hoveredPixel === null) {
      return;
    }
    const ctx = this.ctx;
    const { rowIndex, columnIndex } = this.hoveredPixel;
    const relativeRowIndex = this.rowKeyOrderMap.get(rowIndex);
    const relativeColumnIndex = this.columnKeyOrderMap.get(columnIndex);
    if (relativeRowIndex === undefined || relativeColumnIndex === undefined) {
      return;
    }
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.clearRect(
      relativeColumnIndex * squareLength + correctedLeftTopScreenPoint.x,
      relativeRowIndex * squareLength + correctedLeftTopScreenPoint.y,
      squareLength,
      squareLength,
    );
    ctx.fillStyle = this.hoveredPixel.color;
    ctx.fillRect(
      relativeColumnIndex * squareLength + correctedLeftTopScreenPoint.x,
      relativeRowIndex * squareLength + correctedLeftTopScreenPoint.y,
      squareLength,
      squareLength,
    );
    ctx.restore();
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
    const rowCount = doesCapturedDataExist
      ? getRowCountFromData(this.capturedData)
      : this.dataLayerRowCount;
    const columnCount = doesCapturedDataExist
      ? getColumnCountFromData(this.capturedData)
      : this.dataLayerColumnCount;
    const leftTopPoint: Coord = {
      x: -((columnCount / 2) * this.gridSquareLength),
      y: -((rowCount / 2) * this.gridSquareLength),
    };
    const convertedLetTopScreenPoint = convertCartesianToScreen(
      this.element,
      leftTopPoint,
      this.dpr,
    );
    const correctedLeftTopScreenPoint = getScreenPoint(
      convertedLetTopScreenPoint,
      this.panZoom,
    );
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    this.renderStrokedPixels(correctedLeftTopScreenPoint, squareLength);
    this.renderErasedPixels(correctedLeftTopScreenPoint, squareLength);
    this.renderIndicatorPixels(correctedLeftTopScreenPoint, squareLength);
    this.renderHoveredPixel(correctedLeftTopScreenPoint, squareLength);
    //draw indicator pixels on top of the canvas
  }
}
