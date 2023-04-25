import { BaseLayer } from "./BaseLayer";
import {
  ColorChangeItem,
  Coord,
  DottingData,
  PixelData,
  PixelModifyItem,
} from "./types";
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
import {
  ButtonDirection,
  DefaultGridSquareLength,
  DefaultPixelDataDimensions,
} from "./config";
import { ChangeAmountData } from "../../actions/SizeChangeAction";
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
    const { isDataValid } = validatePixelArrayData(initData);
    if (isDataValid && initData) {
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

  setData(data: DottingData) {
    this.data = data;
  }

  shortenGridBy(
    direction: ButtonDirection,
    amount: number,
    startIndex: number,
  ) {
    const shouldIncreaseIndex =
      direction === ButtonDirection.TOP || direction === ButtonDirection.LEFT;
    for (let i = 0; i < amount; i++) {
      const index = startIndex + (shouldIncreaseIndex ? i : -i);
      this.shortenGrid(direction, index);
    }
  }

  shortenGrid(direction: ButtonDirection, index: number) {
    const { columnCount, rowCount } = this.getDimensions();
    if (direction === ButtonDirection.TOP) {
      if (rowCount <= 2) {
        return;
      }
      const swipedPixels = extractColoredPixelsFromRow(this.data, index);
      this.swipedPixels.push(...swipedPixels);
      deleteRowOfData(this.data, index);
    } else if (direction === ButtonDirection.BOTTOM) {
      if (rowCount <= 2) {
        return;
      }
      const swipedPixels = extractColoredPixelsFromRow(this.data, index);
      this.swipedPixels.push(...swipedPixels);
      deleteRowOfData(this.data, index);
    } else if (direction === ButtonDirection.LEFT) {
      if (columnCount <= 2) {
        return;
      }
      const swipedPixels = extractColoredPixelsFromColumn(this.data, index);
      this.swipedPixels.push(...swipedPixels);
      deleteColumnOfData(this.data, index);
    } else if (direction === ButtonDirection.RIGHT) {
      if (columnCount <= 2) {
        return;
      }
      const swipedPixels = extractColoredPixelsFromColumn(this.data, index);
      this.swipedPixels.push(...swipedPixels);
      deleteColumnOfData(this.data, index);
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
        ButtonDirection.TOP,
        amount,
        currentCanvasIndices.topRowIndex,
      );
      changeAmounts.push({
        direction: ButtonDirection.TOP,
        amount,
        startIndex: currentCanvasIndices.topRowIndex,
      });
    }
    if (maxRowIndex > currentCanvasIndices.bottomRowIndex) {
      const amount = maxRowIndex - currentCanvasIndices.bottomRowIndex;
      this.extendGridBy(
        ButtonDirection.BOTTOM,
        amount,
        currentCanvasIndices.bottomRowIndex,
      );
      changeAmounts.push({
        direction: ButtonDirection.BOTTOM,
        amount,
        startIndex: currentCanvasIndices.bottomRowIndex,
      });
    }
    if (minColumnIndex < currentCanvasIndices.leftColumnIndex) {
      const amount = currentCanvasIndices.leftColumnIndex - minColumnIndex;
      this.extendGridBy(
        ButtonDirection.LEFT,
        amount,
        currentCanvasIndices.leftColumnIndex,
      );
      changeAmounts.push({
        direction: ButtonDirection.LEFT,
        amount,
        startIndex: currentCanvasIndices.leftColumnIndex,
      });
    }
    if (maxColumnIndex > currentCanvasIndices.rightColumnIndex) {
      const amount = maxColumnIndex - currentCanvasIndices.rightColumnIndex;
      this.extendGridBy(
        ButtonDirection.RIGHT,
        amount,
        currentCanvasIndices.rightColumnIndex,
      );
      changeAmounts.push({
        direction: ButtonDirection.RIGHT,
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

  extendGridBy(direction: ButtonDirection, amount: number, startIndex: number) {
    const shouldIncreaseIndex =
      direction === ButtonDirection.BOTTOM ||
      direction === ButtonDirection.RIGHT;
    for (let i = 0; i < amount; i++) {
      const index = startIndex + (shouldIncreaseIndex ? i : -i);
      this.extendGrid(direction, index);
    }
  }

  extendGrid(direction: ButtonDirection, index: number) {
    if (direction === ButtonDirection.TOP) {
      addRowToData(this.data, index);
    } else if (direction === ButtonDirection.BOTTOM) {
      addRowToData(this.data, index);
    } else if (direction === ButtonDirection.LEFT) {
      addColumnToData(this.data, index);
    } else if (direction === ButtonDirection.RIGHT) {
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
    const convertedLetTopScreenPoint = convertCartesianToScreen(
      this.element,
      leftTopPoint,
      this.dpr,
    );
    const correctedLeftTopScreenPoint = getScreenPoint(
      convertedLetTopScreenPoint,
      this.panZoom,
    );

    const allRowKeys = getRowKeysFromData(this.data);
    const allColumnKeys = getColumnKeysFromData(this.data);

    ctx.save();
    for (const i of allRowKeys) {
      for (const j of allColumnKeys) {
        const rowIndex = i;
        const columnIndex = j;

        const color = this.data.get(rowIndex)?.get(columnIndex)?.color;
        if (!color) {
          continue;
        }
        ctx.fillStyle = color;

        ctx.fillRect(
          j * squareLength + correctedLeftTopScreenPoint.x,
          i * squareLength + correctedLeftTopScreenPoint.y,
          squareLength,
          squareLength,
        );
      }
    }
    ctx.restore();
  }
}
