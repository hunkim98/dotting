import { Action, ActionType } from "./Action";
import { ButtonDirection } from "../components/Canvas/config";
import { PixelModifyItem } from "../components/Canvas/types";

export interface ChangeAmountData {
  // we only allow vertical or horizontal change
  // diagnoal change is simply a combination of vertical and horizontal change
  direction:
    | ButtonDirection.TOP
    | ButtonDirection.BOTTOM
    | ButtonDirection.LEFT
    | ButtonDirection.RIGHT;
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
    layerId: string,
  ) {
    super();
    this.data = data;
    this.changeAmounts = changeAmounts;
    this.layerId = layerId;
  }

  createInverseAction(): Action {
    return new SizeChangeAction(
      this.data,
      this.changeAmounts.map(item => {
        let newStartIndex = item.startIndex;
        if (
          item.direction === ButtonDirection.TOP ||
          item.direction === ButtonDirection.LEFT
        ) {
          newStartIndex = item.startIndex - item.amount;
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
      this.layerId,
    );
  }
}
