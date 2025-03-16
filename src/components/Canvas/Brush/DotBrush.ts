import { BaseBrush } from "./BaseBrush";
import { getGridIndicesFromData } from "../../../utils/data";
import { Index } from "../../../utils/types";
import InteractionLayer from "../InteractionLayer";
import { BRUSH_PATTERN_ELEMENT, BrushTool, Coord, DottingData } from "../types";

export class DotBrush extends BaseBrush {
  toolName: BrushTool = BrushTool.DOT;
  candidatePoints: Index[] = [];
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
  ): void {
    this.candidatePoints.push(
      ...this.getCandidatePoints(
        startPoint,
        endPoint,
        currentData,
        gridSquareLength,
        filled,
        brushPattern,
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
      filled,
      brushPattern,
    );
    this.renderPreview();
  }

  getCandidatePoints(
    startPoint: Coord,
    endPoint: Coord,
    currentData: DottingData,
    gridSquareLength: number,
    filled?: boolean,
    brushPattern?: Array<Array<BRUSH_PATTERN_ELEMENT>>,
  ): Index[] {
    if (!brushPattern) {
      return [];
    }
    const brushPatternWidth = brushPattern.length;
    const brushPatternHeight = brushPattern[0].length;
    const brushPatternCenterRowIndex = Math.floor(brushPatternHeight / 2);
    const brushPatternCenterColumnIndex = Math.floor(brushPatternWidth / 2);
    const { startIndex, endIndex } = this.getStartEndIndex(
      startPoint,
      endPoint,
      gridSquareLength,
      currentData,
    );
    if (!startIndex) {
      return [];
    }
    const rowIndex = startIndex.rowIndex;
    const columnIndex = startIndex.columnIndex;
    const points: Index[] = [];
    for (let i = 0; i < brushPattern.length; i++) {
      for (let j = 0; j < brushPattern[i].length; j++) {
        const brushPatternItem = brushPattern[i][j];
        if (brushPatternItem === 0) {
          continue;
        }
        const {
          topRowIndex,
          leftColumnIndex,
          bottomRowIndex,
          rightColumnIndex,
        } = getGridIndicesFromData(currentData);
        const rowIndexToColor = rowIndex + i - brushPatternCenterRowIndex;
        const columnIndexToColor =
          columnIndex + j - brushPatternCenterColumnIndex;
        if (
          rowIndexToColor < topRowIndex ||
          rowIndexToColor > bottomRowIndex ||
          columnIndexToColor < leftColumnIndex ||
          columnIndexToColor > rightColumnIndex
        ) {
          continue;
        }
        points.push({
          rowIndex: rowIndexToColor,
          columnIndex: columnIndexToColor,
        });
      }
    }
    return points;
  }
}
