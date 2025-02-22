import { Coord, Index, PanZoom } from "./types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const degToRad = (degrees: number) => {
  return degrees * (Math.PI / 180);
};

export const convertCartesianToScreen = (
  canvas: HTMLCanvasElement,
  cartesianCoord: Coord,
  dpr: number,
): Coord => {
  const screenPoint = {
    x: cartesianCoord.x + canvas.width / dpr / 2,
    y: cartesianCoord.y + canvas.height / dpr / 2,
  } as Coord;
  return screenPoint;
};

export function diffPoints(p1: Coord, p2: Coord): Coord {
  return { x: p1.x - p2.x, y: p1.y - p2.y };
}

export function addPoints(p1: Coord, p2: Coord): Coord {
  return { x: p1.x + p2.x, y: p1.y + p2.y };
}

export function distPoints(p1: Coord, p2: Coord): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

export function gradientPoints(p1: Coord, p2: Coord): number {
  return (p2.y - p1.y) / (p2.x - p1.x);
}

export function directionPoints(p1: Coord, p2: Coord): number {
  const signX = p1.x > p2.x ? -1 : p1.x === p2.x ? 0 : 1;
  const signY = p1.y > p2.y ? -1 : p1.y === p2.y ? 0 : 1;
  let direction = 0;

  if (signX === -1 && signY === 1) direction = 1;
  else if (signX === 0 && signY === 1) direction = 2;
  else if (signX === 1 && signY === 1) direction = 3;
  else if (signX === -1 && signY === 0) direction = 4;
  else if (signX === 1 && signY === 0) direction = 6;
  else if (signX === -1 && signY === -1) direction = 7;
  else if (signX === 0 && signY === -1) direction = 8;
  else if (signX === 1 && signY === -1) direction = 9;
  else direction = 5;

  return direction;
}

/**
 * Actual world point is converted to screen(=viewing) point
 * @param point
 * @param panZoom
 * @returns
 */
export function getScreenPoint(point: Coord, panZoom: PanZoom): Coord {
  const { offset, scale } = panZoom;

  return {
    x: Math.floor(point.x * scale + offset.x),
    y: Math.floor(point.y * scale + offset.y),
  };
}

/**
 * This is the real point in the actual world
 * @param point
 * @param panZoom
 * @returns
 */
export function getWorldPoint(point: Coord, panZoom: PanZoom): Coord {
  const { offset, scale } = panZoom;

  return { x: (point.x - offset.x) / scale, y: (point.y - offset.y) / scale };
}

export function convertScreenPointToCartesian(
  canvas: HTMLCanvasElement,
  screenPoint: Coord,
  dpr: number,
): Coord {
  const cartesianCoord = {
    x: screenPoint.x - canvas.width / dpr / 2,
    y: screenPoint.y - canvas.height / dpr / 2,
  } as Coord;
  return cartesianCoord;
}

export function worldPointToCartesian(point: Coord, panZoom: PanZoom): Coord {
  const { offset, scale } = panZoom;

  return {
    x: (point.x - offset.x) / scale,
    y: (point.y - offset.y) / scale,
  };
}

export function lerpRanges(
  value: number,
  range1Start: number,
  range1End: number,
  range2Start: number,
  range2End: number,
) {
  const ratio = (value - range1Start) / (range1End - range1Start);
  return range2Start + (range2End - range2Start) * ratio;
}

export function getBresenhamLineIndices(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): Index[] {
  const startPosition = { x1, y1 };
  const endPosition = { x2, y2 };

  const width = x2 - x1;
  const height = y2 - y1;

  const isGradualSlope = Math.abs(width) >= Math.abs(height);
  const directionX = width >= 0 ? 1 : -1;
  const directionY = height >= 0 ? 1 : -1;

  const fw = directionX * width;
  const fh = directionY * height;

  let f = isGradualSlope ? fh * 2 - fw : 2 * fw - fh;
  const f1 = isGradualSlope ? 2 * fh : 2 * fw;
  const f2 = isGradualSlope ? 2 * (fh - fw) : 2 * (fw - fh);

  let x = startPosition.x1;
  let y = startPosition.y1;

  const missingPoints: Index[] = [];

  if (isGradualSlope) {
    while (x != endPosition.x2) {
      missingPoints.push({ rowIndex: x, columnIndex: y });
      if (f < 0) {
        f += f1;
      } else {
        f += f2;
        y += directionY;
      }
      x += directionX;
    }
  } else {
    while (y != endPosition.y2) {
      missingPoints.push({ rowIndex: x, columnIndex: y });
      if (f < 0) {
        f += f1;
      } else {
        f += f2;
        x += directionX;
      }
      y += directionY;
    }
  }

  return missingPoints;
}

export function getBresenhamEllipseIndices(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  filled: boolean
): Index[] {
  const points: Index[] = [];

  let a = Math.abs(x2 - x1);
  const b = Math.abs(y2 - y1)
  let b1 = b & 1;
  let dx = 4 * (1 - a) * b * b;
  let dy = 4 * (b1 + 1) * a * a;
  let err = dx + dy + b1 * a * a;
  let e2 = 0;

  if (x1 > x2) { 
    x1 = x2; 
    x2 += a; 
  }
  if (y1 > y2) {
    y1 = y2;
  }
  y1 += (b + 1) >> 1; 
  y2 = y1 - b1;
  a = 8 * a * a; 
  b1 = 8 * b * b;

  do {
    if (filled) {
      for (let row = y2; row <= y1; row++) {
        points.push({ columnIndex: x1, rowIndex: row });
        points.push({ columnIndex: x2, rowIndex: row });
      }
    } else {
      points.push({ columnIndex: x2, rowIndex: y1 });
      points.push({ columnIndex: x1, rowIndex: y1 });
      points.push({ columnIndex: x1, rowIndex: y2 });
      points.push({ columnIndex: x2, rowIndex: y2 });
    }
    e2 = 2 * err;
    if (e2 <= dy) { 
      y1++; 
      y2--; 
      err += dy += a; 
    }
    if (e2 >= dx || 2 * err > dy) { 
      x1++; 
      x2--; 
      err += dx += b1; 
    }
  } while (x1 <= x2);

  while (y1 - y2 <= b) {
    points.push({ columnIndex: x1 - 1, rowIndex: y1 });
    points.push({ columnIndex: x2 + 1, rowIndex: y1++ });
    points.push({ columnIndex: x1 - 1, rowIndex: y2 });
    points.push({ columnIndex: x2 + 1, rowIndex: y2-- });
  }

  return points.filter((value, index, self) =>
    index === self.findIndex((t) => (
      t.columnIndex === value.columnIndex && t.rowIndex === value.rowIndex
    ))
  );
}
