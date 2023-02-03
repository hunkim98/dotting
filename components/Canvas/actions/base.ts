import Canvas from "../Canvas";
import { PixelData } from "../types";

export enum ActionType {
  size = "size",
  color = "color",
}

export interface AbstractAction {
  type: ActionType;

  dispatch: (canvas: Canvas) => void;
}
