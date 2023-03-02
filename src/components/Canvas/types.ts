export interface Coord {
  x: number;
  y: number;
}

export type PanZoom = {
  scale: number;
  offset: Coord;
};

export type PixelData = {
  color: string;
};

export type DottingData = Map<number, Map<number, PixelData>>;

export type DottingInitData = Array<Array<PixelData>>;

export type PixelModifyData = Array<PixelModifyItem>;

export interface PixelModifyItem {
  rowIndex: number;
  columnIndex: number;
  color: string;
}
