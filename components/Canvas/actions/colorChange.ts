import Canvas from "../Canvas";
import { AbstractAction, ActionType } from "./base";

export class ColorChangeAction implements AbstractAction {
  type = ActionType.color;

  dispatch = (canvas: Canvas) => {};
}
