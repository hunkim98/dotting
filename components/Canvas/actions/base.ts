import Canvas from "../Canvas";
import { PixelData } from "../types";

export enum ActionType {
  size = "size",
  color = "color",
}

export type CanvasDirection =
  | CanvasVerticalDirection
  | CanvasHorizontalDirection
  | CanvasNullDirection;

export enum CanvasVerticalDirection {
  TOP = "TOP",
  BOTTOM = "BOTTOM",
}

export enum CanvasHorizontalDirection {
  LEFT = "LEFT",
  RIGHT = "RIGHT",
}

export enum CanvasNullDirection {
  NULL = "NULL",
}

export interface AbstractAction {
  type: ActionType;

  dispatch: (canvas: Canvas) => void;
}
