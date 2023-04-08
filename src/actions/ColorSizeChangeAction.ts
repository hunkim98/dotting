import { ButtonDirection } from "../components/Canvas";
import { PixelModifyItem } from "../components/Canvas/types";
import { Action, ActionType } from "./Action";
import { ColorChangeMode } from "./ColorChangeAction";

export class ColorSizeChangeAction extends Action {
  type = ActionType.ColorSizeChange;
  mode: ColorChangeMode;
  data: Array<PixelModifyItem>;
  changeAmounts: Array<{ direction: ButtonDirection; amount: number }> = [];

  constructor(
    mode: ColorChangeMode,
    data: Array<PixelModifyItem>,
    changeAmounts: Array<{ direction: ButtonDirection; amount: number }>
  ) {
    super();
    this.mode = mode;
    this.data = data;
    this.changeAmounts = changeAmounts;
  }

  createInverseAction(): Action {
    if (this.mode === ColorChangeMode.Fill) {
      return new ColorSizeChangeAction(
        ColorChangeMode.Erase,
        this.data,
        this.changeAmounts.map((item) => ({
          ...item,
          amount: -item.amount,
        }))
      );
    } else if (this.mode === ColorChangeMode.Erase) {
      return new ColorSizeChangeAction(
        ColorChangeMode.Fill,
        this.data,
        this.changeAmounts.map((item) => ({
          ...item,
          amount: -item.amount,
        }))
      );
    } else {
      throw new Error("Unable to create inverse action for color change");
    }
  }

  getType(): string {
    return this.type;
  }
}
