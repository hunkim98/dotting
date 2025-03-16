import { getAllGridIndicesSorted } from "../../../utils/data";
import { getPixelIndexFromMouseCartCoord } from "../../../utils/position";
import { Index } from "../../../utils/types";
import InteractionLayer from "../InteractionLayer";
import { BRUSH_PATTERN_ELEMENT, BrushTool, Coord, DottingData } from "../types";

export abstract class BaseBrush {
  abstract toolName: BrushTool;
  layer: InteractionLayer;
  candidatePoints: Index[];

  constructor(layer: InteractionLayer) {
    // brush tool will only interact with the interaction layer
    this.layer = layer;
    this.candidatePoints = [];
  }
  abstract execute(
    startPoint: Coord,
    endPoint: Coord,
    currentData: DottingData,
    gridSquareLength: number,
    color: string,
    filled?: boolean,
    brushPattern?: Array<Array<BRUSH_PATTERN_ELEMENT>>,
    userId?: string,
  ): void;

  abstract getCandidatePoints(
    startPoint: Coord,
    endPoint: Coord,
    currentData: DottingData,
    gridSquareLength: number,
    filled?: boolean,
    brushPattern?: Array<Array<BRUSH_PATTERN_ELEMENT>>,
  ): Index[];

  abstract onMouseDown(
    mouseDownPoint: Coord,
    currentData: DottingData,
    gridSquareLength: number,
    filled?: boolean,
    brushPattern?: Array<Array<BRUSH_PATTERN_ELEMENT>>,
  ): void;

  abstract onMouseMove(
    mouseDownPoint: Coord,
    mouseMovePoint: Coord,
    currentData: DottingData,
    gridSquareLength: number,
    filled?: boolean,
    brushPattern?: Array<Array<BRUSH_PATTERN_ELEMENT>>,
  ): void;

  /**
   * @description All brushes will have a start and end point
   */
  getStartEndIndex(
    startMousePoint: Coord,
    endMousePoint: Coord,
    gridSquareLength: number,
    currentData: DottingData,
  ) {
    const { rowIndices, columnIndices } = getAllGridIndicesSorted(currentData);

    const startIndex = getPixelIndexFromMouseCartCoord(
      startMousePoint,
      rowIndices,
      columnIndices,
      gridSquareLength,
    );

    const endIndex = getPixelIndexFromMouseCartCoord(
      endMousePoint,
      rowIndices,
      columnIndices,
      gridSquareLength,
    );

    return { startIndex, endIndex };
  }

  renderPreview() {
    this.layer.setPreviewPoints(this.candidatePoints);
    this.layer.render();
  }
}
