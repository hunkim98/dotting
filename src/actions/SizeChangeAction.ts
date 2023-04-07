import { ButtonDirection } from "../components/Canvas";
import { PixelModifyItem } from "../components/Canvas/types";
import { Action, ActionType } from "./Action";

export class SizeChangeAction extends Action {
  type = ActionType.ColorChange;
  data: Array<PixelModifyItem>;
  direction: ButtonDirection;
  changeAmount: number;

  constructor(
    data: Array<PixelModifyItem>,
    direction: ButtonDirection,
    changeAmount: number // this can be negative or positive
    // if it is positive it means that the size has decreased
  ) {
    super();
    this.data = data;
    this.direction = direction;
    this.changeAmount = changeAmount;
  }

  // Undo will be the reverse of the original action
  undo(): void {
    throw new Error("Method not implemented.");
  }

  // Redo will be the same as the original action
  redo(): void {
    throw new Error("Method not implemented.");
  }

  getType(): string {
    return this.type;
  }
}
