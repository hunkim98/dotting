import { ButtonDirection } from "../../components/Canvas/config";
import { BrushTool } from "../../components/Canvas/types";

export enum DrawingWorkerType {
  Dot = "Dot",
  Eraser = "Eraser",
  PaintBucket = "PaintBucket",
}

export abstract class DrawingWorker {
  abstract getToolType(): BrushTool;

  abstract getWorkerType(): DrawingWorkerType;

  abstract styleMouseCursor(
    hoveredButton: ButtonDirection,
    element: HTMLCanvasElement,
  ): void;

  abstract drawPixelInInteractionLayer(
    brushColor: string,
    rowIndex: number,
    columnIndex: number,
  ): void;

  abstract mouseUp(): void;

  abstract mouseDown(): void;

  abstract mouseMove(): void;
}
