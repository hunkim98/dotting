import { Action, ActionType } from "./Action";

export class LayerOrderChangeAction extends Action {
  type = ActionType.LayerOrderChange;
  layerId: string;
  originalPositionIndex: number;
  newPositionIndex: number;

  constructor(
    layerId: string,
    originalPositionIndex: number,
    newPositionIndex: number,
  ) {
    super();
    this.layerId = layerId;
    this.originalPositionIndex = originalPositionIndex;
    this.newPositionIndex = newPositionIndex;
  }

  createInverseAction(): Action {
    return new LayerOrderChangeAction(
      this.layerId,
      this.newPositionIndex,
      this.originalPositionIndex,
    );
  }
}
