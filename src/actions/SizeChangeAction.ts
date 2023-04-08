import { ButtonDirection } from "../components/Canvas";
import { PixelModifyItem } from "../components/Canvas/types";
import { Action, ActionType } from "./Action";

export class SizeChangeAction extends Action {
  type = ActionType.SizeChange;
  data: Array<PixelModifyItem>;
  changeAmounts: Array<{ direction: ButtonDirection; amount: number }>;

  constructor(
    data: Array<PixelModifyItem>,
    changeAmounts: Array<{ direction: ButtonDirection; amount: number }>
  ) {
    super();
    this.data = data;
    this.changeAmounts = changeAmounts;
  }

  createInverseAction(): Action {
    return new SizeChangeAction(
      this.data,
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
