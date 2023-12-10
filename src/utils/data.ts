import {
  DuplicateLayerIdError,
  InvalidDataDimensionsError,
  InvalidDataIndicesError,
  InvalidSquareDataError,
} from "./error";
import { getBressenhamIndices } from "./math";
import { getPixelIndexFromMouseCartCoord } from "./position";
import {
  DottingData,
  GridIndices,
  PixelModifyItem,
  Coord,
  LayerProps,
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

export const getAllGridIndicesSorted = (
  data: DottingData,
): {
  rowIndices: Array<number>;
  columnIndices: Array<number>;
} => {
  const allRowKeys = Array.from(data.keys());
  const allColumnKeys = Array.from(data.get(allRowKeys[0])!.keys());
  return {
    rowIndices: allRowKeys.sort((a, b) => a - b),
    columnIndices: allColumnKeys.sort((a, b) => a - b),
  };
};

/**
 * @description get all the row keys (sorted) from the data
 * @param data
 */
export const getRowKeysFromData = (data: DottingData): Array<number> => {
  return Array.from(data.keys()).sort((a, b) => a - b);
};

/**
 * @description get all the column keys (sorted) from the data
 * @param data
 */
export const getColumnKeysFromData = (data: DottingData): Array<number> => {
  const allRowKeys = getRowKeysFromData(data);
  const allColumnKeys = Array.from(data.get(allRowKeys[0])!.keys()).sort(
    (a, b) => a - b,
  );
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
  Array.from(data.entries()).map(rowData => {
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
    if (!row.has(columnIndex)) {
      return;
    }
    row.delete(columnIndex);
  });
};

export const addRowToData = (
  data: DottingData,
  rowIndex: number,
  defaultColor: string,
) => {
  const columnKeys = getColumnKeysFromData(data);
  if (data.has(rowIndex)) {
    return;
  }
  data.set(rowIndex, new Map());
  for (const i of columnKeys) {
    data.get(rowIndex)!.set(i, { color: "" });
  }
};

export const addColumnToData = (
  data: DottingData,
  columnIndex: number,
  defaultColor: string,
) => {
  data.forEach(row => {
    if (!row.has(columnIndex)) {
      row.set(columnIndex, { color: "" });
    }
  });
};

export const validateSquareArray = (data: Array<Array<unknown>>) => {
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

export const createPixelDataSquareArray = (
  rowCount: number,
  columnCount: number,
  topRowIndex: number,
  leftColumnIndex: number,
): Array<Array<PixelModifyItem>> => {
  const squareArray: Array<Array<PixelModifyItem>> = [];
  for (let i = 0; i < rowCount; i++) {
    const row = [];
    for (let j = 0; j < columnCount; j++) {
      row.push({
        rowIndex: topRowIndex + i,
        columnIndex: leftColumnIndex + j,
        color: "",
      });
    }
    squareArray.push(row);
  }
  return squareArray;
};

export const createRowKeyOrderMapfromData = (data: DottingData) => {
  const rowKeys = getRowKeysFromData(data);
  const sortedRowKeys = rowKeys.sort((a, b) => a - b);
  const minRowKey = sortedRowKeys[0];
  const rowKeyOrderMap = new Map<number, number>();
  sortedRowKeys.forEach((key, index) => {
    rowKeyOrderMap.set(key, index);
  });
  return { rowKeyOrderMap, minRowKey };
};

export const createColumnKeyOrderMapfromData = (data: DottingData) => {
  const columnKeys = getColumnKeysFromData(data);
  const sortedColumnKeys = columnKeys.sort((a, b) => a - b);
  const minColumnKey = sortedColumnKeys[0];
  const columnKeyOrderMap = new Map<number, number>();
  sortedColumnKeys.forEach((key, index) => {
    columnKeyOrderMap.set(key, index);
  });
  return { columnKeyOrderMap, minColumnKey };
};

export const getInBetweenPixelIndicesfromCoords = (
  previousCoord: Coord,
  currentCoord: Coord,
  gridSquareLength: number,
  data: DottingData,
) => {
  if (!previousCoord || !currentCoord) return [];
  if (
    Math.abs(currentCoord.x - previousCoord.x) >= gridSquareLength ||
    Math.abs(currentCoord.y - previousCoord.y) >= gridSquareLength
  ) {
    const gridIndices = getGridIndicesFromData(data);
    const { rowIndices, columnIndices } = getAllGridIndicesSorted(data);
    const pixelIndex = getPixelIndexFromMouseCartCoord(
      currentCoord,
      rowIndices,
      columnIndices,
      gridSquareLength,
    );
    const previousIndex = getPixelIndexFromMouseCartCoord(
      previousCoord,
      rowIndices,
      columnIndices,
      gridSquareLength,
    );
    if (!previousIndex || !pixelIndex) return;

    if (
      Math.abs(pixelIndex.columnIndex - previousIndex.columnIndex) >= 1 ||
      Math.abs(pixelIndex.rowIndex - previousIndex.rowIndex) >= 1
    ) {
      const missingIndices = getBressenhamIndices(
        previousIndex.rowIndex,
        previousIndex.columnIndex,
        pixelIndex.rowIndex,
        pixelIndex.columnIndex,
      );

      if (missingIndices.length > 0) {
        return missingIndices;
      }
    }
  }
};

export const validateLayers = (layers: Array<LayerProps>) => {
  if (!layers) {
    throw new Error("No layer provided");
  }
  if (layers.length === 0) {
    throw new Error(
      "initLayers should not be empty. Please provide at least one layer.",
    );
  }
  const layerIdSet: Set<string> = new Set();
  let measuredColumnCount = null;
  let measuredRowCount = null;
  let measuredTopRowIndex = null;
  let measuredLeftColumnIndex = null;
  // all init data passed initially, should be
  // 1) a square array
  // 2) all data should have same row and column count
  // 3) all data should have same topRowIndex and leftColumnIndex
  layers.forEach(layer => {
    if (layerIdSet.has(layer.id)) {
      throw new DuplicateLayerIdError(layer.id);
    }
    layerIdSet.add(layer.id);
    const { isDataValid, columnCount, rowCount } = validateSquareArray(
      layer.data,
    );
    if (measuredColumnCount !== null && measuredRowCount !== null) {
      if (
        measuredColumnCount !== columnCount ||
        measuredRowCount !== rowCount
      ) {
        throw new InvalidDataDimensionsError(layer.id);
      }
    } else {
      measuredColumnCount = columnCount;
      measuredRowCount = rowCount;
    }

    if (!isDataValid) {
      throw new InvalidSquareDataError(layer.id);
    }
    if (measuredLeftColumnIndex == null || measuredTopRowIndex == null) {
      measuredLeftColumnIndex = layer.data[0][0].columnIndex;
      measuredTopRowIndex = layer.data[0][0].rowIndex;
    }
    const topRowIndex = layer.data[0][0].rowIndex;
    const leftColumnIndex = layer.data[0][0].columnIndex;
    if (topRowIndex !== measuredTopRowIndex) {
      throw new InvalidDataIndicesError(layer.id);
    }
    if (leftColumnIndex !== measuredLeftColumnIndex) {
      throw new InvalidDataIndicesError(layer.id);
    }
  });
  return true;
};
