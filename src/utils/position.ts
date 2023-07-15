import { addPoints, diffPoints, getScreenPoint, getWorldPoint } from "./math";
import { TouchyEvent } from "./touch";
import { Coord, PanZoom } from "./types";
import { ColorChangeItem } from "../components/Canvas/types";

export const getPointFromTouchyEvent = (
  evt: TouchyEvent,
  element: HTMLCanvasElement,
  panZoom: PanZoom,
) => {
  let originY;
  let originX;
  let offsetX;
  let offsetY;
  if (window.TouchEvent && evt instanceof TouchEvent) {
    //this is for tablet or mobile
    let isCanvasTouchIncluded = false;
    let firstCanvasTouchIndex = 0;
    for (let i = 0; i < evt.touches.length; i++) {
      const target = evt.touches.item(i)!.target;
      if (target instanceof HTMLCanvasElement) {
        isCanvasTouchIncluded = true;
        firstCanvasTouchIndex = i;
        break;
      }
    }
    if (isCanvasTouchIncluded) {
      return getPointFromTouch(
        evt.touches[firstCanvasTouchIndex],
        element,
        panZoom,
      );
    } else {
      return getPointFromTouch(evt.touches[0], element, panZoom);
    }
  } else {
    //this is for PC
    originY = evt.clientY;
    originX = evt.clientX;
    offsetX = evt.offsetX;
    offsetY = evt.offsetY;
  }
  originY += window.scrollY;
  originX += window.scrollX;
  return {
    y: originY - panZoom.offset.y,
    x: originX - panZoom.offset.x,
    offsetX: offsetX,
    offsetY: offsetY,
  };
};

export const getPointFromTouch = (
  touch: Touch,
  element: HTMLCanvasElement,
  panZoom: PanZoom,
) => {
  const r = element.getBoundingClientRect();
  const originY = touch.clientY;
  const originX = touch.clientX;
  const offsetX = touch.clientX - r.left;
  const offsetY = touch.clientY - r.top;
  return {
    x: originX - panZoom.offset.x,
    y: originY - panZoom.offset.y,
    offsetX: offsetX,
    offsetY: offsetY,
  };
};

export const calculateNewPanZoomFromPinchZoom = (
  evt: TouchyEvent,
  element: HTMLCanvasElement,
  panZoom: PanZoom,
  zoomSensitivity: number,
  prevPinchZoomDiff: number | null,
  minScale: number,
  maxScale: number,
): { pinchZoomDiff: number; panZoom: PanZoom } => {
  evt.preventDefault();
  if (window.TouchEvent && evt instanceof TouchEvent) {
    const touchCount = evt.touches.length;
    if (touchCount < 2) {
      return;
    }
    const canvasTouchEventIndexes = [];
    for (let i = 0; i < touchCount; i++) {
      const target = evt.touches.item(i)!.target;
      if (target instanceof HTMLCanvasElement) {
        canvasTouchEventIndexes.push(i);
      }
    }
    if (canvasTouchEventIndexes.length !== 2) {
      return;
    }
    const firstTouch = evt.touches[canvasTouchEventIndexes[0]];
    const secondTouch = evt.touches[canvasTouchEventIndexes[1]];
    const pinchZoomCurrentDiff =
      Math.abs(firstTouch.clientX - secondTouch.clientX) +
      Math.abs(firstTouch.clientY - secondTouch.clientY);
    const firstTouchPoint = getPointFromTouch(firstTouch, element, panZoom);
    const secondTouchPoint = getPointFromTouch(secondTouch, element, panZoom);
    const touchCenterPos = {
      x: (firstTouchPoint.offsetX + secondTouchPoint.offsetX) / 2,
      y: (firstTouchPoint.offsetY + secondTouchPoint.offsetY) / 2,
    };

    if (!prevPinchZoomDiff) {
      return { pinchZoomDiff: pinchZoomCurrentDiff, panZoom };
    }

    const deltaX = prevPinchZoomDiff - pinchZoomCurrentDiff;
    const zoom = 1 - (deltaX * 2) / zoomSensitivity;
    const newScale = panZoom.scale * zoom;
    if (minScale > newScale || newScale > maxScale) {
      return;
    }
    const worldPos = getWorldPoint(touchCenterPos, {
      scale: panZoom.scale,
      offset: panZoom.offset,
    });
    const newTouchCenterPos = getScreenPoint(worldPos, {
      scale: newScale,
      offset: panZoom.offset,
    });
    const scaleOffset = diffPoints(touchCenterPos, newTouchCenterPos);
    const offset = addPoints(panZoom.offset, scaleOffset);
    return {
      pinchZoomDiff: pinchZoomCurrentDiff,
      panZoom: { scale: newScale, offset },
    };
  } else {
    return null;
  }
};

export const getMouseCartCoord = (
  evt: TouchyEvent,
  element: HTMLCanvasElement,
  panZoom: PanZoom,
  dpr: number,
) => {
  evt.preventDefault();
  const point = getPointFromTouchyEvent(evt, element, panZoom);
  const pointCoord = { x: point.offsetX, y: point.offsetY };
  const diffPointsOfMouseOffset = getWorldPoint(pointCoord, panZoom);
  const mouseCartCoord = diffPoints(diffPointsOfMouseOffset, {
    x: element.width / dpr / 2,
    y: element.height / dpr / 2,
  });
  return mouseCartCoord;
};

export const getPixelIndexFromMouseCartCoord = (
  mouseCartCoord: Coord,
  rowCount: number,
  columnCount: number,
  gridSquareLength: number,
  currentTopIndex: number,
  currentLeftIndex: number,
) => {
  const leftTopPoint: Coord = {
    x: -((columnCount / 2) * gridSquareLength),
    y: -((rowCount / 2) * gridSquareLength),
  };
  if (
    mouseCartCoord.x > leftTopPoint.x &&
    mouseCartCoord.x < leftTopPoint.x + columnCount * gridSquareLength &&
    mouseCartCoord.y > leftTopPoint.y &&
    mouseCartCoord.y < leftTopPoint.y + rowCount * gridSquareLength
  ) {
    // The above conditions are to check if the mouse is in the grid
    const rowOffset = Math.floor(
      (mouseCartCoord.y - leftTopPoint.y) / gridSquareLength,
    );
    const columnOffset = Math.floor(
      (mouseCartCoord.x - leftTopPoint.x) / gridSquareLength,
    );
    return {
      rowIndex: currentTopIndex + rowOffset,
      columnIndex: currentLeftIndex + columnOffset,
    };
  }
  return null;
};

export const getIsPointInsideRegion = (
  point: Coord,
  area: { startWorldPos: Coord; endWorldPos: Coord },
) => {
  const { areaTopLeftPos, areaBottomRightPos } =
    getAreaTopLeftAndBottomRight(area);

  return (
    point.x >= areaTopLeftPos.x &&
    point.x <= areaBottomRightPos.x &&
    point.y >= areaTopLeftPos.y &&
    point.y <= areaBottomRightPos.y
  );
};

export const getDoesAreaOverlapPixelgrid = (
  area: { startWorldPos: Coord; endWorldPos: Coord } | null,
  rowCount: number,
  columnCount: number,
  gridSquareLength: number,
) => {
  if (!area) return false;
  const { areaTopLeftPos, areaBottomRightPos } =
    getAreaTopLeftAndBottomRight(area);

  const pixelGridLeftTopPoint: Coord = {
    x: -((columnCount / 2) * gridSquareLength),
    y: -((rowCount / 2) * gridSquareLength),
  };
  const pixelGridRightBottomPoint: Coord = {
    x: (columnCount / 2) * gridSquareLength,
    y: (rowCount / 2) * gridSquareLength,
  };
  return (
    areaTopLeftPos.x <= pixelGridRightBottomPoint.x ||
    areaTopLeftPos.y <= pixelGridRightBottomPoint.y ||
    areaBottomRightPos.x >= pixelGridLeftTopPoint.x ||
    areaBottomRightPos.y >= pixelGridLeftTopPoint.y
  );
};

export const getAreaTopLeftAndBottomRight = (area: {
  startWorldPos: Coord;
  endWorldPos: Coord;
}) => {
  const isAreaFromLeftToRight = area.startWorldPos.x < area.endWorldPos.x;
  const isAreaFromTopToBottom = area.startWorldPos.y < area.endWorldPos.y;
  // To ease the algorithm, we will first identify the left top, right top, left bottom and right bottom points

  const areaTopLeftPos = {
    x: isAreaFromLeftToRight ? area.startWorldPos.x : area.endWorldPos.x,
    y: isAreaFromTopToBottom ? area.startWorldPos.y : area.endWorldPos.y,
  };
  const areaBottomRightPos = {
    x: isAreaFromLeftToRight ? area.endWorldPos.x : area.startWorldPos.x,
    y: isAreaFromTopToBottom ? area.endWorldPos.y : area.startWorldPos.y,
  };
  return { areaTopLeftPos, areaBottomRightPos };
};

export const convertWorldPosAreaToPixelGridArea = (
  selectingArea: { startWorldPos: Coord; endWorldPos: Coord },
  rowCount: number,
  columnCount: number,
  gridSquareLength: number,
  rowKeysInOrder: number[],
  columnKeysInOrder: number[],
) => {
  const { areaTopLeftPos, areaBottomRightPos } =
    getAreaTopLeftAndBottomRight(selectingArea);

  const pixelGridLeftTopPoint: Coord = {
    x: -((columnCount / 2) * gridSquareLength),
    y: -((rowCount / 2) * gridSquareLength),
  };
  const selectedRegionTopLeft: Coord = {
    x: 0,
    y: 0,
  };
  const selectedRegionBottomRight: Coord = {
    x: 0,
    y: 0,
  };
  // leftTopPoint is the the left top point of the grid
  const selectedAreaLeftOffsetAmount =
    areaTopLeftPos.x - pixelGridLeftTopPoint.x;
  // if selectedAreaLeftOffsetAmount is negative, then the selected area's left part is outside the grid
  if (selectedAreaLeftOffsetAmount < 0) {
    selectedRegionTopLeft.x = pixelGridLeftTopPoint.x;
  } else {
    if (selectedAreaLeftOffsetAmount > columnCount * gridSquareLength) {
      return null;
    }
    selectedRegionTopLeft.x =
      pixelGridLeftTopPoint.x +
      Math.floor(selectedAreaLeftOffsetAmount / gridSquareLength) *
        gridSquareLength;
  }
  // if selectedAreaTopOffsetAmount is negative, then the selected area's top part is outside the grid
  const selectedAreaTopOffsetAmount =
    areaTopLeftPos.y - pixelGridLeftTopPoint.y;
  if (selectedAreaTopOffsetAmount < 0) {
    selectedRegionTopLeft.y = pixelGridLeftTopPoint.y;
  } else {
    if (selectedAreaTopOffsetAmount > rowCount * gridSquareLength) {
      return null;
    }
    selectedRegionTopLeft.y =
      pixelGridLeftTopPoint.y +
      Math.floor(selectedAreaTopOffsetAmount / gridSquareLength) *
        gridSquareLength;
  }

  // if selectedAreaRightOffsetAmount is positive, then the selected area's right part is outside the grid
  const selectedAreaRightOffsetAmount =
    areaBottomRightPos.x -
    (pixelGridLeftTopPoint.x + columnCount * gridSquareLength);

  if (selectedAreaRightOffsetAmount > 0) {
    selectedRegionBottomRight.x =
      pixelGridLeftTopPoint.x + columnCount * gridSquareLength;
  } else {
    if (selectedAreaRightOffsetAmount < -columnCount * gridSquareLength) {
      return null;
    }
    selectedRegionBottomRight.x =
      pixelGridLeftTopPoint.x +
      columnCount * gridSquareLength +
      Math.ceil(selectedAreaRightOffsetAmount / gridSquareLength) *
        gridSquareLength;
  }

  // if selectedAreaBottomOffsetAmount is positive, then the selected area's bottom part is outside the grid
  const selectedAreaBottomOffsetAmount =
    areaBottomRightPos.y -
    (pixelGridLeftTopPoint.y + rowCount * gridSquareLength);
  if (selectedAreaBottomOffsetAmount > 0) {
    selectedRegionBottomRight.y =
      pixelGridLeftTopPoint.y + rowCount * gridSquareLength;
  } else {
    if (selectedAreaBottomOffsetAmount < -rowCount * gridSquareLength) {
      return null;
    }
    selectedRegionBottomRight.y =
      pixelGridLeftTopPoint.y +
      rowCount * gridSquareLength +
      Math.ceil(selectedAreaBottomOffsetAmount / gridSquareLength) *
        gridSquareLength;
  }
  const relativeTopLeftRowIndex = Math.floor(
    (selectedRegionTopLeft.y - pixelGridLeftTopPoint.y) / gridSquareLength,
  );
  const relativeTopLeftColumnIndex = Math.floor(
    (selectedRegionTopLeft.x - pixelGridLeftTopPoint.x) / gridSquareLength,
  );
  const relativeBottomRightRowIndex = Math.floor(
    (selectedRegionBottomRight.y - pixelGridLeftTopPoint.y) / gridSquareLength,
  );
  const relativeBottomRightColumnIndex = Math.floor(
    (selectedRegionBottomRight.x - pixelGridLeftTopPoint.x) / gridSquareLength,
  );
  const includedPixelsIndices: Array<{
    rowIndex: number;
    columnIndex: number;
  }> = [];

  for (let i = relativeTopLeftRowIndex; i < relativeBottomRightRowIndex; i++) {
    for (
      let j = relativeTopLeftColumnIndex;
      j < relativeBottomRightColumnIndex;
      j++
    ) {
      includedPixelsIndices.push({
        rowIndex: rowKeysInOrder[i],
        columnIndex: columnKeysInOrder[j],
      });
    }
  }
  return {
    startWorldPos: selectedRegionTopLeft,
    endWorldPos: selectedRegionBottomRight,
    includedPixelsIndices,
  };
};

export const returnScrollOffsetFromMouseOffset = (
  mouseOffset: Coord,
  panZoom: PanZoom,
  newScale: number,
) => {
  const worldPos = getWorldPoint(mouseOffset, panZoom);
  const newMousePos = getScreenPoint(worldPos, {
    scale: newScale,
    offset: panZoom.offset,
  });
  const scaleOffset = diffPoints(mouseOffset, newMousePos);
  const offset = addPoints(panZoom.offset, scaleOffset);

  return offset;
};

/**
 * @summary it will return world pos relative to originpixel word pos, the origin will be set to 0,0
 * @param pixelIndex - the pixelIndex passed as a parameter should be an integer
 */
export const getRelativeCornerWordPosOfPixelToOrigin = (
  // the pixelIndex passed as a parameter should be an integer
  pixelIndex: {
    rowIndex: number;
    columnIndex: number;
  },
  originPixelIndex: { rowIndex: number; columnIndex: number },
  gridSquareLength: number,
) => {
  // it will return world pos relative to originpixel word pos
  // the origin will be set to 0,0

  return {
    topLeft: {
      x:
        (pixelIndex.columnIndex - originPixelIndex.columnIndex) *
        gridSquareLength,
      y: (pixelIndex.rowIndex - originPixelIndex.rowIndex) * gridSquareLength,
    },
    topRight: {
      x:
        (pixelIndex.columnIndex - originPixelIndex.columnIndex + 1) *
        gridSquareLength,
      y: (pixelIndex.rowIndex - originPixelIndex.rowIndex) * gridSquareLength,
    },
    bottomLeft: {
      x:
        (pixelIndex.columnIndex - originPixelIndex.columnIndex) *
        gridSquareLength,
      y:
        (pixelIndex.rowIndex - originPixelIndex.rowIndex + 1) *
        gridSquareLength,
    },
    bottomRight: {
      x:
        (pixelIndex.columnIndex - originPixelIndex.columnIndex + 1) *
        gridSquareLength,
      y:
        (pixelIndex.rowIndex - originPixelIndex.rowIndex + 1) *
        gridSquareLength,
    },
  };
};

/**
 * @summary it will return the pixel indices of the corner pixels of the specific pixel
 * @param pixelIndex - the specific pixel index
 * @param halvedHeight - the halvedHeight of the pixel
 * @param halvedWidth - the halvedWidth of the pixel
 */
export const getCornerPixelIndices = (
  // the pixelIndex passed as a parameter should be an integer
  centerPixelIndex: {
    rowIndex: number;
    columnIndex: number;
  },
  halvedHeight: number,
  halvedWidth: number,
) => {
  const baseCenterPixelIndex = {
    rowIndex: Math.floor(centerPixelIndex.rowIndex) + 0.5,
    columnIndex: Math.floor(centerPixelIndex.columnIndex) + 0.5,
  };
  return {
    topLeft: {
      rowIndex: Math.floor(baseCenterPixelIndex.rowIndex - halvedHeight),
      columnIndex: Math.round(baseCenterPixelIndex.columnIndex - halvedWidth),
    },
    topRight: {
      rowIndex: Math.floor(baseCenterPixelIndex.rowIndex - halvedHeight),
      columnIndex: Math.ceil(baseCenterPixelIndex.columnIndex + halvedWidth),
    },
    bottomLeft: {
      rowIndex: Math.ceil(baseCenterPixelIndex.rowIndex + halvedHeight),
      columnIndex: Math.floor(baseCenterPixelIndex.columnIndex - halvedWidth),
    },
    bottomRight: {
      rowIndex: Math.ceil(baseCenterPixelIndex.rowIndex + halvedHeight),
      columnIndex: Math.ceil(baseCenterPixelIndex.columnIndex + halvedWidth),
    },
  };
};

/**
 * @summary it will return the overlapping pixel indices of the pixels for an extended selected area
 * @param originalPixels - the original pixels
 * @param originPixelIndex - the origin pixel index
 * @param modifyPixelWidthRatio - the ratio of the width of the modified pixel to the original pixel
 * @param modifyPixelHeightRatio - the ratio of the height of the modified pixel to the original pixel
 * @param gridSquareLength - the length of the grid square
 * @returns the pixel indices of the overlapping pixels
 */
export const getOverlappingPixelIndicesForModifiedPixels = (
  originalPixels: Array<ColorChangeItem>,
  originPixelIndex: { rowIndex: number; columnIndex: number },
  modifyPixelWidthRatio: number,
  modifyPixelHeightRatio: number,
  gridSquareLength: number,
) => {
  const pixelsToColor: Array<ColorChangeItem> = [];
  for (const item of originalPixels) {
    const pixelDistanceFromOrigin = {
      rowOffset: item.rowIndex - originPixelIndex.rowIndex,
      columnOffset: item.columnIndex - originPixelIndex.columnIndex,
    };
    const pixelWordPosOffset = {
      x: pixelDistanceFromOrigin.columnOffset * gridSquareLength,
      y: pixelDistanceFromOrigin.rowOffset * gridSquareLength,
    };
    const cornerWorldPos = {
      topLeft: {
        x: pixelWordPosOffset.x * modifyPixelWidthRatio,
        y: pixelWordPosOffset.y * modifyPixelHeightRatio,
      },
      topRight: {
        x: (pixelWordPosOffset.x + gridSquareLength) * modifyPixelWidthRatio,
        y: pixelWordPosOffset.y * modifyPixelHeightRatio,
      },
      bottomLeft: {
        x: pixelWordPosOffset.x * modifyPixelWidthRatio,
        y: (pixelWordPosOffset.y + gridSquareLength) * modifyPixelHeightRatio,
      },
      bottomRight: {
        x: (pixelWordPosOffset.x + gridSquareLength) * modifyPixelWidthRatio,
        y: (pixelWordPosOffset.y + gridSquareLength) * modifyPixelHeightRatio,
      },
    };
    for (
      let i = cornerWorldPos.topLeft.x;
      i < cornerWorldPos.topRight.x;
      i += gridSquareLength
    ) {
      for (
        let j = cornerWorldPos.topLeft.y;
        j < cornerWorldPos.bottomLeft.y;
        j += gridSquareLength
      ) {
        const pixelIndex = {
          rowIndex: Math.round(
            originPixelIndex.rowIndex + Math.floor(j / gridSquareLength),
          ),
          columnIndex: Math.round(
            originPixelIndex.columnIndex + Math.floor(i / gridSquareLength),
          ),
          color: item.color,
          previousColor: item.previousColor,
        };
        // console.log(originPixelIndex, "originPixelIndex");
        // console.log(
        //   pixelIndex,

        //   "pixelIndex",
        // );
        pixelsToColor.push(pixelIndex);
      }
    }
  }
  return pixelsToColor;
};
