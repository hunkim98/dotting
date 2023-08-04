import { Action, ActionType } from "./Action";

export class LayerCreateAction extends Action {
  type = ActionType.LayerCreate;
  insertIndex: number;

  constructor(layerId: string, insertPosition: number) {
    super();
    this.layerId = layerId;
    this.insertIndex = insertPosition;
  }

  createInverseAction(): Action {
    return new LayerDeleteAction(this.layerId, this.insertIndex);
  }
}

export class LayerDeleteAction extends Action {
  type = ActionType.LayerDelete;
  removeIndex: number;

  constructor(layerId: string, removedIndex: number) {
    super();
    this.layerId = layerId;
    this.removeIndex = removedIndex;
  }

  createInverseAction(): Action {
    return new LayerCreateAction(this.layerId, this.removeIndex);
  }
}
