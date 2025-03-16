import { Index } from "../../../../utils/types";
import InteractionLayer from "../../InteractionLayer";
import {
  BRUSH_PATTERN_ELEMENT,
  BrushTool,
  Coord,
  DottingData,
} from "../../types";
import { BaseBrush } from "../BaseBrush";

export abstract class BaseSelectBrush extends BaseBrush {
  abstract toolName: BrushTool;
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
