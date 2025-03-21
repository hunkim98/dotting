import { BaseLayer } from "./BaseLayer";
import {
  ButtonDirection,
  DefaultGridSquareLength,
  DefaultMaxScale,
  DefaultMinScale,
  InteractionExtensionAllowanceRatio,
  InteractionEdgeTouchingRange,
  UserId,
  CurrentDeviceUserId,
  DefaultBackgroundColor,
  DefaultPixelColor,
  MinColumnOrRowCount,
} from "./config";
import {
  BRUSH_PATTERN_ELEMENT,
  ColorChangeItem,
  Coord,
  DottingData,
  GridIndices,
  PixelModifyItem,
  SelectAreaRange,
} from "./types";
import { PixelChangeRecords } from "../../helpers/PixelChangeRecords";
import {
  addColumnToData,
  addRowToData,
  deleteColumnOfData,
  deleteRowOfData,
  extractColoredPixelsFromColumn,
  extractColoredPixelsFromRow,
  getAllGridIndicesSorted,
  getEllipsePixelIndicesfromCoords,
  getColumnCountFromData,
  getGridIndicesFromData,
  getInBetweenPixelIndicesfromCoords,
  getRectanglePixelIndicesfromCoords,
  getRowCountFromData,
} from "../../utils/data";
import {
  convertCartesianToScreen,
  getScreenPoint,
  lerpRanges,
} from "../../utils/math";
import {
  getOverlappingPixelIndicesForModifiedPixels,
  getPixelIndexFromMouseCartCoord,
} from "../../utils/position";
import { drawRect } from "../../utils/shapes";
import { Index } from "../../utils/types";

export default class InteractionLayer extends BaseLayer {
  // We make this a map to allow for multiple users to interact with the canvas
  // the key will be the user id
  private strokedPixelRecords: Map<UserId, PixelChangeRecords> = new Map();

  private erasedPixelRecords: Map<UserId, PixelChangeRecords> = new Map();

  // this is for tracking pixels that were applied to data canvas
  // while the user was changing the dimensions of the data canvas
  // ( = the captured Data is not null)
  private tempStrokedPixels: Array<PixelModifyItem> = [];

  private indicatorPixels: Array<PixelModifyItem> = [];

  private dataLayerRowCount: number;

  private dataLayerColumnCount: number;

  private backgroundColor: React.CSSProperties["color"] =
    DefaultBackgroundColor;

  private defaultPixelColor = DefaultPixelColor;

  private backgroundMode: "checkerboard" | "color" = "color";

  private selectingArea: Omit<
    SelectAreaRange,
    "startPixelIndex" | "endPixelIndex"
  > | null = null;

  private brushPattern: Array<Array<BRUSH_PATTERN_ELEMENT>> = [
    [BRUSH_PATTERN_ELEMENT.FILL],
  ];

  private selectedArea: SelectAreaRange | null = null;

  private directionToExtendSelectedArea: ButtonDirection | null = null;

  private movingSelectedArea: SelectAreaRange | null = null;

  private movingSelectedPixels: Array<ColorChangeItem> | null = null;

  private extendingSelectedArea: SelectAreaRange | null = null;

  private extendingSelectedPixels: Array<ColorChangeItem | null> | null = [];

  private capturedBaseExtendingSelectedArea: SelectAreaRange | null = null;

  private capturedBaseExtendingSelectedAreaPixels: Array<ColorChangeItem> | null =
    null;

  private selectedAreaPixels: Array<ColorChangeItem> | null = null;

  // this is to prevent other user's grid change from being applied to the canvas
  // when this is not null we will not render data layer
  // however, when this is not null we should send colored pixels
  private capturedData: DottingData | null = null;

  private capturedDataOriginalIndices: GridIndices | null = null;

  private hoveredPixel: {
    rowIndex: number;
    columnIndex: number;
    color: string;
  } | null = null;

  private previewPoints: Array<{ rowIndex: number; columnIndex: number }> | null =
    null;
  private gridSquareLength: number = DefaultGridSquareLength;

  constructor({
    columnCount,
    rowCount,
    canvas,
  }: {
    columnCount: number;
    rowCount: number;
    canvas: HTMLCanvasElement;
  }) {
    super({ canvas });
    this.dataLayerColumnCount = columnCount;
    this.dataLayerRowCount = rowCount;
  }

  getCapturedData() {
    return this.capturedData;
  }

  getDirectionToExtendSelectedArea() {
    return this.directionToExtendSelectedArea;
  }

  getCapturedDataOriginalIndices() {
    return this.capturedDataOriginalIndices;
  }

  getBrushPattern() {
    return this.brushPattern;
  }

  setPreviewPoints(
    points: Array<{ rowIndex: number; columnIndex: number }> | null,
  ) {
    this.previewPoints = points;
  }

  setBrushPattern(pattern: Array<Array<BRUSH_PATTERN_ELEMENT>>) {
    this.brushPattern = pattern;
  }

  setGridSquareLength(length: number) {
    this.gridSquareLength = length;
  }

  setDefaultPixelColor(color: string) {
    this.defaultPixelColor = color;
  }

  setDataLayerColumnCount(columnCount: number) {
    this.dataLayerColumnCount = columnCount;
  }

  setDataLayerRowCount(rowCount: number) {
    this.dataLayerRowCount = rowCount;
  }

  setDirectionToExtendSelectedArea(direction: ButtonDirection | null) {
    this.directionToExtendSelectedArea = direction;
  }

  setSelectedArea(area: SelectAreaRange | null) {
    this.selectedArea = area;
  }

  setSelectingArea(
    area: Omit<SelectAreaRange, "startPixelIndex" | "endPixelIndex"> | null,
  ) {
    this.selectingArea = area;
  }

  setMovingSelectedPixels(pixels: Array<ColorChangeItem> | null) {
    this.movingSelectedPixels = pixels;
  }

  setMovingSelectedArea(area: SelectAreaRange | null) {
    this.movingSelectedArea = area;
  }

  setExtendingSelectedPixels(pixels: Array<ColorChangeItem | null> | null) {
    this.extendingSelectedPixels = pixels;
  }

  setExtendingSelectedArea(area: SelectAreaRange | null) {
    this.extendingSelectedArea = area;
  }

  setSelectedAreaPixels(pixelArray: Array<ColorChangeItem>) {
    this.selectedAreaPixels = pixelArray;
  }

  setBackgroundColor(color: string) {
    this.backgroundColor = color ? color : DefaultBackgroundColor;
  }

  setCapturedData(gridChangeStartCapturedData: DottingData) {
    this.capturedData = new Map();
    for (const row of Array.from(gridChangeStartCapturedData.entries())) {
      const [rowIndex, rowData] = row;
      this.capturedData.set(rowIndex, new Map(rowData));
    }
    this.capturedDataOriginalIndices = getGridIndicesFromData(
      gridChangeStartCapturedData,
    );
  }

  setCapturedBaseExtendingSelectedArea(
    capturedBaseExtendingSelectedArea: SelectAreaRange | null,
  ) {
    this.capturedBaseExtendingSelectedArea = capturedBaseExtendingSelectedArea;
  }

  setCapturedBaseExtendingSelectedAreaPixels(
    capturedBaseExtendingSelectedAreaPixels: Array<ColorChangeItem> | null,
  ) {
    this.capturedBaseExtendingSelectedAreaPixels =
      capturedBaseExtendingSelectedAreaPixels;
  }

  resetCapturedData() {
    this.capturedData = null;
    this.capturedDataOriginalIndices = null;
    this.deleteStrokePixelRecord(CurrentDeviceUserId);
  }

  getPreviewPoints() {
    return this.previewPoints;
  }

  getHoveredPixel() {
    return this.hoveredPixel;
  }

  getMovingSelectedPixels() {
    return this.movingSelectedPixels;
  }

  getMovingSelectedArea() {
    return this.movingSelectedArea;
  }

  getExtendingSelectedArea() {
    return this.extendingSelectedArea;
  }

  getExtendingSelectedPixels() {
    return this.extendingSelectedPixels;
  }

  setHoveredPixel(
    hoveredPixel: {
      rowIndex: number;
      columnIndex: number;
      color: string;
    } | null,
  ) {
    this.hoveredPixel = hoveredPixel;
  }

  getSelectingArea() {
    return this.selectingArea;
  }

  getSelectedArea() {
    return this.selectedArea;
  }

  getSelectedAreaPixels() {
    return this.selectedAreaPixels;
  }

  getStrokedPixelRecords() {
    return this.strokedPixelRecords;
  }

  getEffectiveStrokePixelChanges(userId: UserId) {
    if (!this.strokedPixelRecords.has(userId)) {
      return [];
    }
    return this.strokedPixelRecords.get(userId)!.getEffectiveChanges();
  }

  getErasedPixelRecords() {
    return this.erasedPixelRecords;
  }

  getEffectiveEraserPixelChanges(userId: UserId) {
    if (!this.erasedPixelRecords.has(userId)) {
      return [];
    }
    return this.erasedPixelRecords.get(userId)!.getEffectiveChanges();
  }

  getIndicatorPixels() {
    return this.indicatorPixels;
  }

  detectSelectedAreaExtendDirection(coord: Coord): ButtonDirection | null {
    if (!this.selectedArea) {
      return null;
    }
    const extensionAllowanceRatio = InteractionExtensionAllowanceRatio;
    const strokeTouchingRange = InteractionEdgeTouchingRange;
    const scaledYHeight = lerpRanges(
      this.panZoom.scale,
      // this range is inverted because height has to be smaller when zoomed in
      DefaultMaxScale,
      DefaultMinScale,
      strokeTouchingRange,
      strokeTouchingRange * extensionAllowanceRatio,
    );
    const scaledXWidth = lerpRanges(
      this.panZoom.scale,
      DefaultMaxScale,
      DefaultMinScale,
      strokeTouchingRange,
      strokeTouchingRange * extensionAllowanceRatio,
    );
    const x = coord.x;
    const y = coord.y;
    // const { areaTopLeftPos, areaBottomRightPos } = getAreaTopLeftAndBottomRight(
    // this.selectedArea,
    // );
    const selectedAreaWidth =
      this.selectedArea.endWorldPos.x - this.selectedArea.startWorldPos.x;
    const selectedAreaHeight =
      this.selectedArea.endWorldPos.y - this.selectedArea.startWorldPos.y;
    const top = {
      x: this.selectedArea.startWorldPos.x,
      y: this.selectedArea.startWorldPos.y,
      width: selectedAreaWidth,
      height: scaledYHeight,
    };
    const bottom = {
      x: this.selectedArea.startWorldPos.x,
      y: this.selectedArea.endWorldPos.y,
      width: selectedAreaWidth,
      height: scaledYHeight,
    };
    const left = {
      x: this.selectedArea.startWorldPos.x,
      y: this.selectedArea.startWorldPos.y,
      width: scaledXWidth,
      height: selectedAreaHeight,
    };
    const right = {
      x: this.selectedArea.endWorldPos.x,
      y: this.selectedArea.startWorldPos.y,
      width: scaledXWidth,
      height: selectedAreaHeight,
    };
    const cornerSquareHalfLength = left.width;
    if (
      x >= top.x + cornerSquareHalfLength &&
      x <= top.x + top.width - cornerSquareHalfLength &&
      y >= top.y - cornerSquareHalfLength &&
      y <= top.y + cornerSquareHalfLength
    ) {
      return ButtonDirection.TOP;
    } else if (
      x >= bottom.x + cornerSquareHalfLength &&
      x <= bottom.x + bottom.width - cornerSquareHalfLength &&
      y >= bottom.y - cornerSquareHalfLength &&
      y <= bottom.y + cornerSquareHalfLength
    ) {
      return ButtonDirection.BOTTOM;
    } else if (
      x >= left.x - cornerSquareHalfLength &&
      x <= left.x + cornerSquareHalfLength &&
      y >= left.y + cornerSquareHalfLength &&
      y <= left.y + left.height - cornerSquareHalfLength
    ) {
      return ButtonDirection.LEFT;
    } else if (
      x >= right.x - cornerSquareHalfLength &&
      x <= right.x + cornerSquareHalfLength &&
      y >= right.y + cornerSquareHalfLength &&
      y <= right.y + right.height - cornerSquareHalfLength
    ) {
      return ButtonDirection.RIGHT;
    } else if (
      x >= top.x - cornerSquareHalfLength &&
      x <= top.x + cornerSquareHalfLength &&
      y >= top.y - cornerSquareHalfLength &&
      y <= top.y + cornerSquareHalfLength
    ) {
      return ButtonDirection.TOPLEFT;
    } else if (
      x >= right.x - cornerSquareHalfLength &&
      x <= right.x + cornerSquareHalfLength &&
      y >= right.y - cornerSquareHalfLength &&
      y <= right.y + cornerSquareHalfLength
    ) {
      return ButtonDirection.TOPRIGHT;
    } else if (
      x >= bottom.x - cornerSquareHalfLength &&
      x <= bottom.x + cornerSquareHalfLength &&
      y >= bottom.y - cornerSquareHalfLength &&
      y <= bottom.y + cornerSquareHalfLength
    ) {
      return ButtonDirection.BOTTOMLEFT;
    } else if (
      x >= right.x - cornerSquareHalfLength &&
      x <= right.x + cornerSquareHalfLength &&
      y >= bottom.y - cornerSquareHalfLength &&
      y <= bottom.y + cornerSquareHalfLength
    ) {
      return ButtonDirection.BOTTOMRIGHT;
    } else {
      return null;
    }
  }

  extendSelectedAreaSideWays(
    direction: ButtonDirection,
    extendToCoord: Coord,
    isAltPressed: boolean,
  ) {
    // startWorldPos is the top left point
    const originalSelectAreaHeightPixelOffset =
      this.capturedBaseExtendingSelectedArea.endPixelIndex.rowIndex -
      this.capturedBaseExtendingSelectedArea.startPixelIndex.rowIndex;
    const originalSelectAreaWidthPixelOffset =
      this.capturedBaseExtendingSelectedArea.endPixelIndex.columnIndex -
      this.capturedBaseExtendingSelectedArea.startPixelIndex.columnIndex;
    // initialize originPixelIndex to the center of the original selected area
    const originPixelIndex = {
      rowIndex:
        this.capturedBaseExtendingSelectedArea.startPixelIndex.rowIndex +
        (originalSelectAreaHeightPixelOffset + 2) / 2,
      columnIndex:
        this.capturedBaseExtendingSelectedArea.startPixelIndex.columnIndex +
        (originalSelectAreaWidthPixelOffset + 2) / 2,
    };
    let modifyPixelWidthRatio = 1;
    let modifyPixelHeightRatio = 1;

    const heightExtensionOffset =
      direction === ButtonDirection.TOP
        ? this.capturedBaseExtendingSelectedArea.startWorldPos.y -
          extendToCoord.y
        : direction === ButtonDirection.BOTTOM
        ? extendToCoord.y - this.capturedBaseExtendingSelectedArea.endWorldPos.y
        : 0;
    const widthExtensionOffset =
      direction === ButtonDirection.LEFT
        ? this.capturedBaseExtendingSelectedArea.startWorldPos.x -
          extendToCoord.x
        : direction === ButtonDirection.RIGHT
        ? extendToCoord.x - this.capturedBaseExtendingSelectedArea.endWorldPos.x
        : 0;

    if (isAltPressed) {
      const wasOriginalAreaHeightEven =
        (originalSelectAreaHeightPixelOffset + 1) % 2 === 0;
      const wasOriginalAreaWidthEven =
        (originalSelectAreaWidthPixelOffset + 1) % 2 === 0;

      let singleSideOffsetRowBy = Math.round(
        heightExtensionOffset / this.gridSquareLength,
      );
      let singleSideOffsetColumnBy = Math.round(
        widthExtensionOffset / this.gridSquareLength,
      );
      let heightPixelCount =
        originalSelectAreaHeightPixelOffset + 1 + singleSideOffsetRowBy * 2;
      if (heightPixelCount < 1 && !wasOriginalAreaHeightEven) {
        heightPixelCount = 1;
        singleSideOffsetRowBy = -originalSelectAreaHeightPixelOffset / 2;
      } else if (heightPixelCount < 2 && wasOriginalAreaHeightEven) {
        heightPixelCount = 2;
        singleSideOffsetRowBy = -(originalSelectAreaHeightPixelOffset - 1) / 2;
      }
      let widthPixelCount =
        originalSelectAreaWidthPixelOffset + 1 + singleSideOffsetColumnBy * 2;
      if (widthPixelCount < 1 && !wasOriginalAreaWidthEven) {
        widthPixelCount = 1;
        singleSideOffsetColumnBy = -originalSelectAreaWidthPixelOffset / 2;
      } else if (widthPixelCount < 2 && wasOriginalAreaWidthEven) {
        widthPixelCount = 2;
        singleSideOffsetColumnBy =
          -(originalSelectAreaWidthPixelOffset - 1) / 2;
      }
      modifyPixelHeightRatio =
        (originalSelectAreaHeightPixelOffset + 2 * singleSideOffsetRowBy) /
        originalSelectAreaHeightPixelOffset;
      modifyPixelWidthRatio =
        (originalSelectAreaWidthPixelOffset + 2 * singleSideOffsetColumnBy) /
        originalSelectAreaWidthPixelOffset;
      this.setExtendingSelectedArea({
        startWorldPos: {
          x:
            this.capturedBaseExtendingSelectedArea.startWorldPos.x -
            singleSideOffsetColumnBy * this.gridSquareLength,
          y:
            this.capturedBaseExtendingSelectedArea.startWorldPos.y -
            singleSideOffsetRowBy * this.gridSquareLength,
        },
        endWorldPos: {
          x:
            this.capturedBaseExtendingSelectedArea.endWorldPos.x +
            singleSideOffsetColumnBy * this.gridSquareLength,
          y:
            this.capturedBaseExtendingSelectedArea.endWorldPos.y +
            singleSideOffsetRowBy * this.gridSquareLength,
        },
        startPixelIndex: {
          rowIndex:
            this.capturedBaseExtendingSelectedArea.startPixelIndex.rowIndex -
            singleSideOffsetRowBy,
          columnIndex:
            this.capturedBaseExtendingSelectedArea.startPixelIndex.columnIndex -
            singleSideOffsetColumnBy,
        },
        endPixelIndex: {
          rowIndex:
            this.capturedBaseExtendingSelectedArea.endPixelIndex.rowIndex +
            singleSideOffsetRowBy,
          columnIndex:
            this.capturedBaseExtendingSelectedArea.endPixelIndex.columnIndex +
            singleSideOffsetColumnBy,
        },
      });
    } else {
      const heightExtensionOffset =
        direction === ButtonDirection.TOP
          ? this.capturedBaseExtendingSelectedArea.startWorldPos.y -
            extendToCoord.y
          : direction === ButtonDirection.BOTTOM
          ? extendToCoord.y -
            this.capturedBaseExtendingSelectedArea.endWorldPos.y
          : 0;
      const widthExtensionOffset =
        direction === ButtonDirection.LEFT
          ? this.capturedBaseExtendingSelectedArea.startWorldPos.x -
            extendToCoord.x
          : direction === ButtonDirection.RIGHT
          ? extendToCoord.x -
            this.capturedBaseExtendingSelectedArea.endWorldPos.x
          : 0;
      let offsetRowBy = Math.round(
        heightExtensionOffset / this.gridSquareLength,
      );
      let offsetColumnBy = Math.round(
        widthExtensionOffset / this.gridSquareLength,
      );
      let heightPixelCount =
        originalSelectAreaHeightPixelOffset + 1 + offsetRowBy;
      let widthPixelCount =
        originalSelectAreaWidthPixelOffset + 1 + offsetColumnBy;
      if (heightPixelCount < 1) {
        heightPixelCount = 1;
        offsetRowBy = -originalSelectAreaHeightPixelOffset;
      }
      if (widthPixelCount < 1) {
        widthPixelCount = 1;
        offsetColumnBy = -originalSelectAreaWidthPixelOffset;
      }
      modifyPixelHeightRatio =
        heightPixelCount / (originalSelectAreaHeightPixelOffset + 1);
      modifyPixelWidthRatio =
        widthPixelCount / (originalSelectAreaWidthPixelOffset + 1);

      if (direction === ButtonDirection.TOP) {
        originPixelIndex.rowIndex =
          this.capturedBaseExtendingSelectedArea.endPixelIndex.rowIndex;
        originPixelIndex.columnIndex =
          this.capturedBaseExtendingSelectedArea.startPixelIndex.columnIndex;
        this.setExtendingSelectedArea({
          startWorldPos: {
            x: this.capturedBaseExtendingSelectedArea.startWorldPos.x,
            y:
              this.capturedBaseExtendingSelectedArea.endWorldPos.y -
              heightPixelCount * this.gridSquareLength,
          },
          endWorldPos: this.capturedBaseExtendingSelectedArea.endWorldPos,
          startPixelIndex: {
            rowIndex:
              this.capturedBaseExtendingSelectedArea.endPixelIndex.rowIndex -
              heightPixelCount +
              1,
            columnIndex:
              this.capturedBaseExtendingSelectedArea.startPixelIndex
                .columnIndex,
          },
          endPixelIndex: this.capturedBaseExtendingSelectedArea.endPixelIndex,
        });
      } else if (direction === ButtonDirection.BOTTOM) {
        originPixelIndex.rowIndex =
          this.capturedBaseExtendingSelectedArea.startPixelIndex.rowIndex;
        originPixelIndex.columnIndex =
          this.capturedBaseExtendingSelectedArea.startPixelIndex.columnIndex;
        modifyPixelHeightRatio =
          heightPixelCount / (originalSelectAreaHeightPixelOffset + 1);
        this.setExtendingSelectedArea({
          startWorldPos: this.capturedBaseExtendingSelectedArea.startWorldPos,
          endWorldPos: {
            x: this.capturedBaseExtendingSelectedArea.endWorldPos.x,
            y:
              this.capturedBaseExtendingSelectedArea.startWorldPos.y +
              heightPixelCount * this.gridSquareLength,
          },
          startPixelIndex:
            this.capturedBaseExtendingSelectedArea.startPixelIndex,
          endPixelIndex: {
            rowIndex:
              this.capturedBaseExtendingSelectedArea.startPixelIndex.rowIndex +
              heightPixelCount -
              1,
            columnIndex: this.selectedArea.endPixelIndex.columnIndex,
          },
        });
      } else if (direction === ButtonDirection.LEFT) {
        originPixelIndex.rowIndex =
          this.capturedBaseExtendingSelectedArea.startPixelIndex.rowIndex;
        originPixelIndex.columnIndex =
          this.capturedBaseExtendingSelectedArea.endPixelIndex.columnIndex;
        modifyPixelWidthRatio =
          widthPixelCount / (originalSelectAreaWidthPixelOffset + 1);
        this.setExtendingSelectedArea({
          startWorldPos: {
            x:
              this.capturedBaseExtendingSelectedArea.endWorldPos.x -
              widthPixelCount * this.gridSquareLength,
            y: this.capturedBaseExtendingSelectedArea.startWorldPos.y,
          },
          endWorldPos: this.capturedBaseExtendingSelectedArea.endWorldPos,
          startPixelIndex: {
            rowIndex:
              this.capturedBaseExtendingSelectedArea.startPixelIndex.rowIndex,
            columnIndex:
              this.capturedBaseExtendingSelectedArea.endPixelIndex.columnIndex -
              widthPixelCount +
              1,
          },
          endPixelIndex: this.capturedBaseExtendingSelectedArea.endPixelIndex,
        });
      } else if (direction === ButtonDirection.RIGHT) {
        originPixelIndex.rowIndex =
          this.capturedBaseExtendingSelectedArea.startPixelIndex.rowIndex;
        originPixelIndex.columnIndex =
          this.capturedBaseExtendingSelectedArea.startPixelIndex.columnIndex;
        modifyPixelWidthRatio =
          widthPixelCount / (originalSelectAreaWidthPixelOffset + 1);
        this.setExtendingSelectedArea({
          startWorldPos: this.capturedBaseExtendingSelectedArea.startWorldPos,
          endWorldPos: {
            x:
              this.capturedBaseExtendingSelectedArea.startWorldPos.x +
              widthPixelCount * this.gridSquareLength,
            y: this.capturedBaseExtendingSelectedArea.endWorldPos.y,
          },
          startPixelIndex:
            this.capturedBaseExtendingSelectedArea.startPixelIndex,
          endPixelIndex: {
            rowIndex:
              this.capturedBaseExtendingSelectedArea.endPixelIndex.rowIndex,
            columnIndex:
              this.capturedBaseExtendingSelectedArea.startPixelIndex
                .columnIndex +
              widthPixelCount -
              1,
          },
        });
      }
    }
    const filteredPixelsToColor = getOverlappingPixelIndicesForModifiedPixels(
      this.capturedBaseExtendingSelectedAreaPixels,
      originPixelIndex,
      modifyPixelWidthRatio,
      modifyPixelHeightRatio,
      this.gridSquareLength,
    ).filter(
      item =>
        !(
          item.columnIndex <
            this.extendingSelectedArea.startPixelIndex.columnIndex ||
          item.columnIndex >
            this.extendingSelectedArea.endPixelIndex.columnIndex ||
          item.rowIndex < this.extendingSelectedArea.startPixelIndex.rowIndex ||
          item.rowIndex > this.extendingSelectedArea.endPixelIndex.rowIndex
        ),
    );
    this.setExtendingSelectedPixels(filteredPixelsToColor);
    return;
  }

  extendSelectedAreaDiagonally(
    direction: ButtonDirection,
    extendToCoord: Coord,
    isAltPressed: boolean,
  ) {
    if (!this.selectedArea || !this.capturedBaseExtendingSelectedArea) {
      return;
    }

    const originalSelectAreaHeightPixelOffset =
      this.capturedBaseExtendingSelectedArea.endPixelIndex.rowIndex -
      this.capturedBaseExtendingSelectedArea.startPixelIndex.rowIndex;
    const originalSelectAreaWidthPixelOffset =
      this.capturedBaseExtendingSelectedArea.endPixelIndex.columnIndex -
      this.capturedBaseExtendingSelectedArea.startPixelIndex.columnIndex;
    const originPixelIndex = {
      rowIndex: this.capturedBaseExtendingSelectedArea.startPixelIndex.rowIndex,
      columnIndex:
        this.capturedBaseExtendingSelectedArea.endPixelIndex.columnIndex,
    };
    let modifyPixelWidthRatio = 1;
    let modifyPixelHeightRatio = 1;

    if (isAltPressed) {
      const wasOriginalAreaHeightEven =
        (originalSelectAreaHeightPixelOffset + 1) % 2 === 0;
      const wasOriginalAreaWidthEven =
        (originalSelectAreaWidthPixelOffset + 1) % 2 === 0;
      originPixelIndex.rowIndex =
        this.capturedBaseExtendingSelectedArea.startPixelIndex.rowIndex +
        (originalSelectAreaHeightPixelOffset + 2) / 2;
      originPixelIndex.columnIndex =
        this.capturedBaseExtendingSelectedArea.startPixelIndex.columnIndex +
        (originalSelectAreaWidthPixelOffset + 2) / 2;
      const heightExtensionOffset =
        direction === ButtonDirection.TOPLEFT ||
        direction === ButtonDirection.TOPRIGHT
          ? this.capturedBaseExtendingSelectedArea.startWorldPos.y -
            extendToCoord.y
          : extendToCoord.y -
            this.capturedBaseExtendingSelectedArea.endWorldPos.y;
      const widthExtensionOffset =
        direction === ButtonDirection.TOPLEFT ||
        direction === ButtonDirection.BOTTOMLEFT
          ? this.capturedBaseExtendingSelectedArea.startWorldPos.x -
            extendToCoord.x
          : extendToCoord.x -
            this.capturedBaseExtendingSelectedArea.endWorldPos.x;
      let singleSideOffsetRowBy = Math.round(
        heightExtensionOffset / this.gridSquareLength,
      );
      let singleSideOffsetColumnBy = Math.round(
        widthExtensionOffset / this.gridSquareLength,
      );
      let heightPixelCount =
        originalSelectAreaHeightPixelOffset + 1 + singleSideOffsetRowBy * 2;
      if (heightPixelCount < 1 && !wasOriginalAreaHeightEven) {
        heightPixelCount = 1;
        singleSideOffsetRowBy = -originalSelectAreaHeightPixelOffset / 2;
      } else if (heightPixelCount < 2 && wasOriginalAreaHeightEven) {
        heightPixelCount = 2;
        singleSideOffsetRowBy = -(originalSelectAreaHeightPixelOffset - 1) / 2;
      }
      let widthPixelCount =
        originalSelectAreaWidthPixelOffset + 1 + singleSideOffsetColumnBy * 2;
      if (widthPixelCount < 1 && !wasOriginalAreaWidthEven) {
        widthPixelCount = 1;
        singleSideOffsetColumnBy = -originalSelectAreaWidthPixelOffset / 2;
      } else if (widthPixelCount < 2 && wasOriginalAreaWidthEven) {
        widthPixelCount = 2;
        singleSideOffsetColumnBy =
          -(originalSelectAreaWidthPixelOffset - 1) / 2;
      }
      modifyPixelHeightRatio =
        (originalSelectAreaHeightPixelOffset + 2 * singleSideOffsetRowBy) /
        originalSelectAreaHeightPixelOffset;
      modifyPixelWidthRatio =
        (originalSelectAreaWidthPixelOffset + 2 * singleSideOffsetColumnBy) /
        originalSelectAreaWidthPixelOffset;
      this.setExtendingSelectedArea({
        startWorldPos: {
          x:
            this.capturedBaseExtendingSelectedArea.startWorldPos.x -
            singleSideOffsetColumnBy * this.gridSquareLength,
          y:
            this.capturedBaseExtendingSelectedArea.startWorldPos.y -
            singleSideOffsetRowBy * this.gridSquareLength,
        },
        endWorldPos: {
          x:
            this.capturedBaseExtendingSelectedArea.endWorldPos.x +
            singleSideOffsetColumnBy * this.gridSquareLength,
          y:
            this.capturedBaseExtendingSelectedArea.endWorldPos.y +
            singleSideOffsetRowBy * this.gridSquareLength,
        },
        startPixelIndex: {
          rowIndex:
            this.capturedBaseExtendingSelectedArea.startPixelIndex.rowIndex -
            singleSideOffsetRowBy,
          columnIndex:
            this.capturedBaseExtendingSelectedArea.startPixelIndex.columnIndex -
            singleSideOffsetColumnBy,
        },
        endPixelIndex: {
          rowIndex:
            this.capturedBaseExtendingSelectedArea.endPixelIndex.rowIndex +
            singleSideOffsetRowBy,
          columnIndex:
            this.capturedBaseExtendingSelectedArea.endPixelIndex.columnIndex +
            singleSideOffsetColumnBy,
        },
      });
    } else {
      const heightExtensionOffset =
        direction === ButtonDirection.TOPLEFT ||
        direction === ButtonDirection.TOPRIGHT
          ? this.capturedBaseExtendingSelectedArea.startWorldPos.y -
            extendToCoord.y
          : extendToCoord.y -
            this.capturedBaseExtendingSelectedArea.endWorldPos.y;
      const widthExtensionOffset =
        direction === ButtonDirection.TOPLEFT ||
        direction === ButtonDirection.BOTTOMLEFT
          ? this.capturedBaseExtendingSelectedArea.startWorldPos.x -
            extendToCoord.x
          : extendToCoord.x -
            this.capturedBaseExtendingSelectedArea.endWorldPos.x;
      let offsetRowBy = Math.round(
        heightExtensionOffset / this.gridSquareLength,
      );
      let offsetColumnBy = Math.round(
        widthExtensionOffset / this.gridSquareLength,
      );
      let heightPixelCount =
        originalSelectAreaHeightPixelOffset + 1 + offsetRowBy;
      let widthPixelCount =
        originalSelectAreaWidthPixelOffset + 1 + offsetColumnBy;
      if (heightPixelCount < 1) {
        heightPixelCount = 1;
        offsetRowBy = -originalSelectAreaHeightPixelOffset;
      }
      if (widthPixelCount < 1) {
        widthPixelCount = 1;
        offsetColumnBy = -originalSelectAreaWidthPixelOffset;
      }
      if (direction === ButtonDirection.TOPLEFT) {
        originPixelIndex.rowIndex =
          this.capturedBaseExtendingSelectedArea.endPixelIndex.rowIndex;
        originPixelIndex.columnIndex =
          this.capturedBaseExtendingSelectedArea.endPixelIndex.columnIndex;
        modifyPixelHeightRatio =
          heightPixelCount / (originalSelectAreaHeightPixelOffset + 1);
        modifyPixelWidthRatio =
          widthPixelCount / (originalSelectAreaWidthPixelOffset + 1);
        this.setExtendingSelectedArea({
          startWorldPos: {
            x:
              this.capturedBaseExtendingSelectedArea.endWorldPos.x -
              widthPixelCount * this.gridSquareLength,
            y:
              this.capturedBaseExtendingSelectedArea.endWorldPos.y -
              heightPixelCount * this.gridSquareLength,
          },
          endWorldPos: this.capturedBaseExtendingSelectedArea.endWorldPos,
          startPixelIndex: {
            rowIndex:
              this.capturedBaseExtendingSelectedArea.endPixelIndex.rowIndex -
              heightPixelCount +
              1,
            columnIndex:
              this.capturedBaseExtendingSelectedArea.endPixelIndex.columnIndex -
              widthPixelCount +
              1,
          },
          endPixelIndex: this.capturedBaseExtendingSelectedArea.endPixelIndex,
        });
      } else if (direction === ButtonDirection.TOPRIGHT) {
        originPixelIndex.rowIndex =
          this.capturedBaseExtendingSelectedArea.endPixelIndex.rowIndex;
        originPixelIndex.columnIndex =
          this.capturedBaseExtendingSelectedArea.startPixelIndex.columnIndex;
        modifyPixelHeightRatio =
          heightPixelCount / (originalSelectAreaHeightPixelOffset + 1);
        modifyPixelWidthRatio =
          widthPixelCount / (originalSelectAreaWidthPixelOffset + 1);
        this.setExtendingSelectedArea({
          startWorldPos: {
            x: this.capturedBaseExtendingSelectedArea.startWorldPos.x,
            y:
              this.capturedBaseExtendingSelectedArea.endWorldPos.y -
              heightPixelCount * this.gridSquareLength,
          },
          endWorldPos: {
            x:
              this.capturedBaseExtendingSelectedArea.startWorldPos.x +
              widthPixelCount * this.gridSquareLength,
            y: this.capturedBaseExtendingSelectedArea.endWorldPos.y,
          },
          startPixelIndex: {
            rowIndex:
              this.capturedBaseExtendingSelectedArea.endPixelIndex.rowIndex -
              heightPixelCount +
              1,
            columnIndex:
              this.capturedBaseExtendingSelectedArea.startPixelIndex
                .columnIndex,
          },
          endPixelIndex: {
            rowIndex:
              this.capturedBaseExtendingSelectedArea.endPixelIndex.rowIndex,
            columnIndex:
              this.capturedBaseExtendingSelectedArea.startPixelIndex
                .columnIndex +
              widthPixelCount -
              1,
          },
        });
      } else if (direction === ButtonDirection.BOTTOMLEFT) {
        originPixelIndex.rowIndex =
          this.capturedBaseExtendingSelectedArea.startPixelIndex.rowIndex;
        originPixelIndex.columnIndex =
          this.capturedBaseExtendingSelectedArea.endPixelIndex.columnIndex;
        modifyPixelHeightRatio =
          heightPixelCount / (originalSelectAreaHeightPixelOffset + 1);
        modifyPixelWidthRatio =
          widthPixelCount / (originalSelectAreaWidthPixelOffset + 1);
        this.setExtendingSelectedArea({
          startWorldPos: {
            x:
              this.capturedBaseExtendingSelectedArea.endWorldPos.x -
              widthPixelCount * this.gridSquareLength,
            y: this.capturedBaseExtendingSelectedArea.startWorldPos.y,
          },
          endWorldPos: {
            x: this.capturedBaseExtendingSelectedArea.endWorldPos.x,
            y:
              this.capturedBaseExtendingSelectedArea.startWorldPos.y +
              heightPixelCount * this.gridSquareLength,
          },
          startPixelIndex: {
            rowIndex:
              this.capturedBaseExtendingSelectedArea.startPixelIndex.rowIndex,
            columnIndex:
              this.capturedBaseExtendingSelectedArea.endPixelIndex.columnIndex -
              widthPixelCount +
              1,
          },
          endPixelIndex: {
            rowIndex:
              this.capturedBaseExtendingSelectedArea.startPixelIndex.rowIndex +
              heightPixelCount -
              1,
            columnIndex:
              this.capturedBaseExtendingSelectedArea.endPixelIndex.columnIndex,
          },
        });
      } else if (direction === ButtonDirection.BOTTOMRIGHT) {
        originPixelIndex.rowIndex =
          this.capturedBaseExtendingSelectedArea.startPixelIndex.rowIndex;
        originPixelIndex.columnIndex =
          this.capturedBaseExtendingSelectedArea.startPixelIndex.columnIndex;
        modifyPixelHeightRatio =
          heightPixelCount / (originalSelectAreaHeightPixelOffset + 1);
        modifyPixelWidthRatio =
          widthPixelCount / (originalSelectAreaWidthPixelOffset + 1);
        this.setExtendingSelectedArea({
          startWorldPos: {
            x: this.capturedBaseExtendingSelectedArea.startWorldPos.x,
            y: this.capturedBaseExtendingSelectedArea.startWorldPos.y,
          },
          endWorldPos: {
            x:
              this.capturedBaseExtendingSelectedArea.startWorldPos.x +
              widthPixelCount * this.gridSquareLength,
            y:
              this.capturedBaseExtendingSelectedArea.startWorldPos.y +
              heightPixelCount * this.gridSquareLength,
          },
          startPixelIndex: {
            rowIndex:
              this.capturedBaseExtendingSelectedArea.startPixelIndex.rowIndex,
            columnIndex:
              this.capturedBaseExtendingSelectedArea.startPixelIndex
                .columnIndex,
          },
          endPixelIndex: {
            rowIndex:
              this.capturedBaseExtendingSelectedArea.startPixelIndex.rowIndex +
              heightPixelCount -
              1,
            columnIndex:
              this.capturedBaseExtendingSelectedArea.startPixelIndex
                .columnIndex +
              widthPixelCount -
              1,
          },
        });
      }
    }
    const filteredPixelsToColor = getOverlappingPixelIndicesForModifiedPixels(
      this.capturedBaseExtendingSelectedAreaPixels,
      originPixelIndex,
      modifyPixelWidthRatio,
      modifyPixelHeightRatio,
      this.gridSquareLength,
    ).filter(
      item =>
        !(
          item.columnIndex <
            this.extendingSelectedArea.startPixelIndex.columnIndex ||
          item.columnIndex >
            this.extendingSelectedArea.endPixelIndex.columnIndex ||
          item.rowIndex < this.extendingSelectedArea.startPixelIndex.rowIndex ||
          item.rowIndex > this.extendingSelectedArea.endPixelIndex.rowIndex
        ),
    );
    this.setExtendingSelectedPixels(filteredPixelsToColor);
  }

  extendSelectedArea(
    direction: ButtonDirection,
    extendToCoord: Coord,
    isAltPressed: boolean,
  ) {
    if (!this.selectedArea) {
      return;
    }
    if (this.capturedBaseExtendingSelectedArea === null) {
      this.capturedBaseExtendingSelectedArea = this.selectedArea;
    }
    if (this.capturedBaseExtendingSelectedAreaPixels === null) {
      // copy
      this.capturedBaseExtendingSelectedAreaPixels = [
        ...this.selectedAreaPixels,
      ];
    }
    switch (direction) {
      case ButtonDirection.TOP:
        this.extendSelectedAreaSideWays(
          ButtonDirection.TOP,
          extendToCoord,
          isAltPressed,
        );
        break;
      case ButtonDirection.BOTTOM:
        this.extendSelectedAreaSideWays(
          ButtonDirection.BOTTOM,
          extendToCoord,
          isAltPressed,
        );
        break;
      case ButtonDirection.LEFT:
        this.extendSelectedAreaSideWays(
          ButtonDirection.LEFT,
          extendToCoord,
          isAltPressed,
        );
        break;
      case ButtonDirection.RIGHT:
        this.extendSelectedAreaSideWays(
          ButtonDirection.RIGHT,
          extendToCoord,
          isAltPressed,
        );
        break;
      case ButtonDirection.TOPLEFT:
        this.extendSelectedAreaDiagonally(
          ButtonDirection.TOPLEFT,
          extendToCoord,
          isAltPressed,
        );
        break;
      case ButtonDirection.TOPRIGHT:
        this.extendSelectedAreaDiagonally(
          ButtonDirection.TOPRIGHT,
          extendToCoord,
          isAltPressed,
        );
        break;
      case ButtonDirection.BOTTOMLEFT:
        this.extendSelectedAreaDiagonally(
          ButtonDirection.BOTTOMLEFT,
          extendToCoord,
          isAltPressed,
        );
        break;
      case ButtonDirection.BOTTOMRIGHT:
        this.extendSelectedAreaDiagonally(
          ButtonDirection.BOTTOMRIGHT,
          extendToCoord,
          isAltPressed,
        );
        break;
    }
  }

  extendCapturedData(direction: ButtonDirection) {
    if (!this.capturedData) {
      throw new Error("There is no captured data");
    }
    const { topRowIndex, bottomRowIndex, leftColumnIndex, rightColumnIndex } =
      getGridIndicesFromData(this.capturedData);
    if (
      direction === ButtonDirection.TOP ||
      direction === ButtonDirection.BOTTOM
    ) {
      const newRowIndex =
        direction === ButtonDirection.TOP
          ? topRowIndex - 1
          : bottomRowIndex + 1;
      // this.swipedPixels = this.swipedPixels.filter(
      //   swipedPixel => swipedPixel.rowIndex !== newRowIndex,
      // );
      addRowToData(this.capturedData, newRowIndex, this.defaultPixelColor);
    } else if (
      direction === ButtonDirection.LEFT ||
      direction === ButtonDirection.RIGHT
    ) {
      const newColumnIndex =
        direction === ButtonDirection.LEFT
          ? leftColumnIndex - 1
          : rightColumnIndex + 1;
      // this.swipedPixels = this.swipedPixels.filter(
      //   swipedPixel => swipedPixel.columnIndex !== newColumnIndex,
      // );
      addColumnToData(
        this.capturedData,
        newColumnIndex,
        this.defaultPixelColor,
      );
    }
  }

  shortenCapturedData(direction: ButtonDirection): boolean {
    if (!this.capturedData) {
      throw new Error("There is no captured data");
    }
    const { topRowIndex, bottomRowIndex, leftColumnIndex, rightColumnIndex } =
      getGridIndicesFromData(this.capturedData);
    const columnCount = getColumnCountFromData(this.capturedData);
    const rowCount = getRowCountFromData(this.capturedData);
    const pixelModifyItems: Array<PixelModifyItem> = [];
    if (
      direction === ButtonDirection.TOP ||
      direction === ButtonDirection.BOTTOM
    ) {
      if (rowCount <= MinColumnOrRowCount) {
        return false;
      }
      const swipedRowIndex =
        direction === ButtonDirection.TOP ? topRowIndex : bottomRowIndex;
      const swipedRowPixels = extractColoredPixelsFromRow(
        this.capturedData,
        swipedRowIndex,
      );
      pixelModifyItems.push(...swipedRowPixels);
      // delete the row in captured data
      deleteRowOfData(this.capturedData, swipedRowIndex);
    } else if (
      direction === ButtonDirection.LEFT ||
      direction === ButtonDirection.RIGHT
    ) {
      if (columnCount <= MinColumnOrRowCount) {
        return false;
      }
      const swipedColumnIndex =
        direction === ButtonDirection.LEFT ? leftColumnIndex : rightColumnIndex;
      const swipedColumnPixels = extractColoredPixelsFromColumn(
        this.capturedData,
        swipedColumnIndex,
      );
      pixelModifyItems.push(...swipedColumnPixels);
      deleteColumnOfData(this.capturedData, swipedColumnIndex);
    }
    return true;
  }

  setIndicatorPixels(indicatorPixels: Array<PixelModifyItem>) {
    if (Array.isArray(indicatorPixels)) {
      this.indicatorPixels = indicatorPixels;
    }
  }

  /**
   * In the interaction layer,
   * This will only collect information of presence updating information
   * @param userId User id of the user who is changing the dimension
   * (the user of the current device will have id "current-device-user-id"
   * @param dimensionChangeRecord
   */
  addToStrokePixelRecords(userId: UserId, pixelItem: ColorChangeItem) {
    if (!this.strokedPixelRecords.has(userId)) {
      this.strokedPixelRecords.set(userId, new PixelChangeRecords());
    }
    this.strokedPixelRecords.get(userId)?.record(pixelItem);
  }

  getAllStrokePixels() {
    const allStrokePixels: Array<ColorChangeItem> = [];
    this.strokedPixelRecords.forEach(pixelChangeRecords => {
      allStrokePixels.push(...pixelChangeRecords.getEffectiveChanges());
    });
    return allStrokePixels;
  }

  addToErasedPixelRecords(userId: UserId, pixelItem: ColorChangeItem) {
    if (!this.erasedPixelRecords.has(userId)) {
      this.erasedPixelRecords.set(userId, new PixelChangeRecords());
    }
    this.erasedPixelRecords.get(userId)?.record(pixelItem);
  }

  getAllErasedPixels() {
    const allErasedPixels: Array<ColorChangeItem> = [];
    this.erasedPixelRecords.forEach(pixelChangeRecords => {
      allErasedPixels.push(...pixelChangeRecords.getEffectiveChanges());
    });
    return allErasedPixels;
  }

  deleteErasedPixelRecord(userId: UserId) {
    this.erasedPixelRecords.delete(userId);
  }

  deleteStrokePixelRecord(userId: UserId) {
    this.strokedPixelRecords.delete(userId);
  }

  // this will be called when multiplayer user (finishes) changing the color
  // while the user is changing the dimensions of the canvas
  colorPixels(data: Array<PixelModifyItem>) {
    this.tempStrokedPixels.push(...data);
  }

  // this will be called when multiplayer user (finishes) changing the color
  // while the user is changing the dimensions of the canvas
  erasePixels(data: Array<{ rowIndex: number; columnIndex: number }>) {
    this.tempStrokedPixels.push(...data.map(item => ({ ...item, color: "" })));
  }

  renderStrokedPixels(
    correctedLeftTopScreenPoint: Coord,
    squareLength: number,
  ) {
    const ctx = this.ctx;
    const doesCapturedDataExist = this.capturedData !== null;
    const allStrokedPixels = this.getAllStrokePixels().filter(item => {
      if (!doesCapturedDataExist) {
        return true;
      } else {
        const gridIndices = getGridIndicesFromData(this.capturedData);
        return (
          item.rowIndex < gridIndices.topRowIndex ||
          item.rowIndex > gridIndices.bottomRowIndex ||
          item.columnIndex < gridIndices.leftColumnIndex ||
          item.columnIndex > gridIndices.rightColumnIndex
        );
      }
    });
    const tempColorPixelsToStroke = this.tempStrokedPixels
      .filter(item => item.color !== "")
      .filter(item => {
        if (!doesCapturedDataExist) {
          return true;
        } else {
          const gridIndices = getGridIndicesFromData(this.capturedData);
          return (
            item.rowIndex < gridIndices.topRowIndex ||
            item.rowIndex > gridIndices.bottomRowIndex ||
            item.columnIndex < gridIndices.leftColumnIndex ||
            item.columnIndex > gridIndices.rightColumnIndex
          );
        }
      });
    ctx.save();
    for (const item of allStrokedPixels) {
      const relativeRowIndex = this.rowKeyOrderMap.get(item.rowIndex);
      const relativeColumnIndex = this.columnKeyOrderMap.get(item.columnIndex);
      if (relativeRowIndex === undefined || relativeColumnIndex === undefined) {
        continue;
      }
      ctx.fillStyle = item.color;
      ctx.fillRect(
        relativeColumnIndex * squareLength + correctedLeftTopScreenPoint.x,
        relativeRowIndex * squareLength + correctedLeftTopScreenPoint.y,
        squareLength,
        squareLength,
      );
    }
    for (const item of tempColorPixelsToStroke) {
      const relativeRowIndex = this.rowKeyOrderMap.get(item.rowIndex);
      const relativeColumnIndex = this.columnKeyOrderMap.get(item.columnIndex);
      if (relativeRowIndex === undefined || relativeColumnIndex === undefined) {
        continue;
      }
      ctx.fillStyle = item.color;
      ctx.fillRect(
        relativeColumnIndex * squareLength + correctedLeftTopScreenPoint.x,
        relativeRowIndex * squareLength + correctedLeftTopScreenPoint.y,
        squareLength,
        squareLength,
      );
    }
    ctx.restore();
  }

  renderErasedPixels(correctedLeftTopScreenPoint: Coord, squareLength: number) {
    const tempErasePixels = this.tempStrokedPixels.filter(
      item => item.color === "",
    );
    const allErasedPixels = this.getAllErasedPixels();
    const ctx = this.ctx;
    ctx.save();
    for (const item of allErasedPixels) {
      const relativeRowIndex = this.rowKeyOrderMap.get(item.rowIndex);
      const relativeColumnIndex = this.columnKeyOrderMap.get(item.columnIndex);
      if (relativeRowIndex === undefined || relativeColumnIndex === undefined) {
        continue;
      }
      ctx.clearRect(
        relativeColumnIndex * squareLength + correctedLeftTopScreenPoint.x,
        relativeRowIndex * squareLength + correctedLeftTopScreenPoint.y,
        squareLength,
        squareLength,
      );
      ctx.fillStyle = this.defaultPixelColor;
      ctx.fillRect(
        relativeColumnIndex * squareLength + correctedLeftTopScreenPoint.x,
        relativeRowIndex * squareLength + correctedLeftTopScreenPoint.y,
        squareLength,
        squareLength,
      );
    }
    for (const item of tempErasePixels) {
      const relativeRowIndex = this.rowKeyOrderMap.get(item.rowIndex);
      const relativeColumnIndex = this.columnKeyOrderMap.get(item.columnIndex);
      if (relativeRowIndex === undefined || relativeColumnIndex === undefined) {
        continue;
      }
      ctx.clearRect(
        relativeColumnIndex * squareLength + correctedLeftTopScreenPoint.x,
        relativeRowIndex * squareLength + correctedLeftTopScreenPoint.y,
        squareLength,
        squareLength,
      );
      ctx.fillStyle = this.defaultPixelColor;
      ctx.fillRect(
        relativeColumnIndex * squareLength + correctedLeftTopScreenPoint.x,
        relativeRowIndex * squareLength + correctedLeftTopScreenPoint.y,
        squareLength,
        squareLength,
      );
    }
  }

  renderMovingSelectedPixels(
    correctedLeftTopScreenPoint: Coord,
    squareLength: number,
  ) {
    if (
      this.movingSelectedPixels === null ||
      this.movingSelectedPixels.length == 0
    ) {
      return;
    }
    const ctx = this.ctx;
    ctx.save();
    for (const item of this.movingSelectedPixels) {
      // this is the color of the pixel before the user started moving the selected pixels
      const color = item.previousColor;
      ctx.fillStyle = color;
      const relativeRowIndex = this.rowKeyOrderMap.get(item.rowIndex);
      const relativeColumnIndex = this.columnKeyOrderMap.get(item.columnIndex);
      if (relativeRowIndex === undefined || relativeColumnIndex === undefined) {
        continue;
      }
      ctx.fillRect(
        relativeColumnIndex * squareLength + correctedLeftTopScreenPoint.x,
        relativeRowIndex * squareLength + correctedLeftTopScreenPoint.y,
        squareLength,
        squareLength,
      );
    }
    ctx.restore();
  }

  renderExtendingSelectedPixels(
    correctedLeftTopScreenPoint: Coord,
    squareLength: number,
  ) {
    if (
      this.extendingSelectedPixels === null ||
      this.extendingSelectedPixels.length == 0
    ) {
      return;
    }
    const ctx = this.ctx;
    ctx.save();
    for (const item of this.extendingSelectedPixels) {
      const color = item.previousColor;
      ctx.fillStyle = color;
      const relativeRowIndex = this.rowKeyOrderMap.get(item.rowIndex);
      const relativeColumnIndex = this.columnKeyOrderMap.get(item.columnIndex);
      if (relativeRowIndex === undefined || relativeColumnIndex === undefined) {
        continue;
      }
      ctx.fillRect(
        relativeColumnIndex * squareLength + correctedLeftTopScreenPoint.x,
        relativeRowIndex * squareLength + correctedLeftTopScreenPoint.y,
        squareLength,
        squareLength,
      );
    }
    ctx.restore();
  }

  /**
   * @description While user is extending the pixel canvas,
   *              this function hides the datalayer with background color when canvas is shrinked
   *              or notifies the extended area with DefaultPixelColor when canvas is extended
   * @param correctedLeftTopScreenPoint The left top point of the canvas
   * @param squareLength The length of the square
   * @returns void
   */
  renderCanvasMask(correctedLeftTopScreenPoint: Coord, squareLength: number) {
    if (
      this.capturedData === null ||
      this.capturedDataOriginalIndices === null
    ) {
      return;
    }
    const modifiedGridIndices = getGridIndicesFromData(this.capturedData);
    const originalGridIndices = this.capturedDataOriginalIndices;
    const columnCount =
      modifiedGridIndices.rightColumnIndex -
      modifiedGridIndices.leftColumnIndex +
      1;
    const rowCount =
      modifiedGridIndices.bottomRowIndex - modifiedGridIndices.topRowIndex + 1;
    const leftColumnOffset =
      modifiedGridIndices.leftColumnIndex - originalGridIndices.leftColumnIndex;
    const rightColumnOffset =
      modifiedGridIndices.rightColumnIndex -
      originalGridIndices.rightColumnIndex;
    const topRowOffset =
      modifiedGridIndices.topRowIndex - originalGridIndices.topRowIndex;
    const bottomRowOffset =
      modifiedGridIndices.bottomRowIndex - originalGridIndices.bottomRowIndex;
    const ctx = this.ctx;
    if (leftColumnOffset > 0) {
      drawRect(
        ctx,
        correctedLeftTopScreenPoint.x - leftColumnOffset * squareLength,
        correctedLeftTopScreenPoint.y,
        leftColumnOffset * squareLength,
        rowCount * squareLength,
        this.backgroundColor,
        this.backgroundColor,
        1,
      );
    } else {
      drawRect(
        ctx,
        correctedLeftTopScreenPoint.x,
        correctedLeftTopScreenPoint.y,
        -leftColumnOffset * squareLength,
        rowCount * squareLength,
        this.defaultPixelColor,
        this.defaultPixelColor,
        1,
      );
    }
    if (rightColumnOffset > 0) {
      drawRect(
        ctx,
        correctedLeftTopScreenPoint.x +
          columnCount * squareLength -
          rightColumnOffset * squareLength,
        correctedLeftTopScreenPoint.y,
        rightColumnOffset * squareLength,
        rowCount * squareLength,
        this.defaultPixelColor,
        this.defaultPixelColor,
        1,
      );
    } else {
      drawRect(
        ctx,
        correctedLeftTopScreenPoint.x + columnCount * squareLength,
        correctedLeftTopScreenPoint.y,
        -rightColumnOffset * squareLength,
        rowCount * squareLength,
        this.backgroundColor,
        this.backgroundColor,
        1,
      );
    }
    if (topRowOffset > 0) {
      drawRect(
        ctx,
        correctedLeftTopScreenPoint.x,
        correctedLeftTopScreenPoint.y - topRowOffset * squareLength,
        columnCount * squareLength,
        topRowOffset * squareLength,
        this.backgroundColor,
        this.backgroundColor,
        1,
      );
    } else {
      drawRect(
        ctx,
        correctedLeftTopScreenPoint.x,
        correctedLeftTopScreenPoint.y,
        columnCount * squareLength,
        -topRowOffset * squareLength,
        this.defaultPixelColor,
        this.defaultPixelColor,
        1,
      );
    }
    if (bottomRowOffset > 0) {
      drawRect(
        ctx,
        correctedLeftTopScreenPoint.x,
        correctedLeftTopScreenPoint.y +
          rowCount * squareLength -
          bottomRowOffset * squareLength,
        columnCount * squareLength,
        bottomRowOffset * squareLength,
        this.defaultPixelColor,
        this.defaultPixelColor,
        1,
      );
    } else {
      drawRect(
        ctx,
        correctedLeftTopScreenPoint.x,
        correctedLeftTopScreenPoint.y + rowCount * squareLength,
        columnCount * squareLength,
        -bottomRowOffset * squareLength,
        this.backgroundColor,
        this.backgroundColor,
        1,
      );
    }
    if (leftColumnOffset > 0 && topRowOffset > 0) {
      drawRect(
        ctx,
        correctedLeftTopScreenPoint.x - leftColumnOffset * squareLength,
        correctedLeftTopScreenPoint.y - topRowOffset * squareLength,
        leftColumnOffset * squareLength,
        topRowOffset * squareLength,
        this.backgroundColor,
        this.backgroundColor,
        1,
      );
    }
    if (leftColumnOffset > 0 && bottomRowOffset < 0) {
      drawRect(
        ctx,
        correctedLeftTopScreenPoint.x - leftColumnOffset * squareLength,
        correctedLeftTopScreenPoint.y + rowCount * squareLength,
        leftColumnOffset * squareLength,
        -bottomRowOffset * squareLength,
        this.backgroundColor,
        this.backgroundColor,
        1,
      );
    }
    if (rightColumnOffset < 0 && topRowOffset > 0) {
      drawRect(
        ctx,
        correctedLeftTopScreenPoint.x + columnCount * squareLength,
        correctedLeftTopScreenPoint.y - topRowOffset * squareLength,
        -rightColumnOffset * squareLength,
        topRowOffset * squareLength,
        this.backgroundColor,
        this.backgroundColor,
        1,
      );
    }
    if (rightColumnOffset < 0 && bottomRowOffset < 0) {
      drawRect(
        ctx,
        correctedLeftTopScreenPoint.x + columnCount * squareLength,
        correctedLeftTopScreenPoint.y + rowCount * squareLength,
        -rightColumnOffset * squareLength,
        -bottomRowOffset * squareLength,
        this.backgroundColor,
        this.backgroundColor,
        1,
      );
    }
  }

  renderIndicatorPixels(
    correctedLeftTopScreenPoint: Coord,
    squareLength: number,
  ) {
    if (this.indicatorPixels.length == 0) {
      return;
    }
    const ctx = this.ctx;
    ctx.save();
    for (const item of this.indicatorPixels) {
      ctx.fillStyle = item.color;
      ctx.globalAlpha = 0.5;
      const relativeRowIndex = this.rowKeyOrderMap.get(item.rowIndex);
      const relativeColumnIndex = this.columnKeyOrderMap.get(item.columnIndex);
      if (relativeRowIndex === undefined || relativeColumnIndex === undefined) {
        continue;
      }
      // first erase the color inside the square
      ctx.clearRect(
        relativeColumnIndex * squareLength + correctedLeftTopScreenPoint.x,
        relativeRowIndex * squareLength + correctedLeftTopScreenPoint.y,
        squareLength,
        squareLength,
      );
      ctx.fillRect(
        relativeColumnIndex * squareLength + correctedLeftTopScreenPoint.x,
        relativeRowIndex * squareLength + correctedLeftTopScreenPoint.y,
        squareLength,
        squareLength,
      );
    }
    ctx.restore();
  }

  renderHoveredPixel(correctedLeftTopScreenPoint: Coord, squareLength: number) {
    if (this.hoveredPixel === null || this.previewPoints || this.selectingArea) {
      return;
    }
    const ctx = this.ctx;
    const { rowIndex, columnIndex } = this.hoveredPixel;
    const relativeRowIndex = this.rowKeyOrderMap.get(rowIndex);
    const relativeColumnIndex = this.columnKeyOrderMap.get(columnIndex);
    if (relativeRowIndex === undefined || relativeColumnIndex === undefined) {
      return;
    }
    const brushPatternWidth = this.brushPattern.length;
    const brushPatternHeight = this.brushPattern[0].length;
    const brushPatternCenterRowIndex = Math.floor(brushPatternHeight / 2);
    const brushPatternCenterColumnIndex = Math.floor(brushPatternWidth / 2);
    ctx.save();
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < brushPatternHeight; i++) {
      for (let j = 0; j < brushPatternWidth; j++) {
        const brushPatternItem = this.brushPattern[i][j];
        if (brushPatternItem === 0) {
          continue;
        }
        const relativeRowIndex = this.rowKeyOrderMap.get(
          rowIndex + i - brushPatternCenterRowIndex,
        );
        const relativeColumnIndex = this.columnKeyOrderMap.get(
          columnIndex + j - brushPatternCenterColumnIndex,
        );
        if (
          relativeRowIndex === undefined ||
          relativeColumnIndex === undefined
        ) {
          continue;
        }
        ctx.fillStyle = this.hoveredPixel.color;
        ctx.fillRect(
          relativeColumnIndex * squareLength + correctedLeftTopScreenPoint.x,
          relativeRowIndex * squareLength + correctedLeftTopScreenPoint.y,
          squareLength,
          squareLength,
        );
      }
    }

    // ctx.clearRect(
    //   relativeColumnIndex * squareLength + correctedLeftTopScreenPoint.x,
    //   relativeRowIndex * squareLength + correctedLeftTopScreenPoint.y,
    //   squareLength,
    //   squareLength,
    // );
    // ctx.fillStyle = this.hoveredPixel.color;
    // ctx.fillRect(
    //   relativeColumnIndex * squareLength + correctedLeftTopScreenPoint.x,
    //   relativeRowIndex * squareLength + correctedLeftTopScreenPoint.y,
    //   squareLength,
    //   squareLength,
    // );
    ctx.restore();
  }

  getLinePoints(
    startPoint: Coord,
    endPoint: Coord,
    currentData: DottingData,
  ): Array<{ rowIndex: number; columnIndex: number }> {
    const { rowIndices, columnIndices } = getAllGridIndicesSorted(currentData);

    const startIndex = getPixelIndexFromMouseCartCoord(
      startPoint,
      rowIndices,
      columnIndices,
      this.gridSquareLength,
    );

    const endIndex = getPixelIndexFromMouseCartCoord(
      endPoint,
      rowIndices,
      columnIndices,
      this.gridSquareLength,
    );

    if (!startIndex || !endIndex) {
      return [];
    }

    const linePoints =
      getInBetweenPixelIndicesfromCoords(
        startPoint,
        endPoint,
        this.gridSquareLength,
        currentData,
      ) || [];

    // Ensure the end point is included
    if (
      linePoints.length > 0 &&
      (linePoints[linePoints.length - 1].rowIndex !== endIndex.rowIndex ||
        linePoints[linePoints.length - 1].columnIndex !== endIndex.columnIndex)
    ) {
      linePoints.push(endIndex);
    }

    return linePoints;
  }

  getRectanglePoints(
    startPoint: Coord,
    endPoint: Coord,
    currentData: DottingData,
    filled: boolean
  ): Array<{ rowIndex: number; columnIndex: number }> {
    return getRectanglePixelIndicesfromCoords(
      startPoint,
      endPoint,
      this.gridSquareLength,
      currentData,
      filled,
    )
  }

  getEllipsePoints(
    startPoint: Coord,
    endPoint: Coord,
    currentData: DottingData,
    filled: boolean
  ): Array<{ rowIndex: number; columnIndex: number }> {
    return getEllipsePixelIndicesfromCoords(
      startPoint,
      endPoint,
      this.gridSquareLength,
      currentData,
      filled,
    )
  }

  drawLine(
    startPoint: Coord,
    endPoint: Coord,
    color: string,
    currentData: DottingData,
  ) {
    if (!currentData) return;

    this.drawPoints(
      this.getLinePoints(startPoint, endPoint, currentData),
      color,
      currentData
    );
  }

  drawRectangle(
    startPoint: Coord,
    endPoint: Coord,
    color: string,
    currentData: DottingData,
    filled: boolean
  ) {
    if (!currentData) return;

    this.drawPoints(
      this.getRectanglePoints(startPoint, endPoint, currentData, filled),
      color,
      currentData
    );
  }

  drawEllipse(
    startPoint: Coord,
    endPoint: Coord,
    color: string,
    currentData: DottingData,
    filled: boolean
  ) {
    if (!currentData) return;

    this.drawPoints(
      this.getEllipsePoints(startPoint, endPoint, currentData, filled),
      color,
      currentData
    );
  }

  protected drawPoints(points: Index[], color, currentData: DottingData,) {
    for (const point of points) {
      const previousColor =
        currentData.get(point.rowIndex)?.get(point.columnIndex)?.color || "";
      this.addToStrokePixelRecords(CurrentDeviceUserId, {
        rowIndex: point.rowIndex,
        columnIndex: point.columnIndex,
        color: color,
        previousColor: previousColor,
      });
    }
  }

  renderPreviewPoints(correctedLeftTopScreenPoint: Coord, squareLength: number) {
    if (!this.previewPoints) return;

    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = this.hoveredPixel ? this.hoveredPixel.color : "#FF0000";

    for (const point of this.previewPoints) {
      const relativeRowIndex = this.rowKeyOrderMap.get(point.rowIndex);
      const relativeColumnIndex = this.columnKeyOrderMap.get(point.columnIndex);
      if (relativeRowIndex === undefined || relativeColumnIndex === undefined) {
        continue;
      }
      ctx.fillRect(
        relativeColumnIndex * squareLength + correctedLeftTopScreenPoint.x,
        relativeRowIndex * squareLength + correctedLeftTopScreenPoint.y,
        squareLength,
        squareLength,
      );
    }

    ctx.restore();
  }

  /**
   * Interaction Layer render will be called when:
   * 1. The canvas is resized
   * 2. The canvas is panned or zoomed
   * 3. The canvas is mouse clicked or touched
   * 4. The pixel grid is hovered
   * 5. The indicator pixel changes
   */
  render() {
    const squareLength = this.gridSquareLength * this.panZoom.scale;
    // leftTopPoint is a cartesian coordinate
    const leftTopPoint: Coord = {
      x: this.leftColumnIndex * this.gridSquareLength,
      y: this.topRowIndex * this.gridSquareLength,
    };
    const convertedLetTopScreenPoint = convertCartesianToScreen(
      this.element,
      leftTopPoint,
      this.dpr,
    );
    const correctedLeftTopScreenPoint = getScreenPoint(
      convertedLetTopScreenPoint,
      this.panZoom,
    );
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    this.renderCanvasMask(correctedLeftTopScreenPoint, squareLength);
    this.renderStrokedPixels(correctedLeftTopScreenPoint, squareLength);
    this.renderErasedPixels(correctedLeftTopScreenPoint, squareLength);
    this.renderIndicatorPixels(correctedLeftTopScreenPoint, squareLength);
    //draw indicator pixels on top of the canvas
    this.renderHoveredPixel(correctedLeftTopScreenPoint, squareLength);
    this.renderPreviewPoints(correctedLeftTopScreenPoint, squareLength);
    this.renderMovingSelectedPixels(correctedLeftTopScreenPoint, squareLength);
    this.renderExtendingSelectedPixels(
      correctedLeftTopScreenPoint,
      squareLength,
    );
  }
}
