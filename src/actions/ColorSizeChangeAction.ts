import { ButtonDirection } from "../components/Canvas";
import { PixelModifyItem } from "../components/Canvas/types";
import { Action, ActionType } from "./Action";
import { ColorChangeAction, ColorChangeData, ColorChangeMode } from "./ColorChangeAction";
import { ChangeAmountData } from "./SizeChangeAction";

export class ColorSizeChangeAction extends Action {
  type = ActionType.ColorSizeChange;
  data: Array<ColorChangeData>;
  changeAmounts: Array<ChangeAmountData> = [];

  constructor(
    data: Array<ColorChangeData>,
    changeAmounts: Array<ChangeAmountData>
  ) {
    super();
    this.data = data;
    this.changeAmounts = changeAmounts;
  }

  createInverseAction(): Action {
    return new ColorSizeChangeAction(
      this.data.map((item) => ({
        ...item,
        previousColor: item.color,
        color: item.previousColor,
      })),
      this.changeAmounts.map((item) => ({
        ...item,
        amount: -item.amount,
      }))
    );
  }

  getType(): string {
    return this.type;
  }
}
