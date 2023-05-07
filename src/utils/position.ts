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

export const getSelectedPixelRegion = (
  selectingArea: { startWorldPos: Coord; endWorldPos: Coord },
  rowCount: number,
  columnCount: number,
  gridSquareLength: number,
) => {
  const leftTopPoint: Coord = {
    x: -((columnCount / 2) * gridSquareLength),
    y: -((rowCount / 2) * gridSquareLength),
  };
  let isSelectedFromLeftToRight = true;
  if (selectingArea.startWorldPos.x > selectingArea.endWorldPos.x) {
    isSelectedFromLeftToRight = false;
  }
  let isSelectedFromTopToBottom = true;
  if (selectingArea.startWorldPos.y > selectingArea.endWorldPos.y) {
    isSelectedFromTopToBottom = false;
  }
  const selectedRegionTopLeft: Coord = {
    x: 0,
    y: 0,
  };
  const selectedRegionBottomRight: Coord = {
    x: 0,
    y: 0,
  };
  const selectedAreaTopLeft = {
    x: 0,
    y: 0,
  };
  const selectedAreaBottomRight = {
    x: 0,
    y: 0,
  };
  if (isSelectedFromLeftToRight && isSelectedFromTopToBottom) {
    // start from left top end at right bottom
    selectedAreaTopLeft.x = selectingArea.startWorldPos.x;
    selectedAreaTopLeft.y = selectingArea.startWorldPos.y;
    selectedAreaBottomRight.x = selectingArea.endWorldPos.x;
    selectedAreaBottomRight.y = selectingArea.endWorldPos.y;
  } else if (isSelectedFromLeftToRight && !isSelectedFromTopToBottom) {
    // start from left bottom end at right top
    selectedAreaTopLeft.x = selectingArea.startWorldPos.x;
    selectedAreaTopLeft.y = selectingArea.endWorldPos.y;
    selectedAreaBottomRight.x = selectingArea.endWorldPos.x;
    selectedAreaBottomRight.y = selectingArea.startWorldPos.y;
  } else if (!isSelectedFromLeftToRight && isSelectedFromTopToBottom) {
    // start from right top end at left bottom
    selectedAreaTopLeft.x = selectingArea.endWorldPos.x;
    selectedAreaTopLeft.y = selectingArea.startWorldPos.y;
    selectedAreaBottomRight.x = selectingArea.startWorldPos.x;
    selectedAreaBottomRight.y = selectingArea.endWorldPos.y;
  } else {
    // start from right bottom end at left top
    selectedAreaTopLeft.x = selectingArea.endWorldPos.x;
    selectedAreaTopLeft.y = selectingArea.endWorldPos.y;
    selectedAreaBottomRight.x = selectingArea.startWorldPos.x;
    selectedAreaBottomRight.y = selectingArea.startWorldPos.y;
  }
  const startDistanceFromLeft = selectedAreaTopLeft.x - leftTopPoint.x;
  const startDistanceFromTop = selectedAreaTopLeft.y - leftTopPoint.y;
  if (startDistanceFromLeft < 0) {
    selectedRegionTopLeft.x = leftTopPoint.x;
  } else {
    if (startDistanceFromLeft > columnCount * gridSquareLength) {
      return null;
    }
    selectedRegionTopLeft.x =
      leftTopPoint.x +
      Math.floor(startDistanceFromLeft / gridSquareLength) * gridSquareLength;
  }
  if (startDistanceFromTop < 0) {
    selectedRegionTopLeft.y = leftTopPoint.y;
  } else {
    if (startDistanceFromTop > rowCount * gridSquareLength) {
      return null;
    }
    selectedRegionTopLeft.y =
      leftTopPoint.y +
      Math.floor(startDistanceFromTop / gridSquareLength) * gridSquareLength;
  }

  const endDistanceFromLeft = selectedAreaBottomRight.x - leftTopPoint.x;
  const endDistanceFromTop = selectedAreaBottomRight.y - leftTopPoint.y;
  if (endDistanceFromLeft > columnCount * gridSquareLength) {
    selectedRegionBottomRight.x =
      leftTopPoint.x + columnCount * gridSquareLength;
  } else {
    if (endDistanceFromLeft < 0) {
      return null;
    }
    selectedRegionBottomRight.x =
      leftTopPoint.x +
      Math.ceil(endDistanceFromLeft / gridSquareLength) * gridSquareLength;
  }
  if (endDistanceFromTop > rowCount * gridSquareLength) {
    selectedRegionBottomRight.y = leftTopPoint.y + rowCount * gridSquareLength;
  } else {
    if (endDistanceFromTop < 0) {
      return null;
    }
    selectedRegionBottomRight.y =
      leftTopPoint.y +
      Math.ceil(endDistanceFromTop / gridSquareLength) * gridSquareLength;
  }
  const includedPixelsIndices: Array<{
    rowIndex: number;
    columnIndex: number;
  }> = [];
  for (
    let rowIndex = 0;
    rowIndex < rowCount;
    rowIndex = rowIndex + gridSquareLength
  ) {
    for (
      let columnIndex = 0;
      columnIndex < columnCount;
      columnIndex = columnIndex + gridSquareLength
    ) {
      const pixelCenter: Coord = {
        x: leftTopPoint.x + columnIndex + gridSquareLength / 2,
        y: leftTopPoint.y + rowIndex + gridSquareLength / 2,
      };
      if (
        pixelCenter.x >= selectedRegionTopLeft.x &&
        pixelCenter.x <= selectedRegionBottomRight.x &&
        pixelCenter.y >= selectedRegionTopLeft.y &&
        pixelCenter.y <= selectedRegionBottomRight.y
      ) {
        includedPixelsIndices.push({
          rowIndex: rowIndex / gridSquareLength,
          columnIndex: columnIndex / gridSquareLength,
        });
      }
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
