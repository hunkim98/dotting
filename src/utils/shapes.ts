import { ButtonDirection } from "../components/Canvas";
import { convertCartesianToScreen, getScreenPoint } from "./math";
import { Coord } from "./types";

export const drawArrowHead = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radians: number,
  scale: number,
) => {
  ctx.save();
  ctx.beginPath();
  ctx.translate(x, y);
  ctx.rotate(radians);
  ctx.moveTo(0, 0);
  ctx.lineTo(7 * scale, 5 * scale);
  ctx.lineTo(-7 * scale, 5 * scale);
  ctx.closePath();
  ctx.fillStyle = "#949494";
  ctx.fill();
  ctx.restore();
};

export const drawExtendButton = (
  ctx: CanvasRenderingContext2D,
  centerPos: Coord,
  color: string,
  buttonWidth: number, // this is changeable
  buttonHeight: number, // this is fixed
  scale: number,
) => {
  ctx.save();

  ctx.fillStyle = color;

  ctx.fillRect(
    centerPos.x,
    centerPos.y - (buttonHeight * scale) / 2,
    buttonWidth * scale,
    buttonHeight * scale,
  );

  ctx.restore();

  drawArrowHead(
    ctx,
    centerPos.x - (buttonHeight / 2) * scale,
    centerPos.y + (buttonWidth * scale) / 2,
    -Math.PI / 2,
    scale,
  );
  drawArrowHead(
    ctx,
    centerPos.x + (buttonHeight / 2) * scale,
    centerPos.y + (buttonWidth * scale) / 2,
    Math.PI / 2,
    scale,
  );
};
