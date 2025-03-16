import { BaseBrush } from "./BaseBrush";
import { getBresenhamLineIndices } from "../../../utils/math";
import { Index } from "../../../utils/types";
import InteractionLayer from "../InteractionLayer";
import { BRUSH_PATTERN_ELEMENT, BrushTool, Coord, DottingData } from "../types";

export class LineBrush extends BaseBrush {
  toolName: BrushTool = BrushTool.LINE;
  constructor(layer: InteractionLayer) {
    super(layer);
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
    this.candidatePoints.push(
      ...this.getCandidatePoints(
        startPoint,
        endPoint,
        currentData,
        gridSquareLength,
      ),
    );
    this.layer.drawPoints(this.candidatePoints, color, currentData, userId);
    this.candidatePoints = [];
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
    brushPattern?: Array<Array<BRUSH_PATTERN_ELEMENT>>,
  ) {
    this.candidatePoints = this.getCandidatePoints(
      startPoint,
      endPoint,
      currentData,
      gridSquareLength,
    );
    this.renderPreview();
  }

  getCandidatePoints(
    startPoint: Coord,
    endPoint: Coord,
    currentData: DottingData,
    gridSquareLength: number,
  ): Index[] {
    if (
      Math.abs(endPoint.x - startPoint.x) >= gridSquareLength ||
      Math.abs(endPoint.y - startPoint.y) >= gridSquareLength
    ) {
      const { startIndex, endIndex } = this.getStartEndIndex(
        startPoint,
        endPoint,
        gridSquareLength,
        currentData,
      );
      if (!startIndex || !endIndex) return [];

      if (
        Math.abs(endIndex.columnIndex - startIndex.columnIndex) >= 1 ||
        Math.abs(endIndex.rowIndex - startIndex.rowIndex) >= 1
      ) {
        const missingIndices = getBresenhamLineIndices(
          startIndex.rowIndex,
          startIndex.columnIndex,
          endIndex.rowIndex,
          endIndex.columnIndex,
        );

        if (missingIndices.length > 0) {
          return missingIndices;
        }
      }
    }
    return [];
  }
}
