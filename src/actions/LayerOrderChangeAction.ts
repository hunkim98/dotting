import { Action, ActionType } from "./Action";

export class LayerOrderChangeAction extends Action {
  type = ActionType.LayerOrderChange;
  fromLayerId: string;
  toLayerId: string;
  fromIndex: number;
  toIndex: number;

  constructor(
    fromLayerId: string,
    toLayerId: string,
    fromIndex: number,
    toIndex: number,
  ) {
    super();
    this.fromLayerId = fromLayerId;
    this.toLayerId = toLayerId;
    this.fromIndex = fromIndex;
    this.toIndex = toIndex;
  }

  createInverseAction(): Action {
    return new LayerOrderChangeAction(
      this.toLayerId,
      this.fromLayerId,
      this.toIndex,
      this.fromIndex,
    );
  }
}
