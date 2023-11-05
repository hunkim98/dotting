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
  protected worker: Worker | null = null;
  protected offscreenCanvas: OffscreenCanvas | null = null;

  constructor({ canvas }: { canvas: HTMLCanvasElement }) {
    this.ctx = canvas.getContext("2d")!;
    this.element = canvas;
  }

  setWorker(worker: Worker) {
    if (worker) {
      this.clonedElement = this.element.cloneNode(true) as HTMLCanvasElement;
      this.clonedElement.style["touchAction"] = "none";
      this.clonedElement.style["userSelect"] = "none";
      this.clonedElement.style["pointerEvents"] = "none";
      this.element.parentNode.insertBefore(
        this.clonedElement,
        this.element.nextSibling,
      );
      this.clonedElement.id = this.element.id + "-offscreen";
      const offscreen = this.clonedElement.transferControlToOffscreen();
      this.offscreenCanvas = offscreen;
      this.worker = worker;
      this.worker.postMessage(
        {
          canvas: offscreen,
          dpr: this.dpr,
        },
        [offscreen],
      );
    }
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
    this.rowKeyOrderMap = createRowKeyOrderMapfromData(
      criterionDataForRendering,
    );
    this.columnKeyOrderMap = createColumnKeyOrderMapfromData(
      criterionDataForRendering,
    );
  }

  scale(x: number, y: number) {
    this.ctx.scale(x, y);
  }

  updateOffscreenCanvas(newClonedElement: HTMLCanvasElement) {
    newClonedElement.id = this.element.id + "-offscreen";
    this.clonedElement.replaceWith(newClonedElement);
    this.clonedElement = newClonedElement;
    const offscreen = this.clonedElement.transferControlToOffscreen();
    this.offscreenCanvas = offscreen;
    this.worker.postMessage(
      {
        canvas: offscreen,
        dpr: this.dpr,
      },
      [offscreen],
    );
  }

  setWidth(width: number, devicePixelRatio?: number) {
    this.width = width;
    this.element.width = devicePixelRatio ? width * devicePixelRatio : width;
    this.element.style.width = `${width}px`;
    // after setting offscreen canvas, the canvas cannot change its size
    // thus we need to clone a new canvas and replace the old one
    if (this.clonedElement && this.worker) {
      const newClonedElement = this.element.cloneNode(
        true,
      ) as HTMLCanvasElement;
      this.clonedElement.style["touchAction"] = "none";
      this.clonedElement.style["userSelect"] = "none";
      this.clonedElement.style["pointerEvents"] = "none";
      newClonedElement.width = devicePixelRatio
        ? width * devicePixelRatio
        : width;
      this.clonedElement.id = this.element.id + "-offscreen";
      newClonedElement.style.width = `${width}px`;
      this.updateOffscreenCanvas(newClonedElement);
    }
  }

  setHeight(height: number, devicePixelRatio?: number) {
    this.height = height;
    this.element.height = devicePixelRatio ? height * devicePixelRatio : height;
    this.element.style.height = `${height}px`;
    if (this.clonedElement && this.worker) {
      const newClonedElement = this.element.cloneNode(
        true,
      ) as HTMLCanvasElement;
      this.clonedElement.id = this.element.id + "-offscreen";
      this.clonedElement.style["touchAction"] = "none";
      this.clonedElement.style["userSelect"] = "none";
      this.clonedElement.style["pointerEvents"] = "none";
      newClonedElement.height = devicePixelRatio
        ? height * devicePixelRatio
        : height;
      newClonedElement.style.height = `${height}px`;
      this.updateOffscreenCanvas(newClonedElement);
    }
  }

  setDpr(dpr: number) {
    this.dpr = dpr;
    if (this.worker) {
      this.worker.postMessage({
        dpr: this.dpr,
      });
    }
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
