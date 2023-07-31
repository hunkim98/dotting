import { DottingData, PixelData } from "../components/Canvas/types";
import {
  getColumnCountFromData,
  getGridIndicesFromData,
  getRowCountFromData,
  validateSquareArray,
} from "../utils/data";
import { Observable } from "../utils/observer";

export class DottingDataLayer extends Observable<DottingData> {
  private data: DottingData;
  private id: string;
  constructor({ data, id }: { data: Array<Array<PixelData>>; id: string }) {
    super();
    const { isDataValid } = validateSquareArray(data);
    if (!isDataValid) {
      throw new Error("Data is not valid");
    }
    this.data = new Map();
    this.id = id;
    for (let i = 0; i < data.length; i++) {
      this.data.set(i, new Map());
      for (let j = 0; j < data[i].length; j++) {
        this.data.get(i)!.set(j, { color: data[i][j].color });
      }
    }
  }
  getDataInfo() {
    const gridIndices = getGridIndicesFromData(this.data);
    const columnCount = getColumnCountFromData(this.data);
    const rowCount = getRowCountFromData(this.data);
    return {
      gridIndices,
      columnCount,
      rowCount,
    };
  }

  getId() {
    return this.id;
  }

  getColumnKeysFromData = (): Array<number> => {
    const allRowKeys = Array.from(this.data.keys());
    const allColumnKeys = Array.from(this.data.get(allRowKeys[0])!.keys());
    return allColumnKeys;
  };

  addRowToData = (rowIndex: number) => {
    const columnKeys = this.getColumnKeysFromData();
    if (this.data.has(rowIndex)) {
      return;
    }
    this.data.set(rowIndex, new Map());
    for (const i of columnKeys) {
      this.data.get(rowIndex)!.set(i, { color: "" });
    }
    this.notify(this.copyData());
  };

  addColumnToData = (columnIndex: number) => {
    this.data.forEach(row => {
      if (!row.has(columnIndex)) {
        row.set(columnIndex, { color: "" });
      }
    });
    this.notify(this.copyData());
  };

  deleteRowOfData(rowIndex: number) {
    if (!this.data.has(rowIndex)) return;
    this.data.delete(rowIndex);
    this.notify(this.copyData());
  }

  deleteColumnOfData(columnIndex: number) {
    this.data.forEach(row => {
      if (!row.has(columnIndex)) return;
      row.delete(columnIndex);
    });
    this.notify(this.copyData());
  }

  copyData = (): DottingData => {
    const copiedData = new Map();
    this.data.forEach((row, rowIndex) => {
      copiedData.set(rowIndex, new Map());
      row.forEach((column, columnIndex) => {
        copiedData.get(rowIndex)!.set(columnIndex, { ...column });
      });
    });
    return copiedData;
  };

  getData() {
    return this.data;
  }
}
