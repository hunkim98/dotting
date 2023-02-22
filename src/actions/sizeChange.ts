import Canvas from "../components/Canvas";
import { PixelData } from "../components/Canvas/types";
import {
  AbstractAction,
  ActionType,
  CanvasHorizontalDirection,
  CanvasVerticalDirection,
  CanvasDirection,
} from "./base";

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
