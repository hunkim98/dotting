import { Action, ActionType } from "./Action";
import { DottingDataLayer } from "../helpers/DottingDataLayer";

export class LayerCreateAction extends Action {
  type = ActionType.LayerCreate;
  insertIndex: number;
  layer: DottingDataLayer;

  constructor(
    layerId: string,
    layer: DottingDataLayer,
    insertPosition: number,
  ) {
    super();
    this.layerId = layerId;
    this.layer = layer;
    this.insertIndex = insertPosition;
  }

  createInverseAction(): Action {
    return new LayerDeleteAction(this.layerId, this.layer, this.insertIndex);
  }
}

export class LayerDeleteAction extends Action {
  type = ActionType.LayerDelete;
  removeIndex: number;
  layer: DottingDataLayer;

  constructor(layerId: string, layer: DottingDataLayer, removedIndex: number) {
    super();
    this.layerId = layerId;
    this.layer = layer;
    this.removeIndex = removedIndex;
  }

  createInverseAction(): Action {
    return new LayerCreateAction(this.layerId, this.layer, this.removeIndex);
  }
}
