import { BrushTool, ColorChangeItem } from "../components/Canvas/types";
import { Coord } from "../utils/types";
import { Action, ActionType } from "./Action";

export class SelectAreaMoveAction extends Action {
  type = ActionType.SelectAreaMove;
  data: Array<ColorChangeItem>;
  tool = BrushTool.SELECT;
  previousSelectedArea: { startWorldPos: Coord; endWorldPos: Coord } | null;
  newSelectedArea: { startWorldPos: Coord; endWorldPos: Coord } | null;

  constructor(
    data: Array<ColorChangeItem>,
    previousSelectedArea: { startWorldPos: Coord; endWorldPos: Coord } | null,
    newSelectedArea: { startWorldPos: Coord; endWorldPos: Coord } | null,
  ) {
    super();
    this.data = data;
    this.previousSelectedArea = previousSelectedArea;
    this.newSelectedArea = newSelectedArea;
    // below are functions to manipulate the canvas
  }

  createInverseAction(): Action {
    return new SelectAreaMoveAction(
      this.data.map(item => ({
        ...item,
        previousColor: item.color,
        color: item.previousColor,
      })),
      this.newSelectedArea,
      this.previousSelectedArea,
    );
  }

  getType(): string {
    return this.type;
  }
}
