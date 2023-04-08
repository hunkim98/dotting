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

export interface ImageDownloadOptions {
  isGridVisible?: boolean;
}

export type DottingData = Map<number, Map<number, PixelData>>;

export interface PixelModifyItem {
  rowIndex: number;
  columnIndex: number;
  color: string;
}

export enum CanvasEvents {
  DATA_CHANGE = "dataChange",
  GRID_CHANGE = "gridChange",
  STROKE_END = "strokeEnd",
  BRUSH_CHANGE = "brushChange",
  HOVER_PIXEL_CHANGE = "hoverPixelChange",
}

export enum BrushMode {
  DOT = "dot",
  ERASER = "eraser",
  PAINT_BUCKET = "paint_bucket",
}

export type CanvasDataChangeHandler = (data: DottingData) => void;

export type CanvasGridChangeHandler = (
  dimensions: {
    columnCount: number;
    rowCount: number;
  },
  indices: {
    topRowIndex: number;
    bottomRowIndex: number;
    leftColumnIndex: number;
    rightColumnIndex: number;
  }
) => void;

export type CanvasStrokeEndHandler = (
  strokedPixels: Array<PixelModifyItem>,
  data: DottingData
) => void;

export type CanvasBrushChangeHandler = (
  brushColor: string,
  brushMode: BrushMode
) => void;

export type CanvasHoverPixelChangeHandler = (
  indices: {
    rowIndex: number;
    columnIndex: number;
  } | null
) => void;

export type GridIndices = {
  topRowIndex: number;
  bottomRowIndex: number;
  leftColumnIndex: number;
  rightColumnIndex: number;
};
