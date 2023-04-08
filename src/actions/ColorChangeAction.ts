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
    // below are functions to manipulate the canvas
  }

  createInverseAction(): Action {
    if (this.mode === ColorChangeMode.Fill) {
      return new ColorChangeAction(ColorChangeMode.Erase, this.data);
    } else if (this.mode === ColorChangeMode.Erase) {
      return new ColorChangeAction(ColorChangeMode.Fill, this.data);
    } else {
      throw new Error("Unable to create inverse action for color change");
    }
  }

  getType(): string {
    return this.type;
  }
}
