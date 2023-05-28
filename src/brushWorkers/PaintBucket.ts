import { BaseWorker, BrushWorker } from "./BaseWorker";
import {
  ButtonDirection,
  CurrentDeviceUserId,
  MouseMode,
} from "../components/Canvas/config";
import InteractionLayer from "../components/Canvas/InteractionLayer";
import { BrushTool, DottingData } from "../components/Canvas/types";
import { getGridIndicesFromData } from "../utils/data";
import Queue from "../utils/queue";
import { Indices } from "../utils/types";
import { isValidIndicesRange } from "../utils/validation";

export class PaintBucket extends BaseWorker {
  toolType = BrushTool.PAINT_BUCKET;
  workerType = BrushWorker.PaintBucket;

  private data: DottingData;
  private mouseMode: MouseMode;
  private copiedData: DottingData;
  private interactionLayer: InteractionLayer;

  constructor(
    data: DottingData,
    mouseMode: MouseMode,
    copiedData: DottingData,
    interactionLayer: InteractionLayer,
  ) {
    super();
    this.data = data;
    this.mouseMode = mouseMode;
    this.copiedData = copiedData;
    this.interactionLayer = interactionLayer;
  }

  getToolType(): BrushTool {
    return this.toolType;
  }

  getWorkerType(): BrushWorker {
    return this.workerType;
  }

  styleMouseCursor(hoveredButton: ButtonDirection, element: HTMLCanvasElement) {
    if (!hoveredButton) {
      element.style.cursor = `crosshair`;
    } else {
      switch (hoveredButton) {
        case ButtonDirection.TOP:
          element.style.cursor = `ns-resize`;
          break;
        case ButtonDirection.BOTTOM:
          element.style.cursor = `ns-resize`;
          break;
        case ButtonDirection.LEFT:
          element.style.cursor = `ew-resize`;
          break;
        case ButtonDirection.RIGHT:
          element.style.cursor = `ew-resize`;
          break;
      }
    }
  }

  drawPixelInInteractionLayer(
    brushColor: string,
    rowIndex: number,
    columnIndex: number,
  ) {
    const gridIndices = getGridIndicesFromData(this.data);
    const initialSelectedColor = this.data
      .get(rowIndex)
      ?.get(columnIndex)?.color;
    if (initialSelectedColor === brushColor) {
      return;
    }
    this.colorAdjacentPixelsOfSameColor(
      brushColor,
      initialSelectedColor,
      gridIndices,
      {
        rowIndex,
        columnIndex,
      },
    );
  }

  colorAdjacentPixelsOfSameColor(
    brushColor: string,
    initialColor: string,
    gridIndices: Indices,
    currentIndices: { rowIndex: number; columnIndex: number },
  ): void {
    const indicesQueue = new Queue<{
      rowIndex: number;
      columnIndex: number;
    }>();
    indicesQueue.enqueue(currentIndices);
    this.interactionLayer.setCapturedData(this.copiedData);
    const data = this.interactionLayer.getCapturedData()!;
    while (indicesQueue.size() > 0) {
      const { rowIndex, columnIndex } = indicesQueue.dequeue()!;
      if (!isValidIndicesRange(rowIndex, columnIndex, gridIndices)) {
        continue;
      }

      const currentPixel = data.get(rowIndex)?.get(columnIndex);
      if (!currentPixel || currentPixel?.color !== initialColor) {
        continue;
      }
      const color = brushColor;
      const previousColor = data.get(rowIndex)!.get(columnIndex)!.color;
      data.get(rowIndex).get(columnIndex)!.color = color;
      // paint same color region is recorded in stroked pixels
      this.interactionLayer.addToStrokePixelRecords(CurrentDeviceUserId, {
        rowIndex,
        columnIndex,
        color,
        previousColor,
      });
      [
        { rowIndex: rowIndex - 1, columnIndex },
        { rowIndex: rowIndex + 1, columnIndex },
        { rowIndex, columnIndex: columnIndex - 1 },
        { rowIndex, columnIndex: columnIndex + 1 },
      ].forEach(({ rowIndex, columnIndex }) => {
        indicesQueue.enqueue({ rowIndex, columnIndex });
      });
    }
    this.interactionLayer.resetCapturedData();
  }

  // TODO
  mouseDown() {
    return;
  }

  // TODO
  mouseMove() {
    return;
  }

  mouseUp() {
    return;
  }
}
