import { getAllGridIndicesSorted } from "../../../../utils/data";
import { getBresenhamEllipseIndices } from "../../../../utils/math";
import { getPixelIndexFromMouseCartCoord } from "../../../../utils/position";
import { Index } from "../../../../utils/types";
import InteractionLayer from "../../InteractionLayer";
import {
  BRUSH_PATTERN_ELEMENT,
  BrushTool,
  Coord,
  DottingData,
} from "../../types";
import { BaseBrush } from "../BaseBrush";

export abstract class BaseEllipseBrush extends BaseBrush {
  abstract toolName: BrushTool;
  constructor(layer: InteractionLayer) {
    super(layer);
  }

  onMouseDown(
    mouseDownPoint: Coord,
    currentData: DottingData,
    gridSquareLength: number,
    filled?: boolean,
    brushPattern?: Array<Array<BRUSH_PATTERN_ELEMENT>>,
  ): void {
    return;
  }

  onMouseMove(
    startPoint: Coord,
    endPoint: Coord,
    currentData: DottingData,
    gridSquareLength: number,
    filled?: boolean,
  ) {
    this.candidatePoints = this.getCandidatePoints(
      startPoint,
      endPoint,
      currentData,
      gridSquareLength,
      filled,
    );
    this.renderPreview();
  }

  execute(
    startPoint: Coord,
    endPoint: Coord,
    currentData: DottingData,
    gridSquareLength: number,
    color: string,
    filled?: boolean,
    brushPattern?: Array<Array<BRUSH_PATTERN_ELEMENT>>,
    userId?: string,
  ) {
    return;
  }

  getCandidatePoints(
    startPoint: Coord,
    endPoint: Coord,
    currentData: DottingData,
    gridSquareLength: number,
    filled?: boolean,
  ): Index[] {
    if (!startPoint || !endPoint) return [];
    if (
      Math.abs(endPoint.x - startPoint.x) >= gridSquareLength ||
      Math.abs(endPoint.y - startPoint.y) >= gridSquareLength
    ) {
      const { rowIndices, columnIndices } =
        getAllGridIndicesSorted(currentData);
      const pixelIndex = getPixelIndexFromMouseCartCoord(
        endPoint,
        rowIndices,
        columnIndices,
        gridSquareLength,
      );
      const previousIndex = getPixelIndexFromMouseCartCoord(
        startPoint,
        rowIndices,
        columnIndices,
        gridSquareLength,
      );
      if (!previousIndex || !pixelIndex) return [];

      const points: Index[] = [];

      if (
        Math.abs(pixelIndex.columnIndex - previousIndex.columnIndex) >= 1 ||
        Math.abs(pixelIndex.rowIndex - previousIndex.rowIndex) >= 1
      ) {
        points.push(
          ...getBresenhamEllipseIndices(
            previousIndex.columnIndex,
            previousIndex.rowIndex,
            pixelIndex.columnIndex,
            pixelIndex.rowIndex,
            filled,
          ),
        );
      }
      return points;
    }
  }
}
