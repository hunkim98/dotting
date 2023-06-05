import { Action, ActionType } from "./Action";
import { ChangeAmountData } from "./SizeChangeAction";
import { Direction } from "../components/Canvas/config";
import { ColorChangeItem } from "../components/Canvas/types";

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
        let newStartIndex = item.startIndex;
        if (
          item.direction === Direction.TOP ||
          item.direction === Direction.LEFT
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
          item.direction === Direction.BOTTOM ||
          item.direction === Direction.RIGHT
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
