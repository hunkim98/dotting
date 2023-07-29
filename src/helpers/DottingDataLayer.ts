import { DottingData } from "../components/Canvas/types";
import { Observable } from "../utils/observer";

class DottingDataLayer extends Observable<DottingData> {
  private data: DottingData;
  constructor({ data }: { data: DottingData }) {
    super();
    this.data = data;
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
}
