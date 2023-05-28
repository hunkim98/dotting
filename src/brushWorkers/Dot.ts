import { BaseWorker, BrushWorker } from "./BaseWorker";
import {
  ButtonDirection,
  CurrentDeviceUserId,
  MouseMode,
} from "../components/Canvas/config";
import InteractionLayer from "../components/Canvas/InteractionLayer";
import { BrushTool, DottingData } from "../components/Canvas/types";

export class Dot extends BaseWorker {
  toolType = BrushTool.DOT;
  workerType = BrushWorker.Dot;

  private data: DottingData;
  private mouseMode: MouseMode;
  private interactionLayer: InteractionLayer;

  constructor(
    data: DottingData,
    mouseMode: MouseMode,
    interactionLayer: InteractionLayer,
  ) {
    super();
    this.data = data;
    this.mouseMode = mouseMode;
    this.interactionLayer = interactionLayer;
  }

  getToolType(): BrushTool {
    return this.toolType;
  }

  getWorkerType(): BrushWorker {
    return this.workerType;
  }

  renderInteractionLayer() {
    this.interactionLayer.render();
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
    const previousColor = this.data.get(rowIndex)?.get(columnIndex).color;
    this.interactionLayer.addToStrokePixelRecords(CurrentDeviceUserId, {
      rowIndex,
      columnIndex,
      color: brushColor,
      previousColor,
    });
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
