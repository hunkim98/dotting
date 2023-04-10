import { ColorChangeItem } from "../components/Canvas/types";
import { Action, ActionType } from "./Action";

export enum ColorChangeMode {
  Fill = "Fill",
  Erase = "Erase",
}

export class ColorChangeAction extends Action {
  type = ActionType.ColorChange;
  data: Array<ColorChangeItem>;

  constructor(data: Array<ColorChangeItem>) {
    super();
    this.data = data;
    // below are functions to manipulate the canvas
  }

  createInverseAction(): Action {
    return new ColorChangeAction(
      this.data.map(item => ({
        ...item,
        previousColor: item.color,
        color: item.previousColor,
      })),
    );
  }

  getType(): string {
    return this.type;
  }
}
