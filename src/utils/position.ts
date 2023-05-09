import { addPoints, diffPoints, getScreenPoint, getWorldPoint } from "./math";
import { TouchyEvent } from "./touch";
import { Coord, PanZoom } from "./types";

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
  const selectedAreaTopLeft = {
    x: 0,
    y: 0,
  };
  const selectedAreaBottomRight = {
    x: 0,
    y: 0,
  };
  let isSelectedFromLeftToRight = true;
  if (area.startWorldPos.x > area.endWorldPos.x) {
    isSelectedFromLeftToRight = false;
  }
  let isSelectedFromTopToBottom = true;
  if (area.startWorldPos.y > area.endWorldPos.y) {
    isSelectedFromTopToBottom = false;
  }
  if (isSelectedFromLeftToRight && isSelectedFromTopToBottom) {
    // start from left top end at right bottom
    selectedAreaTopLeft.x = area.startWorldPos.x;
    selectedAreaTopLeft.y = area.startWorldPos.y;
    selectedAreaBottomRight.x = area.endWorldPos.x;
    selectedAreaBottomRight.y = area.endWorldPos.y;
  } else if (isSelectedFromLeftToRight && !isSelectedFromTopToBottom) {
    // start from left bottom end at right top
    selectedAreaTopLeft.x = area.startWorldPos.x;
    selectedAreaTopLeft.y = area.endWorldPos.y;
    selectedAreaBottomRight.x = area.endWorldPos.x;
    selectedAreaBottomRight.y = area.startWorldPos.y;
  } else if (!isSelectedFromLeftToRight && isSelectedFromTopToBottom) {
    // start from right top end at left bottom
    selectedAreaTopLeft.x = area.endWorldPos.x;
    selectedAreaTopLeft.y = area.startWorldPos.y;
    selectedAreaBottomRight.x = area.startWorldPos.x;
    selectedAreaBottomRight.y = area.endWorldPos.y;
  } else {
    // start from right bottom end at left top
    selectedAreaTopLeft.x = area.endWorldPos.x;
    selectedAreaTopLeft.y = area.endWorldPos.y;
    selectedAreaBottomRight.x = area.startWorldPos.x;
    selectedAreaBottomRight.y = area.startWorldPos.y;
  }

  return (
    point.x >= selectedAreaTopLeft.x &&
    point.x <= selectedAreaBottomRight.x &&
    point.y >= selectedAreaTopLeft.y &&
    point.y <= selectedAreaBottomRight.y
  );
};

export const convertSelectingAreaToPixelGridArea = (
  selectingArea: { startWorldPos: Coord; endWorldPos: Coord },
  rowCount: number,
  columnCount: number,
  gridSquareLength: number,
  rowKeysInOrder: number[],
  columnKeysInOrder: number[],
) => {
  const pixelGridLeftTopPoint: Coord = {
    x: -((columnCount / 2) * gridSquareLength),
    y: -((rowCount / 2) * gridSquareLength),
  };
  const isSelectedFromLeftToRight = !(
    selectingArea.startWorldPos.x > selectingArea.endWorldPos.x
  );
  const isSelectedFromTopToBottom = !(
    selectingArea.startWorldPos.y > selectingArea.endWorldPos.y
  );
  // To ease the algorithm, we will first identify the left top, right top, left bottom and right bottom points

  const selectedAreaTopLeft = {
    x: isSelectedFromLeftToRight
      ? selectingArea.startWorldPos.x
      : selectingArea.endWorldPos.x,
    y: isSelectedFromTopToBottom
      ? selectingArea.startWorldPos.y
      : selectingArea.endWorldPos.y,
  };
  const selectedAreaBottomRight = {
    x: isSelectedFromLeftToRight
      ? selectingArea.endWorldPos.x
      : selectingArea.startWorldPos.x,
    y: isSelectedFromTopToBottom
      ? selectingArea.endWorldPos.y
      : selectingArea.startWorldPos.y,
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
    selectedAreaTopLeft.x - pixelGridLeftTopPoint.x;
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
    selectedAreaTopLeft.y - pixelGridLeftTopPoint.y;
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
    selectedAreaBottomRight.x -
    pixelGridLeftTopPoint.x +
    columnCount * gridSquareLength;

  if (selectedAreaRightOffsetAmount > 0) {
    selectedRegionBottomRight.x =
      pixelGridLeftTopPoint.x + columnCount * gridSquareLength;
  } else {
    if (selectedAreaRightOffsetAmount < -columnCount * gridSquareLength) {
      return null;
    }
    selectedRegionBottomRight.x =
      pixelGridLeftTopPoint.x +
      Math.ceil(selectedAreaRightOffsetAmount / gridSquareLength) *
        gridSquareLength;
  }

  // if selectedAreaBottomOffsetAmount is positive, then the selected area's bottom part is outside the grid
  const selectedAreaBottomOffsetAmount =
    selectedAreaBottomRight.y -
    pixelGridLeftTopPoint.y +
    rowCount * gridSquareLength;
  if (selectedAreaBottomOffsetAmount > 0) {
    selectedRegionBottomRight.y =
      pixelGridLeftTopPoint.y + rowCount * gridSquareLength;
  } else {
    if (selectedAreaBottomOffsetAmount < -rowCount * gridSquareLength) {
      return null;
    }
    selectedRegionBottomRight.y =
      pixelGridLeftTopPoint.y +
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
