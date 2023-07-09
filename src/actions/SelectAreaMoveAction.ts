import { Action, ActionType } from "./Action";
import {
  BrushTool,
  ColorChangeItem,
  SelectAreaRange,
} from "../components/Canvas/types";

export class SelectAreaMoveAction extends Action {
  type = ActionType.SelectAreaMove;
  data: Array<ColorChangeItem>;
  tool = BrushTool.SELECT;
  previousSelectedArea: SelectAreaRange | null;
  newSelectedArea: SelectAreaRange | null;

  constructor(
    data: Array<ColorChangeItem>,
    previousSelectedArea: SelectAreaRange | null,
    newSelectedArea: SelectAreaRange | null,
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
