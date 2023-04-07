import { ButtonDirection } from "../components/Canvas";
import { PixelModifyItem } from "../components/Canvas/types";
import { Action, ActionType } from "./Action";
import { ColorChangeMode } from "./ColorChangeAction";

export class ColorSizeChangeAction extends Action {
  type = ActionType.ColorChange;
  mode: ColorChangeMode;
  data: Array<PixelModifyItem>;
  direction: ButtonDirection;
  changeAmount: number;

  constructor(
    mode: ColorChangeMode,
    data: Array<PixelModifyItem>,
    direction: ButtonDirection,
    changeAmount: number
  ) {
    super();
    this.mode = mode;
    this.data = data;
    this.direction = direction;
    this.changeAmount = changeAmount;
  }

  createInverseAction(): Action {
    if (this.mode === ColorChangeMode.Fill) {
      return new ColorSizeChangeAction(
        ColorChangeMode.Erase,
        this.data,
        this.direction,
        this.changeAmount
      );
    } else if (this.mode === ColorChangeMode.Erase) {
      return new ColorSizeChangeAction(
        ColorChangeMode.Fill,
        this.data,
        this.direction,
        this.changeAmount
      );
    } else {
      throw new Error("Unable to create inverse action for color change");
    }
  }

  getType(): string {
    return this.type;
  }
}
