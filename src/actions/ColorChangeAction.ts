import { Action, ActionType } from "./Action";
import { ColorChangeItem } from "../components/Canvas/types";

export class ColorChangeAction extends Action {
  type = ActionType.ColorChange;
  data: Array<ColorChangeItem>;

  constructor(data: Array<ColorChangeItem>, layerId: string) {
    super();
    this.data = data;
    this.layerId = layerId;
    // below are functions to manipulate the canvas
  }

  createInverseAction(): Action {
    return new ColorChangeAction(
      this.data.map(item => ({
        ...item,
        previousColor: item.color,
        previousAlpha: item.alpha,
        color: item.previousColor,
        alpha: item.previousAlpha,
      })),
      this.layerId,
    );
  }
}
