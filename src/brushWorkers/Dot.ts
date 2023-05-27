import { BaseWorker, BrushWorker } from "./BaseWorker";
import {
  ButtonDirection,
  CurrentDeviceUserId,
  MouseMode,
} from "../components/Canvas/config";
import InteractionLayer from "../components/Canvas/InteractionLayer";
import { BrushTool, DottingData } from "../components/Canvas/types";
import { addEvent, touchy } from "../utils/touch";
import { Coord } from "../utils/types";

export class Dot extends BaseWorker {
  toolType = BrushTool.DOT;
  workerType = BrushWorker.Dot;

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

  drawPixelInInteractionLayer(rowIndex: number, columnIndex: number) {
    const previousColor = this.data.get(rowIndex)?.get(columnIndex).color;
    this.interactionLayer.addToStrokePixelRecords(CurrentDeviceUserId, {
      rowIndex,
      columnIndex,
      color: this.brushColor,
      previousColor,
    });
  }

  // mouseDown(
  //   mouseCartCoord?: Coord,
  //   pixelIndex?: {
  //     rowIndex: number;
  //     columnIndex: number;
  //   },
  // ) {
  //   if (pixelIndex) {
  //     editor.emitHoverPixelChangeEvent({
  //       indices: null,
  //     });
  //     this.drawPixelInInteractionLayer(
  //       pixelIndex.rowIndex,
  //       pixelIndex.columnIndex,
  //       brushColor,
  //       previousColor,
  //     );
  //     this.renderInteractionLayer();
  //     editor.renderErasedPixelsFromInteractionLayerInDataLayer();
  //   }
  //   const isGridFixed = editor.getGridLayer().getIsGridFixed();
  //   if (!isGridFixed) {
  //     const buttonDirection = editor.detectButtonClicked(mouseCartCoord);
  //     if (buttonDirection) {
  //       editor.getExtensionPoint().lastMousePos = {
  //         x: mouseCartCoord.x,
  //         y: mouseCartCoord.y,
  //       };
  //       editor.getExtensionPoint().direction = buttonDirection;
  //       editor.setMouseMode(MouseMode.EXTENDING);
  //       touchy(
  //         editor.getElement(),
  //         addEvent,
  //         "mousemove",
  //         editor.handleExtension,
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
  //     if (this.mouseMode !== MouseMode.EXTENDING) {
  //       this.editor.getGridLayer().setHoveredButton(null);
  //       this.editor.renderGridLayer();
  //     }
  //   }
  // }

  // mouseUp() {
  //   return;
  // }
}
