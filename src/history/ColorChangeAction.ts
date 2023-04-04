import { PixelModifyItem } from "../components/Canvas/types";
import { Action, ActionType } from "./Action";

export enum ColorChangeMode {
  Fill = "Fill",
  Erase = "Erase",
}

export class ColorChangeAction extends Action {
  type = ActionType.ColorChange;
  mode: ColorChangeMode;
  data: Array<PixelModifyItem>;

  constructor(mode: ColorChangeMode, data: Array<PixelModifyItem>) {
    super();
    this.mode = mode;
    this.data = data;
  }

  undo(): void {
    throw new Error("Method not implemented.");
  }

  redo(): void {
    throw new Error("Method not implemented.");
  }

  getType(): string {
    return this.type;
  }
}
