import { ButtonDirection } from "../components/Canvas";
import { PixelModifyItem } from "../components/Canvas/types";
import { Action, ActionType } from "./Action";

export class SizeChangeAction extends Action {
  type = ActionType.SizeChange;
  data: Array<PixelModifyItem>;
  direction: ButtonDirection;
  changeAmount: number;

  constructor(
    data: Array<PixelModifyItem>,
    direction: ButtonDirection,
    changeAmount: number // this can be negative or positive
  ) {
    super();
    this.data = data;
    this.direction = direction;
    this.changeAmount = changeAmount;
    // below are functions to manipulate the canvas
  }

  createInverseAction(): Action {
    return new SizeChangeAction(this.data, this.direction, -this.changeAmount);
  }

  getType(): string {
    return this.type;
  }
}
