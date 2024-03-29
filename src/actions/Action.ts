export enum ActionType {
  ColorChange = "ColorChange",
  ColorSizeChange = "ColorSizeChange",
  SelectAreaMove = "SelectAreaMove",
  LayerCreate = "LayerCreate",
  LayerDelete = "LayerDelete",
  LayerOrderChange = "LayerOrderChange",
}

export abstract class Action {
  abstract type: ActionType;

  layerId: string;

  abstract createInverseAction(): Action;

  getType(): string {
    return this.type;
  }

  getLayerId(): string {
    return this.layerId;
  }
}
