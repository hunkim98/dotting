import { Coord, Index } from "../../../../utils/types";
import InteractionLayer from "../../InteractionLayer";
import { BRUSH_PATTERN_ELEMENT, BrushTool, DottingData } from "../../types";
import { BaseBrush } from "../BaseBrush";

export class RectangleSelectBrush extends BaseBrush {
  toolName: BrushTool = BrushTool.SELECT;
  candidatePoints: Index[] = [];
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
    return;
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
