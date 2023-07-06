import { BaseLayer } from "./BaseLayer";
import {
  DefaultGridSquareLength,
  UserId,
  ButtonDirection,
  TemporaryUserId,
  DefaultMaxScale,
  DefaultMinScale,
} from "./config";
import {
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
  getColumnCountFromData,
  getGridIndicesFromData,
  getRowCountFromData,
} from "../../utils/data";
import {
  convertCartesianToScreen,
  getScreenPoint,
  lerpRanges,
} from "../../utils/math";
import {
  getAreaTopLeftAndBottomRight,
  getCornerPixelIndices,
  getOverlappingPixelIndicesForModifiedPixels,
  getRelativeCornerWordPosOfPixelToOrigin,
} from "../../utils/position";

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

  private selectingArea: Omit<
    SelectAreaRange,
    "startPixelIndex" | "endPixelIndex"
  > | null = null;

  private selectedArea: SelectAreaRange | null = null;

  private capturedOriginalSelectedArea: SelectAreaRange | null = null;

  private directionToExtendSelectedArea: ButtonDirection | null = null;

  private movingSelectedArea: SelectAreaRange | null = null;

  private movingSelectedPixels: Array<ColorChangeItem> | null = null;

  private extendingSelectedPixels: Array<ColorChangeItem | null> | null = [];

  private selectedAreaPixels: Array<ColorChangeItem> | null = null;

  private capturedOriginalSelectedAreaPixels: Array<ColorChangeItem> | null =
    null;

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

  private gridSquareLength: number = DefaultGridSquareLength;

  private minimumCount = 2;

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

  setExtendingSelectedPixels(pixels: Array<ColorChangeItem | null> | null) {
    this.extendingSelectedPixels = pixels;
  }

  setMovingSelectedArea(area: SelectAreaRange | null) {
    this.movingSelectedArea = area;
  }

  setSelectedAreaPixels(pixelArray: Array<ColorChangeItem>) {
    this.selectedAreaPixels = pixelArray;
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

  setCapturedOriginalSelectedArea(
    capturedOriginalSelectedArea: SelectAreaRange | null,
  ) {
    this.capturedOriginalSelectedArea = capturedOriginalSelectedArea;
  }

  setCapturedOriginalSelectedAreaPixels(
    capturedOriginalSelectedAreaPixels: Array<ColorChangeItem> | null,
  ) {
    this.capturedOriginalSelectedAreaPixels =
      capturedOriginalSelectedAreaPixels;
  }

  resetCapturedData() {
    this.capturedData = null;
    this.capturedDataOriginalIndices = null;
    this.deleteStrokePixelRecord(TemporaryUserId);
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

  getMinimumCount() {
    return this.minimumCount;
  }

  detectSelectedAreaExtendDirection(coord: Coord): ButtonDirection | null {
    if (!this.selectedArea) {
      return null;
    }
    const extensionAllowanceRatio = 2;
    const strokeTouchingRange = 6;
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
      this.capturedOriginalSelectedArea.endPixelIndex.rowIndex -
      this.capturedOriginalSelectedArea.startPixelIndex.rowIndex;
    const originalSelectAreaWidthPixelOffset =
      this.capturedOriginalSelectedArea.endPixelIndex.columnIndex -
      this.capturedOriginalSelectedArea.startPixelIndex.columnIndex;
    const originPixelIndex = {
      rowIndex: this.capturedOriginalSelectedArea.startPixelIndex.rowIndex,
      columnIndex: this.capturedOriginalSelectedArea.endPixelIndex.columnIndex,
    };
    const originWorldPos = {
      x: this.capturedOriginalSelectedArea.startWorldPos.x,
      y: this.capturedOriginalSelectedArea.endWorldPos.y,
    };
    let modifyPixelWidthRatio = 1;
    let modifyPixelHeightRatio = 1;

    if (isAltPressed) {
      if (
        direction === ButtonDirection.TOP ||
        direction === ButtonDirection.BOTTOM
      ) {
        const wasOriginalAreaHeightEven =
          (originalSelectAreaHeightPixelOffset + 1) % 2 === 0;
        originPixelIndex.rowIndex =
          this.capturedOriginalSelectedArea.startPixelIndex.rowIndex +
          (originalSelectAreaHeightPixelOffset + 2) / 2;
        originPixelIndex.columnIndex =
          this.capturedOriginalSelectedArea.startPixelIndex.columnIndex +
          (originalSelectAreaWidthPixelOffset + 2) / 2;
        originWorldPos.y =
          this.capturedOriginalSelectedArea.startWorldPos.y +
          (this.capturedOriginalSelectedArea.endWorldPos.y -
            this.capturedOriginalSelectedArea.startWorldPos.y) /
            2;
        originWorldPos.x = this.capturedOriginalSelectedArea.startWorldPos.x;
        const extensionOffset =
          direction === ButtonDirection.TOP
            ? this.capturedOriginalSelectedArea.startWorldPos.y -
              extendToCoord.y
            : extendToCoord.y - this.capturedOriginalSelectedArea.endWorldPos.y;
        let singleSideOffsetRowBy = Math.round(
          extensionOffset / this.gridSquareLength,
        );
        // console.log(singleSideOffsetRowBy);
        let heightPixelCount =
          originalSelectAreaHeightPixelOffset + 1 + singleSideOffsetRowBy * 2;
        if (heightPixelCount < 1 && !wasOriginalAreaHeightEven) {
          // if original height is odd, and the new height is less than 1, then set it to 1
          heightPixelCount = 1;
          singleSideOffsetRowBy = -originalSelectAreaHeightPixelOffset / 2;
        } else if (heightPixelCount < 2 && wasOriginalAreaHeightEven) {
          // if original height is even, and the new height is less than 2, then set it to 2
          heightPixelCount = 2;
          singleSideOffsetRowBy =
            -(originalSelectAreaHeightPixelOffset - 1) / 2;
        }
        modifyPixelHeightRatio =
          (originalSelectAreaHeightPixelOffset + 2 * singleSideOffsetRowBy) /
          originalSelectAreaHeightPixelOffset;

        this.setSelectedArea({
          startWorldPos: {
            x: this.capturedOriginalSelectedArea.startWorldPos.x,
            y:
              this.capturedOriginalSelectedArea.startWorldPos.y -
              singleSideOffsetRowBy * this.gridSquareLength,
          },
          endWorldPos: {
            x: this.capturedOriginalSelectedArea.endWorldPos.x,
            y:
              this.capturedOriginalSelectedArea.endWorldPos.y +
              singleSideOffsetRowBy * this.gridSquareLength,
          },
          startPixelIndex: {
            rowIndex:
              this.capturedOriginalSelectedArea.startPixelIndex.rowIndex -
              singleSideOffsetRowBy,
            columnIndex:
              this.capturedOriginalSelectedArea.startPixelIndex.columnIndex,
          },
          endPixelIndex: {
            rowIndex:
              this.capturedOriginalSelectedArea.endPixelIndex.rowIndex +
              singleSideOffsetRowBy,
            columnIndex:
              this.capturedOriginalSelectedArea.endPixelIndex.columnIndex,
          },
        });
      } else if (
        direction === ButtonDirection.LEFT ||
        direction === ButtonDirection.RIGHT
      ) {
        const wasOriginalAreaWidthEven =
          (originalSelectAreaWidthPixelOffset + 1) % 2;
        originPixelIndex.rowIndex =
          this.capturedOriginalSelectedArea.startPixelIndex.rowIndex +
          (originalSelectAreaHeightPixelOffset + 2) / 2;
        originPixelIndex.columnIndex =
          this.capturedOriginalSelectedArea.startPixelIndex.columnIndex +
          (originalSelectAreaWidthPixelOffset + 2) / 2;
        originWorldPos.y = this.capturedOriginalSelectedArea.startWorldPos.y;
        originWorldPos.x =
          this.capturedOriginalSelectedArea.startWorldPos.x +
          (this.capturedOriginalSelectedArea.endWorldPos.x -
            this.capturedOriginalSelectedArea.startWorldPos.x) /
            2;
        const extensionOffset =
          direction === ButtonDirection.LEFT
            ? this.capturedOriginalSelectedArea.startWorldPos.x -
              extendToCoord.x
            : extendToCoord.x - this.capturedOriginalSelectedArea.endWorldPos.x;
        let singleSideOffsetColumnBy = Math.round(
          extensionOffset / this.gridSquareLength,
        );
        let widthPixelCount =
          originalSelectAreaWidthPixelOffset + 1 + singleSideOffsetColumnBy * 2;
        if (widthPixelCount < 1 && !wasOriginalAreaWidthEven) {
          // if original width is odd, and the new width is less than 1, then set it to 1
          widthPixelCount = 1;
          singleSideOffsetColumnBy = -originalSelectAreaWidthPixelOffset / 2;
        }
        modifyPixelWidthRatio =
          (originalSelectAreaWidthPixelOffset + 2 * singleSideOffsetColumnBy) /
          originalSelectAreaWidthPixelOffset;

        this.setSelectedArea({
          startWorldPos: {
            x:
              this.capturedOriginalSelectedArea.startWorldPos.x -
              singleSideOffsetColumnBy * this.gridSquareLength,
            y: this.capturedOriginalSelectedArea.startWorldPos.y,
          },
          endWorldPos: {
            x:
              this.capturedOriginalSelectedArea.endWorldPos.x +
              singleSideOffsetColumnBy * this.gridSquareLength,
            y: this.capturedOriginalSelectedArea.endWorldPos.y,
          },
          startPixelIndex: {
            rowIndex:
              this.capturedOriginalSelectedArea.startPixelIndex.rowIndex,
            columnIndex:
              this.capturedOriginalSelectedArea.startPixelIndex.columnIndex -
              singleSideOffsetColumnBy,
          },
          endPixelIndex: {
            rowIndex: this.capturedOriginalSelectedArea.endPixelIndex.rowIndex,
            columnIndex:
              this.capturedOriginalSelectedArea.endPixelIndex.columnIndex +
              singleSideOffsetColumnBy,
          },
        });
      }
    } else {
      if (direction === ButtonDirection.TOP) {
        originPixelIndex.rowIndex =
          this.capturedOriginalSelectedArea.endPixelIndex.rowIndex;
        originPixelIndex.columnIndex =
          this.capturedOriginalSelectedArea.startPixelIndex.columnIndex;
        originWorldPos.y = this.capturedOriginalSelectedArea.endWorldPos.y;
        originWorldPos.x = this.capturedOriginalSelectedArea.startWorldPos.x;
        // we extend the selected area to the top
        const extensionOffset =
          this.capturedOriginalSelectedArea.startWorldPos.y - extendToCoord.y;
        let offsetRowBy = Math.round(extensionOffset / this.gridSquareLength);
        let heightPixelCount =
          originalSelectAreaHeightPixelOffset + 1 + offsetRowBy;
        if (heightPixelCount < 1) {
          heightPixelCount = 1;
          offsetRowBy = -originalSelectAreaHeightPixelOffset;
        }
        modifyPixelHeightRatio =
          heightPixelCount / (originalSelectAreaHeightPixelOffset + 1);
        this.setSelectedArea({
          startWorldPos: {
            x: this.capturedOriginalSelectedArea.startWorldPos.x,
            y:
              this.capturedOriginalSelectedArea.endWorldPos.y -
              heightPixelCount * this.gridSquareLength,
          },
          endWorldPos: this.capturedOriginalSelectedArea.endWorldPos,
          startPixelIndex: {
            rowIndex:
              this.capturedOriginalSelectedArea.endPixelIndex.rowIndex -
              heightPixelCount +
              1,
            columnIndex:
              this.capturedOriginalSelectedArea.startPixelIndex.columnIndex,
          },
          endPixelIndex: this.capturedOriginalSelectedArea.endPixelIndex,
        });
      } else if (direction === ButtonDirection.BOTTOM) {
        // we extend the selected area to the bottom
        const extensionOffset =
          extendToCoord.y - this.capturedOriginalSelectedArea.endWorldPos.y;
        let offsetRowBy = Math.round(extensionOffset / this.gridSquareLength);
        let heightPixelCount =
          originalSelectAreaHeightPixelOffset + 1 + offsetRowBy;
        if (heightPixelCount < 1) {
          heightPixelCount = 1;
          offsetRowBy = -originalSelectAreaHeightPixelOffset;
        }
        originPixelIndex.rowIndex =
          this.capturedOriginalSelectedArea.startPixelIndex.rowIndex;
        originPixelIndex.columnIndex =
          this.capturedOriginalSelectedArea.startPixelIndex.columnIndex;
        originWorldPos.y = this.capturedOriginalSelectedArea.startWorldPos.y;
        originWorldPos.x = this.capturedOriginalSelectedArea.startWorldPos.x;
        modifyPixelHeightRatio =
          heightPixelCount / (originalSelectAreaHeightPixelOffset + 1);
        this.setSelectedArea({
          startWorldPos: this.capturedOriginalSelectedArea.startWorldPos,
          endWorldPos: {
            x: this.capturedOriginalSelectedArea.endWorldPos.x,
            y:
              this.capturedOriginalSelectedArea.startWorldPos.y +
              heightPixelCount * this.gridSquareLength,
          },
          startPixelIndex: this.capturedOriginalSelectedArea.startPixelIndex,
          endPixelIndex: {
            rowIndex:
              this.capturedOriginalSelectedArea.startPixelIndex.rowIndex +
              heightPixelCount -
              1,
            columnIndex: this.selectedArea.endPixelIndex.columnIndex,
          },
        });
      } else if (direction === ButtonDirection.LEFT) {
        // we extend the selected area to the left
        const extensionOffset =
          this.capturedOriginalSelectedArea.startWorldPos.x - extendToCoord.x;
        let offsetColumnBy = Math.round(
          extensionOffset / this.gridSquareLength,
        );
        let widthPixelCount =
          originalSelectAreaWidthPixelOffset + 1 + offsetColumnBy;
        if (widthPixelCount < 1) {
          widthPixelCount = 1;
          offsetColumnBy = -originalSelectAreaWidthPixelOffset;
        }
        originPixelIndex.rowIndex =
          this.capturedOriginalSelectedArea.startPixelIndex.rowIndex;
        originPixelIndex.columnIndex =
          this.capturedOriginalSelectedArea.endPixelIndex.columnIndex;
        originWorldPos.y = this.capturedOriginalSelectedArea.startWorldPos.y;
        originWorldPos.x = this.capturedOriginalSelectedArea.endWorldPos.x;
        modifyPixelWidthRatio =
          widthPixelCount / (originalSelectAreaWidthPixelOffset + 1);
        this.setSelectedArea({
          startWorldPos: {
            x:
              this.capturedOriginalSelectedArea.endWorldPos.x -
              widthPixelCount * this.gridSquareLength,
            y: this.capturedOriginalSelectedArea.startWorldPos.y,
          },
          endWorldPos: this.capturedOriginalSelectedArea.endWorldPos,
          startPixelIndex: {
            rowIndex:
              this.capturedOriginalSelectedArea.startPixelIndex.rowIndex,
            columnIndex:
              this.capturedOriginalSelectedArea.endPixelIndex.columnIndex -
              widthPixelCount +
              1,
          },
          endPixelIndex: this.capturedOriginalSelectedArea.endPixelIndex,
        });
      } else if (direction === ButtonDirection.RIGHT) {
        // we extend the selected area to the right
        const extensionOffset =
          extendToCoord.x - this.capturedOriginalSelectedArea.endWorldPos.x;
        let offsetColumnBy = Math.round(
          extensionOffset / this.gridSquareLength,
        );
        let widthPixelCount =
          originalSelectAreaWidthPixelOffset + 1 + offsetColumnBy;
        if (widthPixelCount < 1) {
          widthPixelCount = 1;
          offsetColumnBy = -originalSelectAreaWidthPixelOffset;
        }
        originPixelIndex.rowIndex =
          this.capturedOriginalSelectedArea.startPixelIndex.rowIndex;
        originPixelIndex.columnIndex =
          this.capturedOriginalSelectedArea.startPixelIndex.columnIndex;
        originWorldPos.y = this.capturedOriginalSelectedArea.startWorldPos.y;
        originWorldPos.x = this.capturedOriginalSelectedArea.startWorldPos.x;
        modifyPixelWidthRatio =
          widthPixelCount / (originalSelectAreaWidthPixelOffset + 1);
        this.setSelectedArea({
          startWorldPos: this.capturedOriginalSelectedArea.startWorldPos,
          endWorldPos: {
            x:
              this.capturedOriginalSelectedArea.startWorldPos.x +
              widthPixelCount * this.gridSquareLength,
            y: this.capturedOriginalSelectedArea.endWorldPos.y,
          },
          startPixelIndex: this.capturedOriginalSelectedArea.startPixelIndex,
          endPixelIndex: {
            rowIndex: this.capturedOriginalSelectedArea.endPixelIndex.rowIndex,
            columnIndex:
              this.capturedOriginalSelectedArea.startPixelIndex.columnIndex +
              widthPixelCount -
              1,
          },
        });
      }
    }
    const filteredPixelsToColor = getOverlappingPixelIndicesForModifiedPixels(
      this.capturedOriginalSelectedAreaPixels,
      originPixelIndex,
      originWorldPos,
      modifyPixelWidthRatio,
      modifyPixelHeightRatio,
      this.gridSquareLength,
    ).filter(
      item =>
        !(
          item.columnIndex < this.selectedArea.startPixelIndex.columnIndex ||
          item.columnIndex > this.selectedArea.endPixelIndex.columnIndex ||
          item.rowIndex < this.selectedArea.startPixelIndex.rowIndex ||
          item.rowIndex > this.selectedArea.endPixelIndex.rowIndex
        ),
    );
    this.setExtendingSelectedPixels(filteredPixelsToColor);
    return;
  }

  extendSelectedAreaDiagonally(
    direction: ButtonDirection,
    extendToCoord: Coord,
  ) {
    if (!this.selectedArea || !this.capturedOriginalSelectedArea) {
      return;
    }
    const originalSelectAreaHeightPixelOffset =
      this.capturedOriginalSelectedArea.endPixelIndex.rowIndex -
      this.capturedOriginalSelectedArea.startPixelIndex.rowIndex;
    const originalSelectAreaWidthPixelOffset =
      this.capturedOriginalSelectedArea.endPixelIndex.columnIndex -
      this.capturedOriginalSelectedArea.startPixelIndex.columnIndex;
    const originPixelIndex = {
      rowIndex: this.capturedOriginalSelectedArea.startPixelIndex.rowIndex,
      columnIndex: this.capturedOriginalSelectedArea.endPixelIndex.columnIndex,
    };
    const originWorldPos = {
      x: this.capturedOriginalSelectedArea.startWorldPos.x,
      y: this.capturedOriginalSelectedArea.endWorldPos.y,
    };
    let modifyPixelWidthRatio = 1;
    let modifyPixelHeightRatio = 1;

    if (direction === ButtonDirection.TOPLEFT) {
      const heightExtensionOffset =
        this.capturedOriginalSelectedArea.startWorldPos.y - extendToCoord.y;
      const widthExtensionOffset =
        this.capturedOriginalSelectedArea.startWorldPos.x - extendToCoord.x;

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
      // we extend the selected area to the top left
      if (heightPixelCount < 1) {
        heightPixelCount = 1;
        offsetRowBy = -originalSelectAreaHeightPixelOffset;
      }
      if (widthPixelCount < 1) {
        widthPixelCount = 1;
        offsetColumnBy = -originalSelectAreaWidthPixelOffset;
      }
      originPixelIndex.rowIndex =
        this.capturedOriginalSelectedArea.endPixelIndex.rowIndex;
      originPixelIndex.columnIndex =
        this.capturedOriginalSelectedArea.endPixelIndex.columnIndex;
      originWorldPos.y = this.capturedOriginalSelectedArea.endWorldPos.y;
      originWorldPos.x = this.capturedOriginalSelectedArea.endWorldPos.x;
      modifyPixelHeightRatio =
        heightPixelCount / (originalSelectAreaHeightPixelOffset + 1);
      modifyPixelWidthRatio =
        widthPixelCount / (originalSelectAreaWidthPixelOffset + 1);
      this.setSelectedArea({
        startWorldPos: {
          x:
            this.capturedOriginalSelectedArea.endWorldPos.x -
            widthPixelCount * this.gridSquareLength,
          y:
            this.capturedOriginalSelectedArea.endWorldPos.y -
            heightPixelCount * this.gridSquareLength,
        },
        endWorldPos: this.capturedOriginalSelectedArea.endWorldPos,
        startPixelIndex: {
          rowIndex:
            this.capturedOriginalSelectedArea.endPixelIndex.rowIndex -
            heightPixelCount +
            1,
          columnIndex:
            this.capturedOriginalSelectedArea.endPixelIndex.columnIndex -
            widthPixelCount +
            1,
        },
        endPixelIndex: this.capturedOriginalSelectedArea.endPixelIndex,
      });
    } else if (direction === ButtonDirection.TOPRIGHT) {
      const heightExtensionOffset =
        this.capturedOriginalSelectedArea.startWorldPos.y - extendToCoord.y;
      const widthExtensionOffset =
        extendToCoord.x - this.capturedOriginalSelectedArea.endWorldPos.x;

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
      // we extend the selected area to the top right
      if (heightPixelCount < 1) {
        heightPixelCount = 1;
        offsetRowBy = -originalSelectAreaHeightPixelOffset;
      }
      if (widthPixelCount < 1) {
        widthPixelCount = 1;
        offsetColumnBy = -originalSelectAreaWidthPixelOffset;
      }
      originPixelIndex.rowIndex =
        this.capturedOriginalSelectedArea.endPixelIndex.rowIndex;
      originPixelIndex.columnIndex =
        this.capturedOriginalSelectedArea.startPixelIndex.columnIndex;
      originWorldPos.y = this.capturedOriginalSelectedArea.endWorldPos.y;
      originWorldPos.x = this.capturedOriginalSelectedArea.startWorldPos.x;
      modifyPixelHeightRatio =
        heightPixelCount / (originalSelectAreaHeightPixelOffset + 1);
      modifyPixelWidthRatio =
        widthPixelCount / (originalSelectAreaWidthPixelOffset + 1);
      this.setSelectedArea({
        startWorldPos: {
          x: this.capturedOriginalSelectedArea.startWorldPos.x,
          y:
            this.capturedOriginalSelectedArea.endWorldPos.y -
            heightPixelCount * this.gridSquareLength,
        },
        endWorldPos: {
          x:
            this.capturedOriginalSelectedArea.startWorldPos.x +
            widthPixelCount * this.gridSquareLength,
          y: this.capturedOriginalSelectedArea.endWorldPos.y,
        },
        startPixelIndex: {
          rowIndex:
            this.capturedOriginalSelectedArea.endPixelIndex.rowIndex -
            heightPixelCount +
            1,
          columnIndex:
            this.capturedOriginalSelectedArea.startPixelIndex.columnIndex,
        },
        endPixelIndex: {
          rowIndex: this.capturedOriginalSelectedArea.endPixelIndex.rowIndex,
          columnIndex:
            this.capturedOriginalSelectedArea.startPixelIndex.columnIndex +
            widthPixelCount -
            1,
        },
      });
    } else if (direction === ButtonDirection.BOTTOMLEFT) {
      const heightExtensionOffset =
        extendToCoord.y - this.capturedOriginalSelectedArea.endWorldPos.y;
      const widthExtensionOffset =
        this.capturedOriginalSelectedArea.startWorldPos.x - extendToCoord.x;

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

      // we extend the selected area to the bottom left
      if (heightPixelCount < 1) {
        heightPixelCount = 1;
        offsetRowBy = -originalSelectAreaHeightPixelOffset;
      }
      if (widthPixelCount < 1) {
        widthPixelCount = 1;
        offsetColumnBy = -originalSelectAreaWidthPixelOffset;
      }
      originPixelIndex.rowIndex =
        this.capturedOriginalSelectedArea.startPixelIndex.rowIndex;
      originPixelIndex.columnIndex =
        this.capturedOriginalSelectedArea.endPixelIndex.columnIndex;
      originWorldPos.y = this.capturedOriginalSelectedArea.startWorldPos.y;
      originWorldPos.x = this.capturedOriginalSelectedArea.endWorldPos.x;
      modifyPixelHeightRatio =
        heightPixelCount / (originalSelectAreaHeightPixelOffset + 1);
      modifyPixelWidthRatio =
        widthPixelCount / (originalSelectAreaWidthPixelOffset + 1);
      this.setSelectedArea({
        startWorldPos: {
          x:
            this.capturedOriginalSelectedArea.endWorldPos.x -
            widthPixelCount * this.gridSquareLength,
          y: this.capturedOriginalSelectedArea.startWorldPos.y,
        },
        endWorldPos: {
          x: this.capturedOriginalSelectedArea.endWorldPos.x,
          y:
            this.capturedOriginalSelectedArea.startWorldPos.y +
            heightPixelCount * this.gridSquareLength,
        },
        startPixelIndex: {
          rowIndex: this.capturedOriginalSelectedArea.startPixelIndex.rowIndex,
          columnIndex:
            this.capturedOriginalSelectedArea.endPixelIndex.columnIndex -
            widthPixelCount +
            1,
        },
        endPixelIndex: {
          rowIndex:
            this.capturedOriginalSelectedArea.startPixelIndex.rowIndex +
            heightPixelCount -
            1,
          columnIndex:
            this.capturedOriginalSelectedArea.endPixelIndex.columnIndex,
        },
      });
    } else if (direction === ButtonDirection.BOTTOMRIGHT) {
      const heightExtensionOffset =
        extendToCoord.y - this.capturedOriginalSelectedArea.endWorldPos.y;
      const widthExtensionOffset =
        extendToCoord.x - this.capturedOriginalSelectedArea.endWorldPos.x;
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
      // we extend the selected area to the bottom right
      if (heightPixelCount < 1) {
        heightPixelCount = 1;
        offsetRowBy = -originalSelectAreaHeightPixelOffset;
      }
      if (widthPixelCount < 1) {
        widthPixelCount = 1;
        offsetColumnBy = -originalSelectAreaWidthPixelOffset;
      }
      originPixelIndex.rowIndex =
        this.capturedOriginalSelectedArea.startPixelIndex.rowIndex;
      originPixelIndex.columnIndex =
        this.capturedOriginalSelectedArea.startPixelIndex.columnIndex;
      originWorldPos.y = this.capturedOriginalSelectedArea.startWorldPos.y;
      originWorldPos.x = this.capturedOriginalSelectedArea.startWorldPos.x;
      modifyPixelHeightRatio =
        heightPixelCount / (originalSelectAreaHeightPixelOffset + 1);
      modifyPixelWidthRatio =
        widthPixelCount / (originalSelectAreaWidthPixelOffset + 1);
      this.setSelectedArea({
        startWorldPos: {
          x: this.capturedOriginalSelectedArea.startWorldPos.x,
          y: this.capturedOriginalSelectedArea.startWorldPos.y,
        },
        endWorldPos: {
          x:
            this.capturedOriginalSelectedArea.startWorldPos.x +
            widthPixelCount * this.gridSquareLength,
          y:
            this.capturedOriginalSelectedArea.startWorldPos.y +
            heightPixelCount * this.gridSquareLength,
        },
        startPixelIndex: {
          rowIndex: this.capturedOriginalSelectedArea.startPixelIndex.rowIndex,
          columnIndex:
            this.capturedOriginalSelectedArea.startPixelIndex.columnIndex,
        },
        endPixelIndex: {
          rowIndex:
            this.capturedOriginalSelectedArea.startPixelIndex.rowIndex +
            heightPixelCount -
            1,
          columnIndex:
            this.capturedOriginalSelectedArea.startPixelIndex.columnIndex +
            widthPixelCount -
            1,
        },
      });
    }
    const filteredPixelsToColor = getOverlappingPixelIndicesForModifiedPixels(
      this.capturedOriginalSelectedAreaPixels,
      originPixelIndex,
      originWorldPos,
      modifyPixelWidthRatio,
      modifyPixelHeightRatio,
      this.gridSquareLength,
    ).filter(
      item =>
        !(
          item.columnIndex < this.selectedArea.startPixelIndex.columnIndex ||
          item.columnIndex > this.selectedArea.endPixelIndex.columnIndex ||
          item.rowIndex < this.selectedArea.startPixelIndex.rowIndex ||
          item.rowIndex > this.selectedArea.endPixelIndex.rowIndex
        ),
    );
    this.setExtendingSelectedPixels(filteredPixelsToColor);
    return;
  }

  extendSelectedArea(
    direction: ButtonDirection,
    extendToCoord: Coord,
    isAltPressed: boolean,
  ) {
    if (!this.selectedArea) {
      return;
    }
    if (this.capturedOriginalSelectedArea === null) {
      this.capturedOriginalSelectedArea = this.selectedArea;
    }
    if (this.capturedOriginalSelectedAreaPixels === null) {
      // copy
      this.capturedOriginalSelectedAreaPixels = [...this.selectedAreaPixels];
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
        );
        break;
      case ButtonDirection.TOPRIGHT:
        this.extendSelectedAreaDiagonally(
          ButtonDirection.TOPRIGHT,
          extendToCoord,
        );
        break;
      case ButtonDirection.BOTTOMLEFT:
        this.extendSelectedAreaDiagonally(
          ButtonDirection.BOTTOMLEFT,
          extendToCoord,
        );
        break;
      case ButtonDirection.BOTTOMRIGHT:
        this.extendSelectedAreaDiagonally(
          ButtonDirection.BOTTOMRIGHT,
          extendToCoord,
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
      addRowToData(this.capturedData, newRowIndex);
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
      addColumnToData(this.capturedData, newColumnIndex);
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
      if (rowCount <= this.minimumCount) {
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
      if (columnCount <= this.minimumCount) {
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
      item => item.color == "",
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
    if (this.hoveredPixel === null) {
      return;
    }
    const ctx = this.ctx;
    const { rowIndex, columnIndex } = this.hoveredPixel;
    const relativeRowIndex = this.rowKeyOrderMap.get(rowIndex);
    const relativeColumnIndex = this.columnKeyOrderMap.get(columnIndex);
    if (relativeRowIndex === undefined || relativeColumnIndex === undefined) {
      return;
    }
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.clearRect(
      relativeColumnIndex * squareLength + correctedLeftTopScreenPoint.x,
      relativeRowIndex * squareLength + correctedLeftTopScreenPoint.y,
      squareLength,
      squareLength,
    );
    ctx.fillStyle = this.hoveredPixel.color;
    ctx.fillRect(
      relativeColumnIndex * squareLength + correctedLeftTopScreenPoint.x,
      relativeRowIndex * squareLength + correctedLeftTopScreenPoint.y,
      squareLength,
      squareLength,
    );
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
    const doesCapturedDataExist = this.capturedData !== null;
    const rowCount = doesCapturedDataExist
      ? getRowCountFromData(this.capturedData)
      : this.dataLayerRowCount;
    const columnCount = doesCapturedDataExist
      ? getColumnCountFromData(this.capturedData)
      : this.dataLayerColumnCount;
    const leftTopPoint: Coord = {
      x: -((columnCount / 2) * this.gridSquareLength),
      y: -((rowCount / 2) * this.gridSquareLength),
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
    this.renderStrokedPixels(correctedLeftTopScreenPoint, squareLength);
    this.renderErasedPixels(correctedLeftTopScreenPoint, squareLength);
    this.renderIndicatorPixels(correctedLeftTopScreenPoint, squareLength);
    //draw indicator pixels on top of the canvas
    this.renderHoveredPixel(correctedLeftTopScreenPoint, squareLength);
    this.renderMovingSelectedPixels(correctedLeftTopScreenPoint, squareLength);
    this.renderExtendingSelectedPixels(
      correctedLeftTopScreenPoint,
      squareLength,
    );
  }
}
