import { BaseWorker, BrushWorker } from "./BaseWorker";
import { ButtonDirection, MouseMode } from "../components/Canvas/config";
import Editor from "../components/Canvas/Editor";
import InteractionLayer from "../components/Canvas/InteractionLayer";
import {
  BrushTool,
  ColorChangeItem,
  DottingData,
} from "../components/Canvas/types";
import {
  getColumnKeysFromData,
  getGridIndicesFromData,
  getRowKeysFromData,
} from "../utils/data";
import {
  convertWorldPosAreaToPixelGridArea,
  getDoesAreaOverlapPixelgrid,
  getIsPointInsideRegion,
} from "../utils/position";

export class Select extends BaseWorker {
  toolType = BrushTool.SELECT;
  workerType = BrushWorker.Select;

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
      if (this.interactionLayer.getSelectedArea()) {
        element.style.cursor = `grab`;
      }
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

  drawPixelInInteractionLayer() {
    return;
  }

  // mouseDown() {
  //   // brush tool select also means mouse is drawng
  //   // TODO: needs to modify the mousemode to be more specific
  //   this.editor.setMouseMode(MouseMode.DRAWING);

  //   const previousSelectedArea = this.editor
  //     .getInteractionLayer()
  //     .getSelectedArea();
  //   let isMouseCoordInSelectedArea = false;
  //   if (previousSelectedArea) {
  //     isMouseCoordInSelectedArea = getIsPointInsideRegion(
  //       this.editor.getMouseDownWorldPos(),
  //       previousSelectedArea,
  //     );
  //   }
  //   // we need to reset the selected area if the mouse is not in the previous selected area
  //   if (!isMouseCoordInSelectedArea) {
  //     this.editor.getInteractionLayer().setSelectedArea(null);
  //     this.editor.getInteractionLayer().setSelectingArea({
  //       startWorldPos: this.editor.getMouseDownWorldPos(),
  //       endWorldPos: this.editor.getMouseDownWorldPos(),
  //     });
  //   } else {
  //     // we will move the selected area if the mouse is in the previous selected area
  //     // remove the selecting area if it exists
  //     this.editor.getInteractionLayer().setSelectingArea(null);
  //     const data = this.editor.getDataLayer().getData();
  //     const rowCount = this.editor.getDataLayer().getRowCount();
  //     const columnCount = this.editor.getDataLayer().getColumnCount();
  //     const rowKeys = getRowKeysFromData(data);
  //     const columnKeys = getColumnKeysFromData(data);
  //     const sortedRowKeys = rowKeys.sort((a, b) => a - b);
  //     const sortedColumnKeys = columnKeys.sort((a, b) => a - b);
  //     const gridSquareLength = this.editor.getGridSquareLength();
  //     const { includedPixelsIndices } = convertWorldPosAreaToPixelGridArea(
  //       previousSelectedArea,
  //       rowCount,
  //       columnCount,
  //       gridSquareLength,
  //       sortedRowKeys,
  //       sortedColumnKeys,
  //     );
  //     if (!includedPixelsIndices) {
  //       this.editor.getInteractionLayer().setSelectedArea(null);
  //       return;
  //     }
  //     const selectedAreaPixels: Array<ColorChangeItem> = [];
  //     for (const index of includedPixelsIndices) {
  //       const rowIndex = index.rowIndex;
  //       const columnIndex = index.columnIndex;
  //       const color = data.get(rowIndex).get(columnIndex)?.color;
  //       if (color) {
  //         selectedAreaPixels.push({
  //           rowIndex,
  //           columnIndex,
  //           previousColor: color,
  //           color: "",
  //         });
  //       }
  //     }
  //     const { topRowIndex, bottomRowIndex, leftColumnIndex, rightColumnIndex } =
  //       getGridIndicesFromData(data);
  //     // erase pixels from data layer first
  //     const filteredSelectedAreaPixels = selectedAreaPixels.filter(
  //       ({ rowIndex, columnIndex }) =>
  //         rowIndex >= topRowIndex &&
  //         rowIndex <= bottomRowIndex &&
  //         columnIndex >= leftColumnIndex &&
  //         columnIndex <= rightColumnIndex,
  //     );

  //     this.editor.getDataLayer().erasePixels(filteredSelectedAreaPixels);
  //     this.editor
  //       .getInteractionLayer()
  //       .setSelectedAreaPixels(selectedAreaPixels);
  //     this.editor
  //       .getInteractionLayer()
  //       .setMovingSelectedPixels(selectedAreaPixels);
  //     this.editor
  //       .getInteractionLayer()
  //       .setMovingSelectedArea(previousSelectedArea);
  //     this.editor.getDataLayer().render();
  //     this.editor.getInteractionLayer().render();
  //   }
  // }

  // mouseMove(mouseCartCoord, pixelIndex, hoveredPixel) {
  //   //   const previousSelectingArea = this.editor
  //   //     .getInteractionLayer()
  //   //     .getSelectingArea();
  //   //   const previousSelectedArea = this.editor
  //   //     .getInteractionLayer()
  //   //     .getSelectedArea();
  //   //   const previousSelectedAreaPixels = this.editor
  //   //     .getInteractionLayer()
  //   //     .getSelectedAreaPixels();
  //   //   const movingSelectedPixels = this.editor
  //   //     .getInteractionLayer()
  //   //     .getMovingSelectedPixels();
  //   //   // mouseDownWorldPos may be null
  //   //   if (
  //   //     movingSelectedPixels &&
  //   //     this.editor.getMouseDownWorldPos() &&
  //   //     previousSelectedArea
  //   //   ) {
  //   //     const mouseMoveDistance = diffPoints(
  //   //       this.editor.getMouseDownWorldPos(),
  //   //       this.editor.getMouseMoveWorldPos(),
  //   //     );
  //   //     console.log(mouseMoveDistance);
  //   //     const pixelWiseDeltaX = Math.round(
  //   //       mouseMoveDistance.x / this.editor.getGridSquareLength(),
  //   //     );
  //   //     const pixelWiseDeltaY = Math.round(
  //   //       mouseMoveDistance.y / this.editor.getGridSquareLength(),
  //   //     );
  //   //     const newMovingSelectedPixels = previousSelectedAreaPixels.map(pixel => {
  //   //       return {
  //   //         ...pixel,
  //   //         rowIndex: pixel.rowIndex - pixelWiseDeltaY,
  //   //         columnIndex: pixel.columnIndex - pixelWiseDeltaX,
  //   //       };
  //   //     });
  //   //     this.editor.getInteractionLayer().setMovingSelectedArea({
  //   //       startWorldPos: {
  //   //         x:
  //   //           previousSelectedArea.startWorldPos.x -
  //   //           pixelWiseDeltaX * this.editor.getGridSquareLength(),
  //   //         y:
  //   //           previousSelectedArea.startWorldPos.y -
  //   //           pixelWiseDeltaY * this.editor.getGridSquareLength(),
  //   //       },
  //   //       endWorldPos: {
  //   //         x:
  //   //           previousSelectedArea.endWorldPos.x -
  //   //           pixelWiseDeltaX * this.editor.getGridSquareLength(),
  //   //         y:
  //   //           previousSelectedArea.endWorldPos.y -
  //   //           pixelWiseDeltaY * this.editor.getGridSquareLength(),
  //   //       },
  //   //     });
  //   //     this.editor
  //   //       .getInteractionLayer()
  //   //       .setMovingSelectedPixels(newMovingSelectedPixels);
  //   //     const selectedArea = this.editor
  //   //       .getInteractionLayer()
  //   //       .getMovingSelectedArea();
  //   //     this.editor.getGridLayer().render();
  //   //     this.editor.getGridLayer().renderSelection(selectedArea);
  //   //     this.editor.getInteractionLayer().render();
  //   //     return;
  //   //   }
  //   //   if (previousSelectingArea !== null) {
  //   //     this.editor.getInteractionLayer().setSelectingArea({
  //   //       startWorldPos: this.editor.getMouseDownWorldPos(),
  //   //       endWorldPos: this.editor.getMouseDownWorldPos(),
  //   //     });
  //   //     const selectingArea = this.editor
  //   //       .getInteractionLayer()
  //   //       .getSelectingArea()!;
  //   //     this.editor.renderGridLayer();
  //   //     this.editor.getGridLayer().renderSelection(selectingArea);
  //   //     return;
  //   //   }
  //   return;
  // }

  // mouseUp() {
  //   this.editor.relaySelectingAreaToSelectedArea();
  //   this.editor.relayMovingSelectedAreaToSelectedArea();
  //   // get the updated selected area
  //   const selectedArea = this.editor.getInteractionLayer().getSelectedArea();
  //   const doesSelectedAreaExistInGrid = getDoesAreaOverlapPixelgrid(
  //     selectedArea,
  //     this.editor.getDataLayer().getRowCount(),
  //     this.editor.getDataLayer().getColumnCount(),
  //     this.editor.getGridSquareLength(),
  //   );
  //   if (!doesSelectedAreaExistInGrid) {
  //     this.editor.getInteractionLayer().setMovingSelectedArea(null);
  //     this.editor.getInteractionLayer().setMovingSelectedPixels(null);
  //     this.editor.getInteractionLayer().setSelectedArea(null);
  //     this.editor.getInteractionLayer().setSelectedAreaPixels(null);
  //     this.editor.getGridLayer().render();
  //   }
  // }
}
