import { BaseBrush } from "./BaseBrush";
import { Index } from "../../../utils/types";
import InteractionLayer from "../InteractionLayer";
import { BRUSH_PATTERN_ELEMENT, BrushTool, Coord, DottingData } from "../types";

export class EraserBrush extends BaseBrush {
  toolName: BrushTool = BrushTool.ERASER;
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
    return;
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
    return [];
  }
}
