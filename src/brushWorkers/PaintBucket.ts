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
import { addEvent, touchy } from "../utils/touch";
import { Indices } from "../utils/types";
import { isValidIndicesRange } from "../utils/validation";

export class PaintBucket extends BaseWorker {
  toolType = BrushTool.PAINT_BUCKET;
  workerType = BrushWorker.PaintBucket;

  private data: DottingData;
  private brushColor: string;
  private mouseMode: MouseMode;
  private copiedData: DottingData;
  private interactionLayer: InteractionLayer;

  constructor(
    data: DottingData,
    brushColor: string,
    mouseMode: MouseMode,
    copiedData: DottingData,
    interactionLayer: InteractionLayer,
  ) {
    super();
    this.data = data;
    this.brushColor = brushColor;
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

  drawPixelInInteractionLayer(rowIndex: number, columnIndex: number) {
    const gridIndices = getGridIndicesFromData(this.data);
    const initialSelectedColor = this.data
      .get(rowIndex)
      ?.get(columnIndex)?.color;
    if (initialSelectedColor === this.brushColor) {
      return;
    }
    this.colorAdjacentPixelsOfSameColor(initialSelectedColor, gridIndices, {
      rowIndex,
      columnIndex,
    });
  }

  colorAdjacentPixelsOfSameColor(
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
      const color = this.brushColor;
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

  // mouseDown(mouseCartCoord, pixelIndex) {
  //   if (pixelIndex && this.editor.getBrushTool() !== BrushTool.NONE) {
  //     this.editor.emitHoverPixelChangeEvent({
  //       indices: null,
  //     });
  //     this.drawPixelInInteractionLayer(
  //       pixelIndex.rowIndex,
  //       pixelIndex.columnIndex,
  //     );
  //     this.editor.renderInteractionLayer();
  //     this.editor.renderErasedPixelsFromInteractionLayerInDataLayer();
  //   }
  //   const isGridFixed = this.editor.getGridLayer().getIsGridFixed();
  //   if (!isGridFixed) {
  //     const buttonDirection = this.editor.detectButtonClicked(mouseCartCoord);
  //     if (buttonDirection) {
  //       this.editor.getExtensionPoint().lastMousePos = {
  //         x: mouseCartCoord.x,
  //         y: mouseCartCoord.y,
  //       };
  //       this.editor.getExtensionPoint().direction = buttonDirection;
  //       this.editor.setMouseMode(MouseMode.EXTENDING);
  //       touchy(
  //         this.editor.getElement(),
  //         addEvent,
  //         "mousemove",
  //         this.editor.handleExtension,
  //       );
  //     }
  //   }
  // }

  // mouseMove(mouseCartCoord, pixelIndex, hoveredPixel) {
  //   if (pixelIndex) {
  //     if (this.editor.getMouseMode() === MouseMode.DRAWING) {
  //       this.drawPixelInInteractionLayer(
  //         pixelIndex.rowIndex,
  //         pixelIndex.columnIndex,
  //       );
  //       this.editor.renderInteractionLayer();
  //     } else {
  //       if (
  //         // We should also consider when the hovered pixel is null
  //         !hoveredPixel ||
  //         hoveredPixel.rowIndex !== pixelIndex.rowIndex ||
  //         hoveredPixel.columnIndex !== pixelIndex.columnIndex
  //       ) {
  //         this.editor.emitHoverPixelChangeEvent({
  //           indices: pixelIndex,
  //         });
  //       }

  //       this.editor.getInteractionLayer().setHoveredPixel({
  //         rowIndex: pixelIndex.rowIndex,
  //         columnIndex: pixelIndex.columnIndex,
  //         color: this.editor.getBrushColor(),
  //       });
  //       this.editor.renderInteractionLayer();
  //     }
  //   } else {
  //     if (hoveredPixel !== null) {
  //       this.editor.emitHoverPixelChangeEvent({
  //         indices: null,
  //       });
  //       this.editor.getInteractionLayer().setHoveredPixel(null);
  //       this.editor.renderInteractionLayer();
  //     }
  //   }
  //   const buttonDirection = this.editor.detectButtonClicked(mouseCartCoord);
  //   if (buttonDirection) {
  //     this.editor.getGridLayer().setHoveredButton(buttonDirection);
  //     this.editor.renderGridLayer();
  //     return;
  //   } else {
  //     if (this.editor.getMouseMode() !== MouseMode.EXTENDING) {
  //       this.editor.getGridLayer().setHoveredButton(null);
  //       this.editor.renderGridLayer();
  //     }
  //   }
  // }

  // mouseUp() {
  //   return;
  // }
}
