import Canvas from "../Canvas";
import { PixelData } from "../types";
import { AbstractAction, ActionType } from "./base";

export type CanvasDirection =
  | CanvasVerticalDirection
  | CanvasHorizontalDirection;

export enum CanvasVerticalDirection {
  TOP = "TOP",
  BOTTOM = "BOTTOM",
}

export enum CanvasHorizontalDirection {
  LEFT = "LEFT",
  RIGHT = "RIGHT",
}

export class SizeChangeAction implements AbstractAction {
  type = ActionType.size;

  dispatch = (canvas: Canvas) => {
    console.log("hi");
    const data = canvas.getData();
    return;
  };

  commitAction = (
    canvas: Canvas,
    direction: CanvasDirection,
    type: "add" | "delete",
    data: Array<PixelData>
  ) => {
    if (
      Object.values(CanvasHorizontalDirection).some(
        (value) => value === direction
      )
    ) {
      //column operation
      if (type === "add") {
        this.addColumn(canvas, direction as CanvasHorizontalDirection);
      } else {
        this.deleteColumn(canvas, direction as CanvasHorizontalDirection);
      }
    } else {
      //row operation
      if (type === "add") {
        this.addRow(canvas, direction as CanvasVerticalDirection);
      } else {
        this.deleteRow(canvas, direction as CanvasVerticalDirection);
      }
    }
  };

  deleteRow = (canvas: Canvas, direction: CanvasVerticalDirection) => {};

  deleteColumn = (canvas: Canvas, direction: CanvasHorizontalDirection) => {};

  addRow = (canvas: Canvas, direction: CanvasVerticalDirection) => {};

  addColumn = (canvas: Canvas, direction: CanvasHorizontalDirection) => {};
}
