import { Action, ActionType } from "./Action";
import { ButtonDirection } from "../components/Canvas/config";
import { PixelModifyItem } from "../components/Canvas/types";

export class ColorSizeChangeAction extends Action {
  // since we render the data by sorting the rowKeys, columnKeys,
  // we do not need to consider the order of the rowIndices or columnIndices
  type = ActionType.ColorSizeChange;
  data: Array<PixelModifyItem>;
  rowIndicesToAdd: Set<number>;
  columnIndicesToAdd: Set<number>;
  rowIndicesToDelete: Set<number>;
  columnIndicesToDelete: Set<number>;

  constructor(
    data: Array<PixelModifyItem>,
    rowIndicesToAdd: Array<number>,
    columnIndicesToAdd: Array<number>,
    rowIndicesToDelete: Array<number>,
    columnIndicesToDelete: Array<number>,
    layerId: string,
  ) {
    super();
    this.data = data;
    this.rowIndicesToDelete = new Set(rowIndicesToDelete);
    this.columnIndicesToDelete = new Set(columnIndicesToDelete);
    this.rowIndicesToAdd = new Set(rowIndicesToAdd);
    this.columnIndicesToAdd = new Set(columnIndicesToAdd);
    this.layerId = layerId;
  }

  createInverseAction(): Action {
    return new ColorSizeChangeAction(
      this.data,
      Array.from(this.rowIndicesToDelete),
      Array.from(this.columnIndicesToDelete),
      Array.from(this.rowIndicesToAdd),
      Array.from(this.columnIndicesToAdd),
      this.layerId,
    );
  }
}
