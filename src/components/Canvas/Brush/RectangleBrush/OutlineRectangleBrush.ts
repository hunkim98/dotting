import { BaseRectangleBrush } from "./BaseRectangleBrush";
import { Index } from "../../../../utils/types";
import { BrushTool, Coord, DottingData } from "../../types";

export class OutlineRectangleBrush extends BaseRectangleBrush {
  toolName: BrushTool = BrushTool.RECTANGLE;
  getCandidatePoints(
    startPoint: Coord,
    endPoint: Coord,
    currentData: DottingData,
    gridSquareLength: number,
  ): Index[] {
    return super.getCandidatePoints(
      startPoint,
      endPoint,
      currentData,
      gridSquareLength,
      false,
    );
  }
}
