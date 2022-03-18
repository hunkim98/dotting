import { pixelDataElement } from "../../../../store/modules/pixelData";
import { Pixel2dPixel, Position } from "../Panel";

export interface SizeControlProps {
  addColumn: ({
    position,
    data,
  }: {
    position: Position.LEFT | Position.RIGHT;
    data: pixelDataElement[];
  }) => void;
  addRow: ({
    position,
    data,
  }: {
    position: Position.TOP | Position.BOTTOM;
    data: pixelDataElement[];
  }) => void;
  deleteColumn: ({
    position,
  }: {
    position: Position.LEFT | Position.RIGHT;
  }) => void;
  deleteRow: ({
    position,
  }: {
    position: Position.TOP | Position.BOTTOM;
  }) => void;
}
