import { DottingData, PixelModifyItem } from "../components/Canvas/types";
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
  private isVisible = true;
  constructor({
    data,
    id,
  }: {
    data: Array<Array<PixelModifyItem>>;
    id: string;
  }) {
    super();
    const { isDataValid } = validateSquareArray(data);
    const leftColumnIndex = data[0][0].columnIndex;
    const topRowIndex = data[0][0].rowIndex;
    if (!isDataValid) {
      throw new Error("Data is not valid");
    }

    this.data = new Map();
    this.id = id;
    for (let i = 0; i < data.length; i++) {
      this.data.set(topRowIndex + i, new Map());
      for (let j = 0; j < data[i].length; j++) {
        this.data
          .get(topRowIndex + i)!
          .set(leftColumnIndex + j, { color: data[i][j].color });
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
      return null;
    }
    this.data.set(rowIndex, new Map());
    for (const i of columnKeys) {
      this.data.get(rowIndex)!.set(i, { color: "" });
    }
    this.notify(this.getCopiedData());
    return rowIndex;
  };

  addColumnToData = (columnIndex: number) => {
    let validColumnIndex = null;
    this.data.forEach(row => {
      if (!row.has(columnIndex)) {
        validColumnIndex = columnIndex;
        row.set(columnIndex, { color: "" });
      }
    });
    this.notify(this.getCopiedData());
    return validColumnIndex;
  };

  deleteRowOfData(rowIndex: number) {
    let validRowIndex = null;
    if (!this.data.has(rowIndex)) {
      throw new Error("Row does not exist");
    }
    validRowIndex = rowIndex;
    this.data.delete(rowIndex);
    this.notify(this.getCopiedData());
    return validRowIndex;
  }

  deleteColumnOfData(columnIndex: number) {
    let validColumnIndex = null;
    this.data.forEach(row => {
      if (!row.has(columnIndex)) {
        throw new Error("Column does not exist");
      }
      validColumnIndex = columnIndex;
      row.delete(columnIndex);
    });
    this.notify(this.getCopiedData());
    return validColumnIndex;
  }

  getCopiedData = (): DottingData => {
    const copiedData = new Map();
    this.data.forEach((row, rowIndex) => {
      copiedData.set(rowIndex, new Map());
      row.forEach((column, columnIndex) => {
        copiedData.get(rowIndex)!.set(columnIndex, { ...column });
      });
    });
    return copiedData;
  };

  setData(data: DottingData) {
    this.data = data;
    this.notify(this.getCopiedData());
  }

  setIsVisible(isVisible: boolean) {
    this.isVisible = isVisible;
  }

  getData() {
    return this.data;
  }

  getIsVisible() {
    return this.isVisible;
  }

  getDataArray(): Array<Array<PixelModifyItem>> {
    const data = [];
    [...this.data.entries()].forEach(([rowIndex, row]) => {
      const rowData = [];
      [...row.entries()].forEach(([columnIndex, column]) => {
        rowData.push({
          rowIndex,
          columnIndex,
          color: column.color,
        });
      });
      data.push(rowData);
    });
    return data;
  }
}
