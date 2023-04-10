import { ColorChangeItem } from "../components/Canvas/types";
import { generatePixelId, parsePixelId } from "../utils/identifier";

/**
 * This class is used to record the changes of pixels.
 * It will record the changes of pixels and record the changes in two arrays: rawChanges and effectiveChanges.
 *
 * `getRawChanges()`returns an array that recorded all the changes of pixels whether or not the pixel has been already changed.
 *
 * `getEffectiveChanges()` returns an array of changes that will later be applied to the canvas.
 */
export class PixelChangeRecords {
  private rawChanges: Array<ColorChangeItem>;
  private effectiveChangesMap: Map<
    string,
    {
      color: string;
      previousColor: string;
    }
  >;

  constructor() {
    this.rawChanges = [];
    this.effectiveChangesMap = new Map();
  }

  record(pixel: ColorChangeItem) {
    if (this.rawChanges.length > 0) {
      const mostRecentRawChange = this.rawChanges[this.rawChanges.length - 1];
      if (
        !(
          mostRecentRawChange.rowIndex === pixel.rowIndex &&
          mostRecentRawChange.columnIndex === pixel.columnIndex &&
          mostRecentRawChange.color === pixel.color &&
          mostRecentRawChange.previousColor === pixel.previousColor
        )
      ) {
        this.rawChanges.push(pixel);
      }
    } else {
      this.rawChanges.push(pixel);
    }

    const { rowIndex, columnIndex, color, previousColor } = pixel;
    const pixelId = generatePixelId(rowIndex, columnIndex);
    if (!this.effectiveChangesMap.has(pixelId)) {
      this.effectiveChangesMap.set(pixelId, {
        color,
        previousColor,
      });
    } else {
      const originalPreviousColor =
        this.effectiveChangesMap.get(pixelId).previousColor;
      console.log(originalPreviousColor);
      this.effectiveChangesMap.set(pixelId, {
        color,
        previousColor: originalPreviousColor,
      });
    }
  }

  reset() {
    this.rawChanges = [];
    this.effectiveChangesMap = new Map();
  }

  getIsChanged(): boolean {
    return this.effectiveChangesMap.size > 0;
  }

  getRawChanges(): Array<ColorChangeItem> {
    return this.rawChanges;
  }

  getEffectiveChanges(): Array<ColorChangeItem> {
    const result: Array<ColorChangeItem> = [];
    // map will be converted to array
    // foreach will preserve the order of the map
    // the items of the map will be ordered by the order of their insertion
    this.effectiveChangesMap.forEach((item, pixelId) => {
      const { rowIndex, columnIndex } = parsePixelId(pixelId);
      result.push({
        rowIndex: rowIndex,
        columnIndex: columnIndex,
        color: item.color,
        previousColor: item.previousColor,
      });
    });
    return result;
  }
}
