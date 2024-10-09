import { DottingDataLayer } from "../../helpers/DottingDataLayer";

export interface Coord {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export type ButtonDimensions = Coord & Dimensions;

export type PanZoom = {
  scale: number;
  offset: Coord;
};

export type PixelData = {
  color: string;
};

export interface ImageDownloadOptions {
  isGridVisible?: boolean;
  type: "png" | "svg";
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
  LAYER_CHANGE = "layerChange",
  CANVAS_INFO_CHANGE = "canvasInfoChange",
}

export enum BrushTool {
  DOT = "DOT",
  ERASER = "ERASER",
  PAINT_BUCKET = "PAINT_BUCKET",
  SELECT = "SELECT",
  NONE = "NONE",
  LINE = "LINE",
}

export interface CanvasDelta {
  modifiedPixels: Array<PixelModifyItem>;
  addedOrDeletedRows?: Array<{
    isDelete: boolean;
    index: number;
  }>;
  addedOrDeletedColumns?: Array<{
    isDelete: boolean;
    index: number;
  }>;
}

export type CanvasDataChangeParams = {
  isLocalChange: boolean;
  data: DottingData;
  layerId: string;
  delta?: CanvasDelta;
};

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
  strokeTool: BrushTool;
};

export type CanvasStrokeEndHandler = (params: CanvasStrokeEndParams) => void;

export type CanvasBrushChangeParams = {
  brushColor: string;
  brushTool: BrushTool;
  brushPattern: Array<Array<BRUSH_PATTERN_ELEMENT>>;
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

export type LayerChangeParams = {
  layers: Array<DottingDataLayer>;
  currentLayer: DottingDataLayer;
};

export type LayerChangeHandler = (params: LayerChangeParams) => void;

export type CanvasInfoChangeParams = {
  panZoom: PanZoom;
  topLeftCornerOffset: Coord;
  topRightCornerOffset: Coord;
  bottomLeftCornerOffset: Coord;
  bottomRightCornerOffset: Coord;
  gridSquareSize: number;
};

export type CanvasInfoChangeHandler = (params: CanvasInfoChangeParams) => void;

export type GridIndices = {
  topRowIndex: number;
  bottomRowIndex: number;
  leftColumnIndex: number;
  rightColumnIndex: number;
};

export type SelectAreaRange = {
  startWorldPos: Coord;
  endWorldPos: Coord;
  startPixelIndex: Omit<PixelModifyItem, "color">;
  endPixelIndex: Omit<PixelModifyItem, "color">;
};

export enum BRUSH_PATTERN_ELEMENT {
  FILL = 1,
  EMPTY = 0,
}

export interface LayerProps {
  id: string;
  data: Array<Array<PixelModifyItem>>;
}

export type LayerDataForHook = {
  id: string;
  isVisible: boolean;
  data: Array<Array<PixelModifyItem>>;
};

export type AddGridIndicesParams = {
  rowIndices: Array<number>;
  columnIndices: Array<number>;
  data?: Array<PixelModifyItem>;
  layerId?: string;
  isLocalChange?: boolean;
};

export type DeleteGridIndicesParams = {
  rowIndices: Array<number>;
  columnIndices: Array<number>;
  layerId?: string;
  isLocalChange?: boolean;
};
