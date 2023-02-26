export interface Coord {
  x: number;
  y: number;
}

export type PanZoom = {
  scale: number;
  offset: Coord;
};

export type PixelData = {
  rowIndex: number;
  columnIndex: number;
  color: string;
};
