import {
  DottingData,
  GridIndices,
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
        rowIndex: key,
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
    const row = rowData[1];
    if (row.get(columnIndex)!.color) {
      pixelModifyItems.push({
        rowIndex: key,
        columnIndex: columnIndex,
        color: row.get(columnIndex)!.color,
      });
    }
  });
  return pixelModifyItems;
};

export const deleteRowOfData = (data: DottingData, rowIndex: number) => {
  data.delete(rowIndex);
};

export const deleteColumnOfData = (data: DottingData, columnIndex: number) => {
  data.forEach(row => {
    row.delete(columnIndex);
  });
};

export const addRowToData = (data: DottingData, rowIndex: number) => {
  const { leftColumnIndex, rightColumnIndex } = getGridIndicesFromData(data);
  data.set(rowIndex, new Map());
  for (let i = leftColumnIndex; i <= rightColumnIndex; i++) {
    data.get(rowIndex)!.set(i, { color: "" });
  }
};

export const addColumnToData = (data: DottingData, columnIndex: number) => {
  data.forEach(row => {
    row.set(columnIndex, { color: "" });
  });
};
