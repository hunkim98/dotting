import {
  DottingData,
  GridIndices,
  PixelData,
  PixelModifyItem,
} from "../components/Canvas/types";

export const getGridIndicesFromData = (data: DottingData): GridIndices => {
  const allRowKeys = Array.from(data.keys());
  const allColumnKeys = Array.from(data.get(allRowKeys[0])!.keys());
  const currentTopIndex = Math.min(...allRowKeys);
  const currentLeftIndex = Math.min(...allColumnKeys);
  const currentBottomIndex = Math.max(...allRowKeys);
  const currentRightIndex = Math.max(...allColumnKeys);
  return {
    topRowIndex: currentTopIndex,
    bottomRowIndex: currentBottomIndex,
    leftColumnIndex: currentLeftIndex,
    rightColumnIndex: currentRightIndex,
  };
};

export const getRowKeysFromData = (data: DottingData): Array<number> => {
  return Array.from(data.keys());
};

export const getColumnKeysFromData = (data: DottingData): Array<number> => {
  const allRowKeys = Array.from(data.keys());
  const allColumnKeys = Array.from(data.get(allRowKeys[0])!.keys());
  return allColumnKeys;
};

export const getColumnCountFromData = (data: DottingData): number => {
  if (data.size === 0) return 0;
  return data.entries().next().value[1].size as number;
};

export const getRowCountFromData = (data: DottingData): number => {
  return data.size;
};

export const extractColoredPixelsFromRow = (
  data: DottingData,
  rowIndex: number,
) => {
  const rowPixelsMap = data.get(rowIndex)!;
  const pixelModifyItems: Array<PixelModifyItem> = [];
  Array.from(rowPixelsMap.entries()).forEach(columnData => {
    const [key, pixel] = columnData;
    if (pixel.color) {
      pixelModifyItems.push({
        color: pixel.color,
        rowIndex: rowIndex,
        columnIndex: key,
      });
    }
  });
  return pixelModifyItems;
};

export const extractColoredPixelsFromColumn = (
  data: DottingData,
  columnIndex: number,
) => {
  const pixelModifyItems: Array<PixelModifyItem> = [];
  Array.from(data.entries()).map((rowData, key) => {
    const rowIndex = rowData[0];
    const row = rowData[1];
    if (row.get(columnIndex)!.color) {
      pixelModifyItems.push({
        rowIndex: rowIndex,
        columnIndex: columnIndex,
        color: row.get(columnIndex)!.color,
      });
    }
  });
  return pixelModifyItems;
};

export const deleteRowOfData = (data: DottingData, rowIndex: number) => {
  if (!data.has(rowIndex)) return;
  data.delete(rowIndex);
};

export const deleteColumnOfData = (data: DottingData, columnIndex: number) => {
  data.forEach(row => {
    if (!row.has(columnIndex)) return;
    row.delete(columnIndex);
  });
};

export const addRowToData = (data: DottingData, rowIndex: number) => {
  const columnKeys = getColumnKeysFromData(data);
  if (data.has(rowIndex)) {
    return;
  }
  data.set(rowIndex, new Map());
  for (const i of columnKeys) {
    data.get(rowIndex)!.set(i, { color: "" });
  }
};

export const addColumnToData = (data: DottingData, columnIndex: number) => {
  data.forEach(row => {
    if (!row.has(columnIndex)) {
      row.set(columnIndex, { color: "" });
    }
  });
};

export const validatePixelArrayData = (data: Array<Array<PixelData>>) => {
  const dataRowCount = data.length;
  let columnCount = 0;
  const rowCount = dataRowCount;
  let isDataValid = true;
  if (dataRowCount < 2) {
    isDataValid = false;
  } else {
    const dataColumnCount = data[0].length;
    columnCount = dataColumnCount;
    if (dataColumnCount < 2) {
      isDataValid = false;
    } else {
      for (let i = 0; i < dataRowCount; i++) {
        if (data[i].length !== dataColumnCount) {
          isDataValid = false;
          break;
        }
      }
    }
  }
  return { isDataValid, columnCount, rowCount };
};

export const createRowKeyOrderMapfromData = (data: DottingData) => {
  const rowKeys = getRowKeysFromData(data);
  const sortedRowKeys = rowKeys.sort((a, b) => a - b);
  const rowKeyOrderMap = new Map<number, number>();
  sortedRowKeys.forEach((key, index) => {
    rowKeyOrderMap.set(key, index);
  });
  return rowKeyOrderMap;
};

export const createColumnKeyOrderMapfromData = (data: DottingData) => {
  const columnKeys = getColumnKeysFromData(data);
  const sortedColumnKeys = columnKeys.sort((a, b) => a - b);
  const columnKeyOrderMap = new Map<number, number>();
  sortedColumnKeys.forEach((key, index) => {
    columnKeyOrderMap.set(key, index);
  });
  return columnKeyOrderMap;
};
