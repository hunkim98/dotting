import { BaseBrush } from "./BaseBrush";
import { Index } from "../../../utils/types";
import InteractionLayer from "../InteractionLayer";
import { BRUSH_PATTERN_ELEMENT, BrushTool, Coord, DottingData } from "../types";

export class PaintBucketBrush extends BaseBrush {
  toolName: BrushTool = BrushTool.PAINT_BUCKET;
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
    brushPattern?: Array<Array<BRUSH_PATTERN_ELEMENT>>,
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
    return [];
  }
}
