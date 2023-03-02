export interface Coord {
  x: number;
  y: number;
}

export type PanZoom = {
  scale: number;
  offset: Coord;
};
