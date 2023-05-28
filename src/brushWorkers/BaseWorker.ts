import { ButtonDirection } from "../components/Canvas/config";
import { BrushTool } from "../components/Canvas/types";
import { Coord } from "../utils/types";

export enum BrushWorker {
  Dot = "Dot",
  Eraser = "Eraser",
  PaintBucket = "PaintBucket",
  Select = "Select",
}

export abstract class BaseWorker {
  abstract getToolType(): BrushTool;

  abstract getWorkerType(): BrushWorker;

  abstract styleMouseCursor(
    hoveredButton: ButtonDirection,
    element: HTMLCanvasElement,
  ): void;

  abstract drawPixelInInteractionLayer(
    brushColor: string,
    rowIndex: number,
    columnIndex: number,
  ): void;

  abstract mouseUp(selectingCallback, movingCallback, renderCallback): void;

  abstract mouseDown(
    mouseCartCoord?: Coord,
    pixelIndex?: {
      rowIndex: number;
      columnIndex: number;
    },
  ): void;

  abstract mouseMove(): void;
}
