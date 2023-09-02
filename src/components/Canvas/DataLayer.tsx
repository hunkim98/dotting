import { BaseLayer } from "./BaseLayer";
import {
  ButtonDirection,
  DefaultGridSquareLength,
  DefaultPixelColor,
  DefaultPixelDataDimensions,
} from "./config";
import {
  ColorChangeItem,
  Coord,
  DottingData,
  LayerProps,
  PixelModifyItem,
} from "./types";
import { DottingDataLayer } from "../../helpers/DottingDataLayer";
import {
  extractColoredPixelsFromColumn,
  extractColoredPixelsFromRow,
  getColumnCountFromData,
  getColumnKeysFromData,
  getGridIndicesFromData,
  getRowCountFromData,
  getRowKeysFromData,
  validateSquareArray,
} from "../../utils/data";
import { convertCartesianToScreen, getScreenPoint } from "../../utils/math";

export default class DataLayer extends BaseLayer {
  private swipedPixels: Array<PixelModifyItem> = [];
  private gridSquareLength: number = DefaultGridSquareLength;
  private layers: Array<DottingDataLayer>;
  private currentLayer: DottingDataLayer;
  private defaultPixelColor = DefaultPixelColor;

  constructor({
    canvas,
    layers,
  }: {
    canvas: HTMLCanvasElement;
    layers?: Array<LayerProps>;
  }) {
    super({ canvas });
    if (layers) {
      this.layers = layers.map(
        layer =>
          new DottingDataLayer({
            data: layer.data,
            id: layer.id,
          }),
      );
    } else {
      const defaultNestedArray: Array<Array<PixelModifyItem>> = [];
      const { rowCount, columnCount } = DefaultPixelDataDimensions;
      for (let i = 0; i < rowCount; i++) {
        defaultNestedArray.push([]);
        for (let j = 0; j < columnCount; j++) {
          defaultNestedArray[i].push({
            color: "",
            rowIndex: i,
            columnIndex: j,
          });
        }
      }
      this.layers = [
        new DottingDataLayer({
          data: defaultNestedArray,
          id: "layer1",
        }),
      ];
    }
    this.currentLayer = this.layers[0];
  }

  getColumnCount() {
    return getColumnCountFromData(this.getData());
  }

  getRowCount() {
    return getRowCountFromData(this.getData());
  }

  getGridIndices() {
    return getGridIndicesFromData(this.getData());
  }

  getDimensions() {
    return {
      columnCount: this.getColumnCount(),
      rowCount: this.getRowCount(),
    };
  }

  getData() {
    return this.currentLayer.getData();
  }

  getLayer(layerId: string) {
    const layer = this.layers.find(layer => layer.getId() === layerId);
    if (layer) {
      return layer;
    } else {
      return null;
    }
  }

  getLayerIndex(layerId: string) {
    return this.layers.findIndex(layer => layer.getId() === layerId);
  }

  getLayers() {
    return this.layers;
  }

  createLayer(
    layerId: string,
    data?: Array<Array<PixelModifyItem>>,
  ): DottingDataLayer {
    const layer = this.getLayer(layerId);
    if (layer) {
      throw new Error("Layer already exists");
    } else {
      const currentLayerInfo = this.currentLayer.getDataInfo();
      if (data) {
        const { isDataValid, rowCount, columnCount } =
          validateSquareArray(data);
        const leftColumnIndex = data[0][0].columnIndex;
        const topRowIndex = data[0][0].rowIndex;
        if (!isDataValid) {
          throw new Error("Data is not square");
        }
        if (
          leftColumnIndex !== currentLayerInfo.gridIndices.leftColumnIndex ||
          topRowIndex !== currentLayerInfo.gridIndices.topRowIndex
        ) {
          throw new Error("Data grid indice differs from current layer");
        }
        if (
          rowCount !== currentLayerInfo.rowCount ||
          columnCount !== currentLayerInfo.columnCount
        ) {
          throw new Error("Data dimensions differs from current layer");
        }
        return new DottingDataLayer({
          data,
          id: layerId,
        });
      } else {
        const emptyArray: Array<Array<PixelModifyItem>> = [];
        for (let i = 0; i < currentLayerInfo.rowCount; i++) {
          emptyArray.push([]);
          for (let j = 0; j < currentLayerInfo.columnCount; j++) {
            emptyArray[i].push({
              rowIndex: currentLayerInfo.gridIndices.topRowIndex + i,
              columnIndex: currentLayerInfo.gridIndices.leftColumnIndex + j,
              color: "",
            });
          }
        }
        return new DottingDataLayer({
          data: emptyArray,
          id: layerId,
        });
      }
    }
  }

  getCopiedData() {
    const copiedMap = new Map();
    Array.from(this.getData().entries()).forEach(([rowIndex, row]) => {
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

  getCurrentLayer() {
    return this.currentLayer;
  }

  hideLayer(layerId: string) {
    const layer = this.getLayer(layerId);
    if (!layer) {
      throw new Error("Layer not found");
    }
    layer.setIsVisible(false);
  }

  showLayer(layerId: string) {
    const layer = this.getLayer(layerId);
    if (!layer) {
      throw new Error("Layer not found");
    }
    layer.setIsVisible(true);
  }

  isolateLayer(layerId: string) {
    const layer = this.getLayer(layerId);
    if (!layer) {
      throw new Error("Layer not found");
    }
    this.layers.forEach(layer => layer.setIsVisible(false));
    layer.setIsVisible(true);
  }

  showAllLayers() {
    this.layers.forEach(layer => layer.setIsVisible(true));
  }

  reorderLayersByIds(layerIds: Array<string>) {
    const newLayers: Array<DottingDataLayer> = [];
    layerIds.forEach(layerId => {
      const layer = this.getLayer(layerId);
      if (!layer) {
        throw new Error("Layer not found");
      }
      newLayers.push(layer);
    });
    this.layers = newLayers;
  }

  /**
   * @description Sets the current layer to the layer with the given id
   * @param layerId The layer id of the layer
   */
  setCurrentLayer(layerId: string) {
    const layer = this.layers.find(layer => layer.getId() === layerId);
    if (layer) {
      this.currentLayer = layer;
      // this.data = layer.getData();
    } else {
      throw new Error("Layer not found");
    }
  }

  setData(data: DottingData, layerId?: string) {
    if (layerId === undefined) {
      if (this.layers.length > 1) {
        throw new Error("Must specify layerId when there are multiple layers");
      }
      // there is single layer
      this.currentLayer.setData(data);
    } else {
      const layer = this.layers.find(layer => layer.getId() === layerId);
      if (layer) {
        layer.setData(data);
      } else {
        throw new Error("Layer not found");
      }
    }
  }

  setGridSquareLength(length: number) {
    this.gridSquareLength = length;
  }

  setDefaultPixelColor(color: string) {
    this.defaultPixelColor = color;
  }

  // shortenGridBy(
  //   direction: ButtonDirection,
  //   amount: number,
  //   startIndex: number,
  // ) {
  //   const deletedColumnIndices: Array<number> = [];
  //   const deletedRowIndices: Array<number> = [];
  //   const shouldIncreaseIndex =
  //     direction === ButtonDirection.TOP || direction === ButtonDirection.LEFT;
  //   for (let i = 0; i < amount; i++) {
  //     const index = startIndex + (shouldIncreaseIndex ? i : -i);
  //     const { deletedColumnIndex, deletedRowIndex } = this.shortenGrid(
  //       direction,
  //       index,
  //     );
  //     if (deletedColumnIndex !== null) {
  //       deletedColumnIndices.push(deletedColumnIndex);
  //     }
  //     if (deletedRowIndex !== null) {
  //       deletedRowIndices.push(deletedRowIndex);
  //     }
  //   }
  //   return {
  //     deletedColumnIndices,
  //     deletedRowIndices,
  //   };
  // }

  // shortenGrid(direction: ButtonDirection, index: number) {
  //   const { columnCount, rowCount } = this.getDimensions();
  //   const rowKeys = getRowKeysFromData(this.getData());
  //   const columnKeys = getColumnKeysFromData(this.getData());
  //   let deletedRowIndex = null;
  //   let deletedColumnIndex = null;
  //   if (
  //     direction === ButtonDirection.TOP ||
  //     direction === ButtonDirection.BOTTOM
  //   ) {
  //     if (rowCount <= 2 || !rowKeys.includes(index)) {
  //       return;
  //     }
  //     this.swipedPixels.push(...this.deleteRow(index));
  //     deletedRowIndex = index;
  //   } else if (
  //     direction === ButtonDirection.LEFT ||
  //     direction === ButtonDirection.RIGHT
  //   ) {
  //     if (columnCount <= 2 || !columnKeys.includes(index)) {
  //       return;
  //     }
  //     this.swipedPixels.push(...this.deleteColumn(index));
  //     deletedColumnIndex = index;
  //   }
  //   return {
  //     deletedRowIndex,
  //     deletedColumnIndex,
  //   };
  // }

  /**
   * @description Updates the pixel colors of the given data
   *              Different from colorPixels, this method does not add rows or columns
   * @param data The data to update
   * @param layerId The layer id of the layer to update
   */
  updatePixelColors(
    data: Array<PixelModifyItem>,
    layerId?: string,
  ): Array<PixelModifyItem> {
    if (!layerId) {
      if (this.layers.length > 1) {
        throw new Error("Must specify layerId when there are multiple layers");
      }
    }
    const layer = layerId ? this.getLayer(layerId) : this.currentLayer;
    const modifiedPixels: Array<PixelModifyItem> = [];
    if (!layer) {
      throw new Error("Layer not found");
    }
    for (const item of data) {
      const { rowIndex, columnIndex, color } = item;
      if (
        layer.getData().get(rowIndex) &&
        layer.getData().get(rowIndex)!.get(columnIndex)
      ) {
        layer.getData().get(rowIndex)!.set(columnIndex, { color });
        modifiedPixels.push(item);
      }
    }
    return modifiedPixels;
  }

  colorPixels(data: Array<PixelModifyItem>, layerId?: string) {
    if (!layerId) {
      if (this.layers.length > 1) {
        throw new Error("Must specify layerId when there are multiple layers");
      }
    }
    const layer = layerId ? this.getLayer(layerId) : this.currentLayer;
    if (!layer) {
      throw new Error("Layer not found");
    }
    const rowIndices = data.map(change => change.rowIndex);
    const columnIndices = data.map(change => change.columnIndex);
    const minRowIndex = Math.min(...rowIndices);
    const maxRowIndex = Math.max(...rowIndices);
    const minColumnIndex = Math.min(...columnIndices);
    const maxColumnIndex = Math.max(...columnIndices);
    const currentCanvasIndices = this.getGridIndices();
    const totalAddedRowIndices: Array<number> = [];
    const totalAddedColumnIndices: Array<number> = [];
    if (minRowIndex < currentCanvasIndices.topRowIndex) {
      const amount = currentCanvasIndices.topRowIndex - minRowIndex;
      const addedRowIndices = Array.from(
        new Array(amount),
        (_, i) => currentCanvasIndices.topRowIndex - i - 1,
      );
      totalAddedRowIndices.push(...addedRowIndices);
    }
    if (maxRowIndex > currentCanvasIndices.bottomRowIndex) {
      const amount = maxRowIndex - currentCanvasIndices.bottomRowIndex;
      const addedRowIndices = Array.from(
        new Array(amount),
        (_, i) => currentCanvasIndices.bottomRowIndex + i + 1,
      );
      totalAddedRowIndices.push(...addedRowIndices);
    }
    if (minColumnIndex < currentCanvasIndices.leftColumnIndex) {
      const amount = currentCanvasIndices.leftColumnIndex - minColumnIndex;
      const addedColumnIndices = Array.from(
        new Array(amount),
        (_, i) => currentCanvasIndices.leftColumnIndex - i - 1,
      );
      totalAddedColumnIndices.push(...addedColumnIndices);
    }
    if (maxColumnIndex > currentCanvasIndices.rightColumnIndex) {
      const amount = maxColumnIndex - currentCanvasIndices.rightColumnIndex;
      const addedColumnIndices = Array.from(
        new Array(amount),
        (_, i) => currentCanvasIndices.rightColumnIndex + i + 1,
      );
      totalAddedColumnIndices.push(...addedColumnIndices);
    }
    const dataForAction: Array<ColorChangeItem> = [];
    for (const change of data) {
      const previousColor = layer
        .getData()
        .get(change.rowIndex)!
        .get(change.columnIndex)!.color;
      const color = change.color;
      layer
        .getData()
        .get(change.rowIndex)!
        .set(change.columnIndex, { color: change.color });
      dataForAction.push({ ...change, color, previousColor });
    }
    return {
      dataForAction,
      totalAddedColumnIndices,
      totalAddedRowIndices,
    };
  }

  erasePixels(
    data: Array<{ rowIndex: number; columnIndex: number }>,
    layerId?: string,
  ) {
    if (!layerId) {
      if (this.layers.length > 1) {
        throw new Error("Must specify layerId when there are multiple layers");
      }
    }
    const layer = layerId ? this.getLayer(layerId) : this.getCurrentLayer();
    if (!layer) {
      throw new Error("Cannot find layer");
    }
    const dataForAction: Array<ColorChangeItem> = [];
    for (const change of data) {
      const previousColor = layer
        .getData()
        .get(change.rowIndex)!
        .get(change.columnIndex)!.color;
      const color = "";
      layer
        .getData()
        .get(change.rowIndex)!
        .set(change.columnIndex, { color: "" });
      dataForAction.push({ ...change, color, previousColor });
    }
    return { dataForAction };
  }

  addRow(rowIndex: number) {
    this.layers.forEach(layer => {
      layer.addRowToData(rowIndex);
    });
  }

  addColumn(columnIndex: number) {
    this.layers.forEach(layer => {
      layer.addColumnToData(columnIndex);
    });
  }

  deleteRow(rowIndex: number) {
    const swipedPixels = extractColoredPixelsFromRow(this.getData(), rowIndex);
    this.layers.forEach(layer => {
      layer.deleteRowOfData(rowIndex);
    });
    return swipedPixels;
  }

  deleteColumn(columnIndex: number) {
    const swipedPixels = extractColoredPixelsFromColumn(
      this.getData(),
      columnIndex,
    );
    this.layers.forEach(layer => {
      layer.deleteColumnOfData(columnIndex);
    });
    return swipedPixels;
  }

  addGridIndices({
    rowIndicesToAdd,
    columnIndicesToAdd,
  }: {
    rowIndicesToAdd: Array<number>;
    columnIndicesToAdd: Array<number>;
  }) {
    for (const rowIndex of rowIndicesToAdd) {
      this.addRow(rowIndex);
    }
    for (const columnIndex of columnIndicesToAdd) {
      this.addColumn(columnIndex);
    }
  }

  deleteGridIndices({
    rowIndicesToDelete,
    columnIndicesToDelete,
  }: {
    rowIndicesToDelete: Array<number>;
    columnIndicesToDelete: Array<number>;
  }) {
    for (const rowIndex of rowIndicesToDelete) {
      this.deleteRow(rowIndex);
    }
    for (const columnIndex of columnIndicesToDelete) {
      this.deleteColumn(columnIndex);
    }
  }

  // extendGridBy(direction: ButtonDirection, amount: number, startIndex: number) {
  //   const shouldIncreaseIndex =
  //     direction === ButtonDirection.BOTTOM ||
  //     direction === ButtonDirection.RIGHT;
  //   const addedRowIndices: Array<number> = [];
  //   const addedColumnIndices: Array<number> = [];
  //   for (let i = 1; i <= amount; i++) {
  //     const index = startIndex + (shouldIncreaseIndex ? i : -i);
  //     const { addedColumnIndex, addedRowIndex } = this.extendGrid(
  //       direction,
  //       index,
  //     );
  //     if (addedColumnIndex !== null) {
  //       addedColumnIndices.push(addedColumnIndex);
  //     }
  //     if (addedRowIndex !== null) {
  //       addedRowIndices.push(addedRowIndex);
  //     }
  //   }
  //   return {
  //     addedRowIndices,
  //     addedColumnIndices,
  //   };
  // }

  // extendGrid(
  //   direction: ButtonDirection,
  //   index: number,
  // ): {
  //   addedRowIndex: number | null;
  //   addedColumnIndex: number | null;
  // } {
  //   let addedRowIndex = null;
  //   let addedColumnIndex = null;
  //   if (
  //     direction === ButtonDirection.TOP ||
  //     direction === ButtonDirection.BOTTOM
  //   ) {
  //     this.addRow(index);
  //     addedRowIndex = index;
  //   } else if (
  //     direction === ButtonDirection.LEFT ||
  //     direction === ButtonDirection.RIGHT
  //   ) {
  //     this.addColumn(index);
  //     addedColumnIndex = index;
  //   }
  //   return {
  //     addedRowIndex,
  //     addedColumnIndex,
  //   };
  // }

  render() {
    const squareLength = this.gridSquareLength * this.panZoom.scale;
    // leftTopPoint is a cartesian coordinate
    const leftTopPoint: Coord = {
      x: 0,
      y: 0,
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

    // getRowKeysFromData and getColumnKeysFromData are used to get the row and column indices
    // the indices are sorted in ascending order
    const allRowKeys = getRowKeysFromData(this.getData());
    const allColumnKeys = getColumnKeysFromData(this.getData());

    // color back with default color
    if (this.defaultPixelColor) {
      ctx.save();
      ctx.fillStyle = this.defaultPixelColor;
      ctx.fillRect(
        correctedLeftTopScreenPoint.x,
        correctedLeftTopScreenPoint.y,
        squareLength * allColumnKeys.length,
        squareLength * allRowKeys.length,
      );
      ctx.restore();
    }

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
        const color = this.layers
          .slice()
          .reverse()
          .reduce((acc, layer) => {
            if (layer.getIsVisible() === false) {
              return acc;
            }
            const layerColor = layer
              .getData()
              .get(rowIndex)
              ?.get(columnIndex)?.color;
            if (layerColor) {
              return layerColor;
            }
            return acc;
          }, "");

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
