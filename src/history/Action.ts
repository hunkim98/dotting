export enum ActionType {
  ColorChange = "ColorChange",
  SizeChange = "SizeChange",
}

export abstract class Action {
  constructor() {}

  abstract type: ActionType;

  abstract undo(): void;

  abstract redo(): void;

  abstract getType(): string;
}
