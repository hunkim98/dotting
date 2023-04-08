export enum ActionType {
  ColorChange = "ColorChange",
  SizeChange = "SizeChange",
  ColorSizeChange = "ColorSizeChange",
}

export abstract class Action {
  constructor() {}

  abstract type: ActionType;

  abstract createInverseAction(): Action;

  abstract getType(): string;
}
