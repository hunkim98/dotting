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

  // abstract mouseUp(): void;

  // abstract mouseDown(
  //   mouseCartCoord?: Coord,
  //   pixelIndex?: {
  //     rowIndex: number;
  //     columnIndex: number;
  //   },
  // ): void;

  // abstract mouseMove(
  //   mouseCartCoord: Coord,
  //   pixelIndex: {
  //     rowIndex: number;
  //     columnIndex: number;
  //   },
  //   hoveredPixel: {
  //     rowIndex: number;
  //     columnIndex: number;
  //     color: string;
  //   },
  // ): void;

  abstract drawPixelInInteractionLayer(
    rowIndex: number,
    columnIndex: number,
  ): void;

  // CAUTION: bind this
  // If there are any other methods that need to be bound, add them here
}
