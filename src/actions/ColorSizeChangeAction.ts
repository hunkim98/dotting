import { ButtonDirection } from "../components/Canvas";
import { ColorChangeItem, PixelModifyItem } from "../components/Canvas/types";
import { Action, ActionType } from "./Action";
import { ColorChangeAction, ColorChangeMode } from "./ColorChangeAction";
import { ChangeAmountData } from "./SizeChangeAction";

export class ColorSizeChangeAction extends Action {
  type = ActionType.ColorSizeChange;
  data: Array<ColorChangeItem>;
  changeAmounts: Array<ChangeAmountData> = [];

  constructor(
    data: Array<ColorChangeItem>,
    changeAmounts: Array<ChangeAmountData>,
  ) {
    super();
    this.data = data;
    this.changeAmounts = changeAmounts;
  }

  createInverseAction(): Action {
    return new ColorSizeChangeAction(
      this.data.map(item => ({
        ...item,
        previousColor: item.color,
        color: item.previousColor,
      })),
      this.changeAmounts.map(item => ({
        ...item,
        amount: -item.amount,
      })),
    );
  }

  getType(): string {
    return this.type;
  }
}
