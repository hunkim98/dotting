import { BaseLayer } from "./BaseLayer";
import { DottingData, PixelData, PixelModifyItem } from "./types";
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
  validatePixelArrayData,
} from "../../utils/data";
import { ButtonDirection, DefaultPixelDataDimensions } from "./config";

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

  /**
   * The name is setSwipedPixels since the data layer will not accept adding items to swiped pixels
   * @param pixel
   */
  setSwipedPixels(pixelItems: Array<PixelModifyItem>) {
    this.swipedPixels = pixelItems;
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
    return;
  }
}
