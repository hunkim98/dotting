import { pixelDataElement } from "../../../../store/modules/pixelData";
import { Pixel2dPixel, Position } from "../Panel";

interface ChangeRowInterface {
  rowIndex: number;
  position: Position.TOP | Position.BOTTOM;
}
export interface AddRowInterface extends ChangeRowInterface {
  data: pixelDataElement[];
}

export interface DeleteRowInterface extends ChangeRowInterface {}

interface ChangeColumnInterface {
  columnIndex: number;
  position: Position.LEFT | Position.RIGHT;
}

export interface AddColumnInterface extends ChangeColumnInterface {
  data: pixelDataElement[];
}

export interface DeleteColumnInterface extends ChangeColumnInterface {}
export interface SizeControlProps {
  addColumn: ({ columnIndex, position, data }: AddColumnInterface) => void;
  addRow: ({ rowIndex, position, data }: AddRowInterface) => void;
  deleteColumn: ({ columnIndex, position }: DeleteColumnInterface) => void;
  deleteRow: ({ rowIndex, position }: DeleteRowInterface) => void;
}
