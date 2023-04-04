import { Action, ActionType } from "./Action";

export enum SizeChangeMode {
  Extend = "Extend",
  Shorten = "Shorten",
}

export class SizeChangeAction extends Action {
  type = ActionType.ColorChange;
  mode: SizeChangeMode;

  constructor(mode: SizeChangeMode) {
    super();
    this.mode = mode;
  }

  // Undo will be the reverse of the original action
  undo(): void {
    throw new Error("Method not implemented.");
  }

  // Redo will be the same as the original action
  redo(): void {
    throw new Error("Method not implemented.");
  }

  getType(): string {
    return this.type;
  }
}
