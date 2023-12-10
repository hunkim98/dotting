import { DefaultPanZoom } from "./config";
import { DottingData, PanZoom } from "./types";
import {
  createColumnKeyOrderMapfromData,
  createRowKeyOrderMapfromData,
} from "../../utils/data";

export abstract class BaseLayer {
  protected ctx: CanvasRenderingContext2D;
  protected element: HTMLCanvasElement;
  protected clonedElement: HTMLCanvasElement;
  protected dpr: number;
  protected panZoom: PanZoom = DefaultPanZoom;
  protected width: number;
  protected height: number;
  protected criterionDataForRendering: DottingData | null;
  // TODO: We needed a key value sorted map!
  protected rowKeyOrderMap: Map<number, number> = new Map();
  protected columnKeyOrderMap: Map<number, number> = new Map();

  protected topRowIndex = 0;
  protected leftColumnIndex = 0;

  constructor({ canvas }: { canvas: HTMLCanvasElement }) {
    this.ctx = canvas.getContext("2d")!;
    this.element = canvas;
  }

  getContext() {
    return this.ctx;
  }

  getElement() {
    return this.element;
  }

  getRowKeyOrderMap() {
    return this.rowKeyOrderMap;
  }

  getColumnKeyOrderMap() {
    return this.columnKeyOrderMap;
  }

  setPanZoom(panZoom: PanZoom) {
    this.panZoom = panZoom;
  }

  setCriterionDataForRendering(criterionDataForRendering: DottingData) {
    this.criterionDataForRendering = criterionDataForRendering;
    const { rowKeyOrderMap, minRowKey } = createRowKeyOrderMapfromData(
      criterionDataForRendering,
    );
    const { columnKeyOrderMap, minColumnKey } = createColumnKeyOrderMapfromData(
      criterionDataForRendering,
    );
    this.rowKeyOrderMap = rowKeyOrderMap;
    this.columnKeyOrderMap = columnKeyOrderMap;
    this.topRowIndex = minRowKey;
    this.leftColumnIndex = minColumnKey;
  }

  scale(x: number, y: number) {
    this.ctx.scale(x, y);
  }

  setWidth(width: number, devicePixelRatio?: number) {
    this.width = width;
    this.element.width = devicePixelRatio ? width * devicePixelRatio : width;
    this.element.style.width = `${width}px`;
  }

  setHeight(height: number, devicePixelRatio?: number) {
    this.height = height;
    this.element.height = devicePixelRatio ? height * devicePixelRatio : height;
    this.element.style.height = `${height}px`;
  }

  setDpr(dpr: number) {
    this.dpr = dpr;
  }

  getWidth() {
    return this.width;
  }

  getHeight() {
    return this.height;
  }

  setSize(width: number, height: number, devicePixelRatio?: number) {
    this.setWidth(width, devicePixelRatio);
    this.setHeight(height, devicePixelRatio);
    this.dpr = devicePixelRatio ? devicePixelRatio : this.dpr;
  }

  setTopRowIndex(topRowIndex: number) {
    this.topRowIndex = topRowIndex;
  }

  setLeftColumnIndex(leftColumnIndex: number) {
    this.leftColumnIndex = leftColumnIndex;
  }

  getTopRowIndex() {
    return this.topRowIndex;
  }

  getLeftColumnIndex() {
    return this.leftColumnIndex;
  }

  abstract render(): void;
}
