import { ButtonDirection } from "../components/Canvas/config";
import { ColorChangeItem } from "../components/Canvas/types";
import { Action, ActionType } from "./Action";
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
      this.changeAmounts.map(item => {
        const wasExtendAction = item.amount > 0;
        let newStartIndex = item.startIndex;
        if (
          item.direction === ButtonDirection.TOP ||
          item.direction === ButtonDirection.LEFT
        ) {
          // if(wasExtendAction){
          // startIndex was starting point for extending
          // change to shorten
          newStartIndex = item.startIndex - item.amount;
          // } else {
          // startIndex was starting point for shorten
          // change to extend
          // }
        } else if (
          item.direction === ButtonDirection.BOTTOM ||
          item.direction === ButtonDirection.RIGHT
        ) {
          newStartIndex = item.startIndex + item.amount;
        }
        return {
          ...item,
          amount: -item.amount,
          startIndex: newStartIndex,
        };
      }),
    );
  }

  getType(): string {
    return this.type;
  }
}
