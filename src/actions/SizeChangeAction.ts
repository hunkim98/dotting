import { Action, ActionType } from "./Action";
import { Direction } from "../components/Canvas/config";
import { PixelModifyItem } from "../components/Canvas/types";

export interface ChangeAmountData {
  direction: Direction;
  amount: number;
  startIndex: number;
}

export class SizeChangeAction extends Action {
  type = ActionType.SizeChange;
  data: Array<PixelModifyItem>;
  changeAmounts: Array<ChangeAmountData>;

  constructor(
    data: Array<PixelModifyItem>,
    changeAmounts: Array<ChangeAmountData>,
  ) {
    super();
    this.data = data;
    this.changeAmounts = changeAmounts;
  }

  createInverseAction(): Action {
    return new SizeChangeAction(
      this.data,
      this.changeAmounts.map(item => {
        let newStartIndex = item.startIndex;
        if (
          item.direction === Direction.TOP ||
          item.direction === Direction.LEFT
        ) {
          newStartIndex = item.startIndex - item.amount;
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
