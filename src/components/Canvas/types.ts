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

export interface ColorChangeItem extends PixelModifyItem {
  previousColor: string;
}

export enum CanvasEvents {
  DATA_CHANGE = "dataChange",
  GRID_CHANGE = "gridChange",
  STROKE_END = "strokeEnd",
  BRUSH_CHANGE = "brushChange",
  HOVER_PIXEL_CHANGE = "hoverPixelChange",
}

export enum BrushTool {
  DOT = "DOT",
  ERASER = "ERASER",
  PAINT_BUCKET = "PAINT_BUCKET",
  SELECT = "SELECT",
}

export type CanvasDataChangeParams = { data: DottingData };

export type CanvasDataChangeHandler = (params: CanvasDataChangeParams) => void;

export type CanvasGridChangeParams = {
  dimensions: {
    columnCount: number;
    rowCount: number;
  };
  indices: {
    topRowIndex: number;
    bottomRowIndex: number;
    leftColumnIndex: number;
    rightColumnIndex: number;
  };
};

export type CanvasGridChangeHandler = (params: CanvasGridChangeParams) => void;

export type CanvasStrokeEndParams = {
  strokedPixels: Array<ColorChangeItem>;
  data: DottingData;
  strokeTool: BrushTool;
};

export type CanvasStrokeEndHandler = (params: CanvasStrokeEndParams) => void;

export type CanvasBrushChangeParams = {
  brushColor: string;
  brushTool: BrushTool;
};

export type CanvasBrushChangeHandler = (
  params: CanvasBrushChangeParams,
) => void;

export type CanvasHoverPixelChangeParams = {
  indices: {
    rowIndex: number;
    columnIndex: number;
  } | null;
};

export type CanvasHoverPixelChangeHandler = (
  params: CanvasHoverPixelChangeParams,
) => void;

export type GridIndices = {
  topRowIndex: number;
  bottomRowIndex: number;
  leftColumnIndex: number;
  rightColumnIndex: number;
};
