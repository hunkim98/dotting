import { BaseWorker, BrushWorker } from "./BaseWorker";
import {
  ButtonDirection,
  CurrentDeviceUserId,
  MouseMode,
} from "../components/Canvas/config";
import InteractionLayer from "../components/Canvas/InteractionLayer";
import { BrushTool, DottingData } from "../components/Canvas/types";
import { addEvent, touchy } from "../utils/touch";

export class Eraser extends BaseWorker {
  toolType = BrushTool.ERASER;
  workerType = BrushWorker.Eraser;

  private data: DottingData;
  private brushColor: string;
  private mouseMode: MouseMode;
  private interactionLayer: InteractionLayer;

  constructor(
    data: DottingData,
    brushColor: string,
    mouseMode: MouseMode,
    interactionLayer: InteractionLayer,
  ) {
    super();
    this.data = data;
    this.brushColor = brushColor;
    this.mouseMode = mouseMode;
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
    const previousColor = this.data.get(rowIndex)?.get(columnIndex).color;
    this.interactionLayer.addToErasedPixelRecords(CurrentDeviceUserId, {
      rowIndex,
      columnIndex,
      color: "",
      previousColor,
    });
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
  //       this.editor.renderErasedPixelsFromInteractionLayerInDataLayer();
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
  //         color: "white",
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

  mouseUp() {
    return;
  }
}
