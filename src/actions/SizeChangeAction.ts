import { ButtonDirection } from "../components/Canvas/config";
import { PixelModifyItem } from "../components/Canvas/types";
import { Action, ActionType } from "./Action";

export interface ChangeAmountData {
  direction: ButtonDirection;
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
