import { BaseWorker, BrushWorker } from "./BaseWorker";
import { ButtonDirection, MouseMode } from "../components/Canvas/config";
import InteractionLayer from "../components/Canvas/InteractionLayer";
import { BrushTool, DottingData } from "../components/Canvas/types";
import { getDoesAreaOverlapPixelgrid } from "../utils/position";
import { Coord } from "../utils/types";

export class Select extends BaseWorker {
  toolType = BrushTool.SELECT;
  workerType = BrushWorker.Select;

  private data: DottingData;
  private mouseMode: MouseMode;
  private rowCount: number;
  private columnCount: number;
  private gridSquareLength: number;
  private interactionLayer: InteractionLayer;
  private mouseDownWorldPos: Coord;

  constructor(
    data: DottingData,
    mouseMode: MouseMode,
    rowCount: number,
    columnCount: number,
    gridSquareLength: number,
    interactionLayer: InteractionLayer,
    mouseDownWorldPos: Coord,
  ) {
    super();
    this.data = data;
    this.mouseMode = mouseMode;
    this.rowCount = rowCount;
    this.columnCount = columnCount;
    this.gridSquareLength = gridSquareLength;
    this.interactionLayer = interactionLayer;
    this.mouseDownWorldPos = mouseDownWorldPos;
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

  // TODO: (select) vs (dot, eraser, paintBucket)
  mouseDown() {
    //   // brush tool select also means mouse is drawng
    //   // TODO: needs to modify the mousemode to be more specific
    //   this.mouseMode = MouseMode.DRAWING;
    //   const previousSelectedArea = this.interactionLayer.getSelectedArea();
    //   let isMouseCoordInSelectedArea = false;
    //   if (previousSelectedArea) {
    //     isMouseCoordInSelectedArea = getIsPointInsideRegion(
    //       this.mouseDownWorldPos,
    //       previousSelectedArea,
    //     );
    //   }
    //   // we need to reset the selected area if the mouse is not in the previous selected area
    //   if (!isMouseCoordInSelectedArea) {
    //     this.interactionLayer.setSelectedArea(null);
    //     this.interactionLayer.setSelectingArea({
    //       startWorldPos: this.mouseDownWorldPos,
    //       endWorldPos: this.mouseDownWorldPos,
    //     });
    //   } else {
    //     // we will move the selected area if the mouse is in the previous selected area
    //     // remove the selecting area if it exists
    //     this.interactionLayer.setSelectingArea(null);
    //     const data = this.data;
    //     const rowCount = this.rowCount;
    //     const columnCount = this.columnCount;
    //     const rowKeys = getRowKeysFromData(data);
    //     const columnKeys = getColumnKeysFromData(data);
    //     const sortedRowKeys = rowKeys.sort((a, b) => a - b);
    //     const sortedColumnKeys = columnKeys.sort((a, b) => a - b);
    //     const { includedPixelsIndices } = convertWorldPosAreaToPixelGridArea(
    //       previousSelectedArea,
    //       rowCount,
    //       columnCount,
    //       this.gridSquareLength,
    //       sortedRowKeys,
    //       sortedColumnKeys,
    //     );
    //     if (!includedPixelsIndices) {
    //       this.interactionLayer.setSelectedArea(null);
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
    //     this.dataLayer.erasePixels(filteredSelectedAreaPixels);
    //     this.interactionLayer.setSelectedAreaPixels(selectedAreaPixels);
    //     this.interactionLayer.setMovingSelectedPixels(selectedAreaPixels);
    //     this.interactionLayer.setMovingSelectedArea(previousSelectedArea);
    //     this.dataLayer.render();
    //     this.interactionLayer.render();
    //     // move the pixels to interaction layer
    //   }
  }

  // TODO
  mouseMove() {
    return;
  }

  // QUESTION: implement without callback func
  mouseUp(selectingCallback, movingCallback, renderCallback) {
    selectingCallback();
    movingCallback();
    // get the updated selected area
    const selectedArea = this.interactionLayer.getSelectedArea();
    const doesSelectedAreaExistInGrid = getDoesAreaOverlapPixelgrid(
      selectedArea,
      this.rowCount,
      this.columnCount,
      this.gridSquareLength,
    );
    if (!doesSelectedAreaExistInGrid) {
      this.interactionLayer.setMovingSelectedArea(null);
      this.interactionLayer.setMovingSelectedPixels(null);
      this.interactionLayer.setSelectedArea(null);
      this.interactionLayer.setSelectedAreaPixels(null);
      renderCallback();
    }
  }
}
