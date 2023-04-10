export enum ActionType {
  ColorChange = "ColorChange",
  SizeChange = "SizeChange",
  ColorSizeChange = "ColorSizeChange",
}

export abstract class Action {

  abstract type: ActionType;

  abstract createInverseAction(): Action;

  abstract getType(): string;
}
