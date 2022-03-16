import { Pixel2dPixel, Position } from "../Panel";

export interface SizeControlProps {
  addColumn: ({
    position,
    data,
  }: {
    position: Position.LEFT | Position.RIGHT;
    data: Pixel2dPixel[];
  }) => void;
  addRow: ({
    position,
    data,
  }: {
    position: Position.TOP | Position.BOTTOM;
    data: Pixel2dPixel[];
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
