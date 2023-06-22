import { ButtonDirection } from "../../components/Canvas/config";
import { BrushTool } from "../../components/Canvas/types";

export enum SelectionWorkerType {
  Select = "Select",
}

export abstract class SelectionWorker {
  abstract getToolType(): BrushTool;

  abstract getWorkerType(): SelectionWorkerType;

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

  abstract mouseDown(): void;

  abstract mouseMove(): void;
}
