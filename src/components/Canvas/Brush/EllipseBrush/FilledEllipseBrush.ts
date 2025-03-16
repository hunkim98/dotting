import { BaseEllipseBrush } from "./BaseEllipseBrush";
import { Index } from "../../../../utils/types";
import { BrushTool, Coord, DottingData } from "../../types";

export class FilledEllipseBrush extends BaseEllipseBrush {
  toolName: BrushTool = BrushTool.ELLIPSE_FILLED;
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
