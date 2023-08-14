import { Coord } from "./types";

export const drawArrowHead = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radians: number,
  scale: number,
  arrowWidth: number,
) => {
  // draw traingle
  ctx.save();
  ctx.beginPath();
  ctx.translate(x, y);
  ctx.rotate(radians);
  ctx.moveTo(0, 0);
  ctx.lineTo((arrowWidth / 2) * scale, 5 * scale);
  ctx.lineTo((-arrowWidth / 2) * scale, 5 * scale);
  ctx.closePath();
  ctx.fillStyle = "#000000";
  ctx.fill();
  ctx.restore();
  // draw line
  ctx.save();
  ctx.beginPath();
  ctx.translate(x, y);
  ctx.rotate(radians);
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 8 * scale);
  ctx.stroke();
  ctx.closePath();
  ctx.fillStyle = "#000000";
  ctx.fill();
  ctx.restore();
};

export const drawExtendButton = (
  ctx: CanvasRenderingContext2D,
  leftTopPos: Coord,
  color: string,
  buttonWidth: number, // this is changeable
  buttonHeight: number, // this is fixed
  scale: number,
) => {
  ctx.save();

  ctx.fillStyle = color;

  ctx.fillRect(
    leftTopPos.x,
    leftTopPos.y,
    buttonWidth * scale,
    buttonHeight * scale,
  );

  ctx.restore();
};

export const drawCircle = (
  ctx: CanvasRenderingContext2D,
  center: Coord,
  radius: number,
  fillStyle: string,
  strokeStyle: string,
  strokeWidth: number,
) => {
  ctx.save();
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = fillStyle;
  ctx.fill();
  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = strokeStyle;
  ctx.stroke();
  ctx.restore();
};

export const drawRect = (
  ctx: CanvasRenderingContext2D,
  leftTopPosX: number,
  leftTopPosY: number,
  width: number,
  height: number,
  fillStyle: string,
  strokeStyle: string,
  lineWidth: number,
) => {
  ctx.save();
  ctx.beginPath();
  ctx.rect(leftTopPosX, leftTopPosY, width, height);
  ctx.fillStyle = fillStyle;
  ctx.lineWidth = lineWidth;
  ctx.fill();
  ctx.strokeStyle = strokeStyle;
  ctx.stroke();
  ctx.restore();
};
