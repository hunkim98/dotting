import { Action, ActionType } from "./Action";

export class LayerReorderAction extends Action {
  type = ActionType.LayerOrderChange;
  layerId: string = null;
  previousLayerIds: Array<string>;
  reorderdLayerIds: Array<string>;

  constructor(
    previousLayerIds: Array<string>,
    reorderdLayerIds: Array<string>,
  ) {
    super();
    this.previousLayerIds = previousLayerIds;
    this.reorderdLayerIds = reorderdLayerIds;
  }

  createInverseAction(): Action {
    return new LayerReorderAction(this.reorderdLayerIds, this.previousLayerIds);
  }
}
