import { BaseLayer } from "./BaseLayer";
import {
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
  private gridSquareLength: number = DefaultGridSquareLength;
  private layers: Array<DottingDataLayer>;
  private currentLayer: DottingDataLayer;
  private defaultPixelColor = DefaultPixelColor;
  private capturedImageBitmap: ImageBitmap | null = null;
  private capturedImageBitmapScale = 1;

  constructor({
    canvas,
    layers,
  }: {
    canvas: HTMLCanvasElement;
    layers?: Array<LayerProps>;
  }) {
    super({ canvas });

    if (layers) {
      const topRowIndex = layers[0].data[0][0].rowIndex;
      const leftColumnIndex = layers[0].data[0][0].columnIndex;
      this.setTopRowIndex(topRowIndex);
      this.setLeftColumnIndex(leftColumnIndex);
      this.layers = layers.map(
        layer =>
          new DottingDataLayer({
            data: layer.data,
            id: layer.id,
          }),
      );
    } else {
      const topRowIndex = 0;
      const leftColumnIndex = 0;
      this.setTopRowIndex(topRowIndex);
      this.setLeftColumnIndex(leftColumnIndex);
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

  // this is for setting all layers together
  setLayers(layers: Array<LayerProps>) {
    this.layers = [];
    const topRowIndex = layers[0].data[0][0].rowIndex;
    const leftColumnIndex = layers[0].data[0][0].columnIndex;
    this.setTopRowIndex(topRowIndex);
    this.setLeftColumnIndex(leftColumnIndex);
    this.layers = layers.map(
      layer =>
        new DottingDataLayer({
          data: layer.data,
          id: layer.id,
        }),
    );
  }

  setGridSquareLength(length: number) {
    this.gridSquareLength = length;
  }

  setDefaultPixelColor(color: string) {
    this.defaultPixelColor = color;
  }

  getCapturedImageBitmap() {
    return this.capturedImageBitmap;
  }

  /**
   * @description Updates the pixel colors of the given data
   *              Different from colorPixels, this method does not add rows or columns
   * @param data The data to update
   * @param layerId The layer id of the layer to update
   */
  updatePixelColors(
    data: Array<PixelModifyItem>,
    layerId?: string,
  ): Array<ColorChangeItem> {
    if (!layerId) {
      if (this.layers.length > 1) {
        throw new Error("Must specify layerId when there are multiple layers");
      }
    }
    const layer = layerId ? this.getLayer(layerId) : this.currentLayer;
    const modifiedPixels: Array<ColorChangeItem> = [];
    if (!layer) {
      throw new Error("Layer not found");
    }
    for (const item of data) {
      const { rowIndex, columnIndex, color } = item;
      if (
        layer.getData().get(rowIndex) &&
        layer.getData().get(rowIndex)!.get(columnIndex)
      ) {
        modifiedPixels.push({
          rowIndex,
          columnIndex,
          color,
          previousColor: layer.getData().get(rowIndex)!.get(columnIndex)!.color,
        });
        layer.getData().get(rowIndex)!.set(columnIndex, { color });
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
    if (totalAddedRowIndices.length > 0 || totalAddedColumnIndices.length > 0) {
      this.addGridIndices({
        rowIndicesToAdd: totalAddedRowIndices,
        columnIndicesToAdd: totalAddedColumnIndices,
      });
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
    let validRowIndex = null;
    this.layers.forEach(layer => {
      validRowIndex = layer.addRowToData(rowIndex);
    });
    return { validRowIndex };
  }

  addColumn(columnIndex: number) {
    let validColumnIndex = null;
    this.layers.forEach(layer => {
      validColumnIndex = layer.addColumnToData(columnIndex);
    });
    return { validColumnIndex };
  }

  deleteRow(rowIndex: number) {
    let validRowIndex = null;
    // This is to prevent deleting a non-existent row
    if (!this.getData().has(rowIndex)) {
      return {
        swipedPixels: [],
        validRowIndex,
      };
    }
    const swipedPixels = extractColoredPixelsFromRow(this.getData(), rowIndex);
    this.layers.forEach(layer => {
      validRowIndex = layer.deleteRowOfData(rowIndex);
    });
    return { swipedPixels, validRowIndex };
  }

  deleteColumn(columnIndex: number) {
    let validColumnIndex = null;
    const firstRowKey = this.getData().keys().next().value;
    // This is to prevent deleting a non-existent column
    if (!this.getData().get(firstRowKey).has(columnIndex)) {
      return {
        swipedPixels: [],
        validColumnIndex,
      };
    }
    const swipedPixels = extractColoredPixelsFromColumn(
      this.getData(),
      columnIndex,
    );
    this.layers.forEach(layer => {
      validColumnIndex = layer.deleteColumnOfData(columnIndex);
    });
    return { swipedPixels, validColumnIndex };
  }

  addGridIndices({
    rowIndicesToAdd,
    columnIndicesToAdd,
  }: {
    rowIndicesToAdd: Array<number>;
    columnIndicesToAdd: Array<number>;
  }) {
    const validRowIndices: Array<number> = [];
    const validColumnIndices: Array<number> = [];
    console.log(rowIndicesToAdd, columnIndicesToAdd);
    for (const rowIndex of rowIndicesToAdd) {
      const { validRowIndex } = this.addRow(rowIndex);
      if (validRowIndex !== null) {
        validRowIndices.push(validRowIndex);
      }
    }
    for (const columnIndex of columnIndicesToAdd) {
      const { validColumnIndex } = this.addColumn(columnIndex);
      if (validColumnIndex !== null) {
        validColumnIndices.push(validColumnIndex);
      }
    }
    return { validRowIndices, validColumnIndices };
  }

  clear() {
    const clearedPixels: Array<{
      layerId: string;
      data: Array<PixelModifyItem>;
    }> = [];
    this.layers.forEach(layer => {
      const { newPixels } = layer.clearData();
      clearedPixels.push({
        layerId: layer.getId(),
        data: newPixels,
      });
    });
    return clearedPixels;
  }

  deleteGridIndices({
    rowIndicesToDelete,
    columnIndicesToDelete,
  }: {
    rowIndicesToDelete: Array<number>;
    columnIndicesToDelete: Array<number>;
  }) {
    const validRowIndices: Array<number> = [];
    const validColumnIndices: Array<number> = [];
    const swipedPixels: Array<PixelModifyItem> = [];
    for (const rowIndex of rowIndicesToDelete) {
      const { swipedPixels: swipedPixelsFromRow, validRowIndex } =
        this.deleteRow(rowIndex);
      swipedPixels.push(...swipedPixelsFromRow);
      if (validRowIndex !== null) {
        validRowIndices.push(validRowIndex);
      }
    }
    for (const columnIndex of columnIndicesToDelete) {
      const { swipedPixels: swipedPixelsFromColumn, validColumnIndex } =
        this.deleteColumn(columnIndex);
      swipedPixels.push(...swipedPixelsFromColumn);
      if (validColumnIndex !== null) {
        validColumnIndices.push(validColumnIndex);
      }
    }
    return { swipedPixels, validColumnIndices, validRowIndices };
  }

  updateCapturedImageBitmap() {
    const squareLength = this.gridSquareLength * this.panZoom.scale;
    // leftTopPoint is a cartesian coordinate
    const allRowKeys = getRowKeysFromData(this.getData());
    const allColumnKeys = getColumnKeysFromData(this.getData());
    const width = this.dpr
      ? allColumnKeys.length * squareLength * this.dpr
      : allColumnKeys.length * squareLength;
    const height = this.dpr
      ? allRowKeys.length * squareLength * this.dpr
      : allRowKeys.length * squareLength;

    const canvas = new OffscreenCanvas(width, height);
    const fakeCtx: OffscreenCanvasRenderingContext2D = canvas.getContext(
      "2d",
    ) as any; // this is to forestall typescript error
    if (!fakeCtx) {
      throw new Error("Cannot get context");
    }
    // getRowKeysFromData and getColumnKeysFromData are used to get the row and column indices
    // the indices are sorted in ascending order

    // color back with default color
    if (this.defaultPixelColor) {
      fakeCtx.save();
      fakeCtx.fillStyle = this.defaultPixelColor;
      fakeCtx.fillRect(
        0,
        0,
        squareLength * allColumnKeys.length * this.dpr,
        squareLength * allRowKeys.length * this.dpr,
      );
      fakeCtx.restore();
    }

    fakeCtx.save();
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
        fakeCtx.fillStyle = color;

        fakeCtx.fillRect(
          relativeColumnIndex * squareLength * this.dpr,
          relativeRowIndex * squareLength * this.dpr,
          squareLength * this.dpr,
          squareLength * this.dpr,
        );
      }
    }
    fakeCtx.restore();
    this.capturedImageBitmapScale = this.panZoom.scale;
    this.capturedImageBitmap = canvas.transferToImageBitmap();
  }

  renderOnCanvas(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  ) {
    const squareLength = this.gridSquareLength * this.panZoom.scale;
    // leftTopPoint is a cartesian coordinate
    const allRowKeys = getRowKeysFromData(this.getData());
    const allColumnKeys = getColumnKeysFromData(this.getData());
    const leftTopPoint: Coord = {
      x: this.leftColumnIndex * this.gridSquareLength,
      y: this.topRowIndex * this.gridSquareLength,
    };
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
    return {
      rowKeys: allRowKeys,
      columnKeys: allColumnKeys,
    };
  }

  render() {
    console.log("rendering original");
    this.renderOnCanvas(this.ctx);
  }

  // only use this when panning since image data cannot be scaled
  renderImageBitmap() {
    if (!this.capturedImageBitmap) {
      throw new Error("Captured image data is null");
    }
    const squareLength = this.gridSquareLength * this.panZoom.scale;
    // leftTopPoint is a cartesian coordinate
    const leftTopPoint: Coord = {
      x: this.leftColumnIndex * this.gridSquareLength,
      y: this.topRowIndex * this.gridSquareLength,
    };
    const convertedLeftTopScreenPoint = convertCartesianToScreen(
      this.element,
      leftTopPoint,
      this.dpr,
    );
    const correctedLeftTopScreenPoint = getScreenPoint(
      convertedLeftTopScreenPoint,
      this.panZoom,
    );
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.width, this.height);
    const newScale = this.panZoom.scale / this.capturedImageBitmapScale;
    console.log("rendering image bitmap");
    this.ctx.drawImage(
      this.capturedImageBitmap,
      correctedLeftTopScreenPoint.x,
      correctedLeftTopScreenPoint.y,
      (this.capturedImageBitmap.width / this.dpr) * newScale,
      (this.capturedImageBitmap.height / this.dpr) * newScale,
    );
    this.ctx.restore();
  }
}
