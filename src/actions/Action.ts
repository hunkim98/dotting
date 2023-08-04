export enum ActionType {
  ColorChange = "ColorChange",
  SizeChange = "SizeChange",
  ColorSizeChange = "ColorSizeChange",
  SelectAreaMove = "SelectAreaMove",
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
