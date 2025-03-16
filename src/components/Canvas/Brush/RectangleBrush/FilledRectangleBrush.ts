import { BaseRectangleBrush } from "./BaseRectangleBrush";
import { Index } from "../../../../utils/types";
import { BrushTool, Coord, DottingData } from "../../types";

export class FilledRectangleBrush extends BaseRectangleBrush {
  toolName: BrushTool = BrushTool.RECTANGLE_FILLED;
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
      true,
    );
  }
}
