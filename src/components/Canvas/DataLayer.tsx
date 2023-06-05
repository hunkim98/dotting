import { BaseLayer } from "./BaseLayer";
import {
  Direction,
  DefaultGridSquareLength,
  DefaultPixelDataDimensions,
} from "./config";
import {
  ColorChangeItem,
  Coord,
  DottingData,
  PixelData,
  PixelModifyItem,
} from "./types";
import { ChangeAmountData } from "../../actions/SizeChangeAction";
import {
  addColumnToData,
  addRowToData,
  deleteColumnOfData,
  deleteRowOfData,
  extractColoredPixelsFromColumn,
  extractColoredPixelsFromRow,
  getColumnCountFromData,
  getColumnKeysFromData,
  getGridIndicesFromData,
  getRowCountFromData,
  getRowKeysFromData,
  validatePixelArrayData,
} from "../../utils/data";
import { convertCartesianToScreen, getScreenPoint } from "../../utils/math";

export default class DataLayer extends BaseLayer {
  private swipedPixels: Array<PixelModifyItem> = [];
  private data: DottingData = new Map<
    // this number is rowIndex
    number,
    Map<
      // this number is columnIndex
      number,
      PixelData
    >
  >();
  private gridSquareLength: number = DefaultGridSquareLength;

  constructor({
    canvas,
    initData,
  }: {
    canvas: HTMLCanvasElement;
    initData?: Array<Array<PixelData>>;
  }) {
    super({ canvas });
    if (initData && validatePixelArrayData(initData).isDataValid) {
      for (let i = 0; i < initData.length; i++) {
        this.data.set(i, new Map());
        for (let j = 0; j < initData[i].length; j++) {
          this.data.get(i)!.set(j, { color: initData[i][j].color });
        }
      }
    } else {
      const { rowCount, columnCount } = DefaultPixelDataDimensions;
      for (let i = 0; i < rowCount; i++) {
        this.data.set(i, new Map());
        for (let j = 0; j < columnCount; j++) {
          this.data.get(i)!.set(j, { color: "" });
        }
      }
    }
  }

  getColumnCount() {
    return getColumnCountFromData(this.data);
  }

  getRowCount() {
    return getRowCountFromData(this.data);
  }

  getGridIndices() {
    return getGridIndicesFromData(this.data);
  }

  getDimensions() {
    return {
      columnCount: this.getColumnCount(),
      rowCount: this.getRowCount(),
    };
  }

  getData() {
    return this.data;
  }

  getCopiedData() {
    const copiedMap = new Map();
    Array.from(this.data.entries()).forEach(([rowIndex, row]) => {
      const copiedRow = new Map();
      Array.from(row.entries()).forEach(([columnIndex, pixelData]) => {
        copiedRow.set(columnIndex, { ...pixelData });
      });
      copiedMap.set(rowIndex, copiedRow);
    });
    return copiedMap;
  }

  getSwipedPixels() {
    return this.swipedPixels;
  }

  resetSwipedPixels() {
    this.swipedPixels = [];
  }

  setData(data: DottingData) {
    this.data = data;
  }

  shortenGridBy(direction: Direction, amount: number, startIndex: number) {
    const shouldIncreaseIndex =
      direction === Direction.TOP || direction === Direction.LEFT;
    for (let i = 0; i < amount; i++) {
      const index = startIndex + (shouldIncreaseIndex ? i : -i);
      this.shortenGrid(direction, index);
    }
  }

  shortenGrid(direction: Direction, index: number) {
    const { columnCount, rowCount } = this.getDimensions();
    const rowKeys = getRowKeysFromData(this.data);
    const columnKeys = getColumnKeysFromData(this.data);
    if (direction === Direction.TOP) {
      if (rowCount <= 2 || !rowKeys.includes(index)) {
        return;
      }
      const swipedPixels = extractColoredPixelsFromRow(this.data, index);
      this.swipedPixels.push(...swipedPixels);
      deleteRowOfData(this.data, index);
    } else if (direction === Direction.BOTTOM) {
      if (rowCount <= 2 || !rowKeys.includes(index)) {
        return;
      }
      const swipedPixels = extractColoredPixelsFromRow(this.data, index);
      this.swipedPixels.push(...swipedPixels);
      deleteRowOfData(this.data, index);
    } else if (direction === Direction.LEFT) {
      if (columnCount <= 2 || !columnKeys.includes(index)) {
        return;
      }
      const swipedPixels = extractColoredPixelsFromColumn(this.data, index);
      this.swipedPixels.push(...swipedPixels);
      deleteColumnOfData(this.data, index);
    } else if (direction === Direction.RIGHT) {
      if (columnCount <= 2 || !columnKeys.includes(index)) {
        return;
      }
      const swipedPixels = extractColoredPixelsFromColumn(this.data, index);
      this.swipedPixels.push(...swipedPixels);
      deleteColumnOfData(this.data, index);
    }
  }

  updatePixelColors(data: Array<PixelModifyItem>) {
    for (const item of data) {
      const { rowIndex, columnIndex, color } = item;
      if (
        this.data.get(rowIndex) &&
        this.data.get(rowIndex)!.get(columnIndex)
      ) {
        this.data.get(rowIndex)!.set(columnIndex, { color });
      }
    }
  }

  colorPixels(data: Array<PixelModifyItem>) {
    const rowIndices = data.map(change => change.rowIndex);
    const columnIndices = data.map(change => change.columnIndex);
    const minRowIndex = Math.min(...rowIndices);
    const maxRowIndex = Math.max(...rowIndices);
    const minColumnIndex = Math.min(...columnIndices);
    const maxColumnIndex = Math.max(...columnIndices);
    const currentCanvasIndices = this.getGridIndices();
    const changeAmounts: Array<ChangeAmountData> = [];
    if (minRowIndex < currentCanvasIndices.topRowIndex) {
      const amount = currentCanvasIndices.topRowIndex - minRowIndex;

      this.extendGridBy(
        Direction.TOP,
        amount,
        currentCanvasIndices.topRowIndex,
      );
      changeAmounts.push({
        direction: Direction.TOP,
        amount,
        startIndex: currentCanvasIndices.topRowIndex,
      });
    }
    if (maxRowIndex > currentCanvasIndices.bottomRowIndex) {
      const amount = maxRowIndex - currentCanvasIndices.bottomRowIndex;
      this.extendGridBy(
        Direction.BOTTOM,
        amount,
        currentCanvasIndices.bottomRowIndex,
      );
      changeAmounts.push({
        direction: Direction.BOTTOM,
        amount,
        startIndex: currentCanvasIndices.bottomRowIndex,
      });
    }
    if (minColumnIndex < currentCanvasIndices.leftColumnIndex) {
      const amount = currentCanvasIndices.leftColumnIndex - minColumnIndex;
      this.extendGridBy(
        Direction.LEFT,
        amount,
        currentCanvasIndices.leftColumnIndex,
      );
      changeAmounts.push({
        direction: Direction.LEFT,
        amount,
        startIndex: currentCanvasIndices.leftColumnIndex,
      });
    }
    if (maxColumnIndex > currentCanvasIndices.rightColumnIndex) {
      const amount = maxColumnIndex - currentCanvasIndices.rightColumnIndex;
      this.extendGridBy(
        Direction.RIGHT,
        amount,
        currentCanvasIndices.rightColumnIndex,
      );
      changeAmounts.push({
        direction: Direction.RIGHT,
        amount,
        startIndex: currentCanvasIndices.rightColumnIndex,
      });
    }
    const dataForAction: Array<ColorChangeItem> = [];
    for (const change of data) {
      const previousColor = this.data
        .get(change.rowIndex)!
        .get(change.columnIndex)!.color;
      const color = change.color;
      this.data
        .get(change.rowIndex)!
        .set(change.columnIndex, { color: change.color });
      dataForAction.push({ ...change, color, previousColor });
    }
    return {
      dataForAction,
      changeAmounts,
    };
  }

  erasePixels(data: Array<{ rowIndex: number; columnIndex: number }>) {
    const dataForAction: Array<ColorChangeItem> = [];
    for (const change of data) {
      const previousColor = this.data
        .get(change.rowIndex)!
        .get(change.columnIndex)!.color;
      const color = "";
      this.data.get(change.rowIndex)!.set(change.columnIndex, { color: "" });
      dataForAction.push({ ...change, color, previousColor });
    }
    return { dataForAction };
  }

  extendGridBy(direction: Direction, amount: number, startIndex: number) {
    const shouldIncreaseIndex =
      direction === Direction.BOTTOM || direction === Direction.RIGHT;
    for (let i = 1; i <= amount; i++) {
      const index = startIndex + (shouldIncreaseIndex ? i : -i);
      this.extendGrid(direction, index);
    }
  }

  extendGrid(direction: Direction, index: number) {
    if (direction === Direction.TOP) {
      addRowToData(this.data, index);
    } else if (direction === Direction.BOTTOM) {
      addRowToData(this.data, index);
    } else if (direction === Direction.LEFT) {
      addColumnToData(this.data, index);
    } else if (direction === Direction.RIGHT) {
      addColumnToData(this.data, index);
    }
  }

  render() {
    const squareLength = this.gridSquareLength * this.panZoom.scale;
    // leftTopPoint is a cartesian coordinate
    const leftTopPoint: Coord = {
      x: -((this.getColumnCount() / 2) * this.gridSquareLength),
      y: -((this.getRowCount() / 2) * this.gridSquareLength),
    };
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    const convertedLeftTopScreenPoint = convertCartesianToScreen(
      this.element,
      leftTopPoint,
      this.dpr,
    );
    const correctedLeftTopScreenPoint = getScreenPoint(
      convertedLeftTopScreenPoint,
      this.panZoom,
    );

    const allRowKeys = getRowKeysFromData(this.data);
    const allColumnKeys = getColumnKeysFromData(this.data);

    ctx.save();
    for (const i of allRowKeys) {
      for (const j of allColumnKeys) {
        const rowIndex = i;
        const columnIndex = j;
        const relativeRowIndex = this.rowKeyOrderMap.get(rowIndex);
        const relativeColumnIndex = this.columnKeyOrderMap.get(columnIndex);
        if (
          relativeRowIndex === undefined ||
          relativeColumnIndex === undefined
        ) {
          continue;
        }

        const color = this.data.get(rowIndex)?.get(columnIndex)?.color;
        if (!color) {
          continue;
        }
        ctx.fillStyle = color;

        ctx.fillRect(
          relativeColumnIndex * squareLength + correctedLeftTopScreenPoint.x,
          relativeRowIndex * squareLength + correctedLeftTopScreenPoint.y,
          squareLength,
          squareLength,
        );
      }
    }
    ctx.restore();
  }
}
