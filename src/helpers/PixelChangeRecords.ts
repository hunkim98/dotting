import { ColorChangeItem } from "../components/Canvas/types";

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
    number,
    Map<
      number,
      {
        color: string;
        previousColor: string;
      }
    >
  >;

  constructor() {
    this.rawChanges = [];
    this.effectiveChangesMap = new Map();
  }

  record(pixel: ColorChangeItem) {
    if (this.rawChanges.length > 0) {
      const mostRecentRawChange = this.rawChanges[this.rawChanges.length - 1];
      if (
        mostRecentRawChange.rowIndex === pixel.rowIndex &&
        mostRecentRawChange.columnIndex === pixel.columnIndex &&
        mostRecentRawChange.color === pixel.color &&
        mostRecentRawChange.previousColor === pixel.previousColor
      ) {
        this.rawChanges.pop();
      }
    } else {
      this.rawChanges.push(pixel);
    }

    const { rowIndex, columnIndex, color, previousColor } = pixel;
    if (!this.effectiveChangesMap.has(rowIndex)) {
      this.effectiveChangesMap.set(rowIndex, new Map());
      this.effectiveChangesMap.get(rowIndex).set(columnIndex, {
        color,
        previousColor,
      });
    } else {
      if (!this.effectiveChangesMap.get(rowIndex).has(columnIndex)) {
        const originalPreviousColor = this.effectiveChangesMap
          .get(rowIndex)
          .get(columnIndex).previousColor;
        this.effectiveChangesMap.get(rowIndex).set(columnIndex, {
          color,
          previousColor: originalPreviousColor,
        });
      } else {
        this.effectiveChangesMap.get(rowIndex).set(columnIndex, {
          color,
          previousColor: previousColor,
        });
      }
    }
  }

  getRawChanges(): Array<ColorChangeItem> {
    return this.rawChanges;
  }

  getEffectiveChanges(): Array<ColorChangeItem> {
    const result: Array<ColorChangeItem> = [];
    Array.from(this.effectiveChangesMap.entries()).forEach(
      ([rowIndex, rowMap]) => {
        Array.from(rowMap.entries()).forEach(([columnIndex, item]) => {
          result.push({
            rowIndex,
            columnIndex,
            color: item.color,
            previousColor: item.previousColor,
          });
        });
      },
    );
    return result;
  }
}
