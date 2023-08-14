import React from "react";

import { BaseLayer } from "./BaseLayer";
import { DefaultBackgroundColor } from "./config";

export default class BackgroundLayer extends BaseLayer {
  private backgroundMode: "checkerboard" | "color" = "color";
  private backgroundColor: React.CSSProperties["color"] =
    DefaultBackgroundColor;

  constructor({ canvas }: { canvas: HTMLCanvasElement }) {
    super({ canvas });
  }

  setBackgroundMode(backgroundMode?: "checkerboard" | "color") {
    this.backgroundMode = backgroundMode ? backgroundMode : "color";
  }

  setBackgroundColor(color?: React.CSSProperties["color"]) {
    this.backgroundColor = color ? color : DefaultBackgroundColor;
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.save();

    if (this.backgroundMode === "color") {
      ctx.fillStyle = this.backgroundColor;
      ctx.fillRect(0, 0, this.width, this.height);
    } else {
      const cellWidth = 12;
      const cellCount = {
        x: this.width / cellWidth,
        y: this.height / cellWidth,
      };
      for (let i = 0; i < cellCount.x; i++) {
        for (let j = 0; j < cellCount.y; j++) {
          const isEvenRow = i % 2 === 0;
          const isEvenCol = j % 2 === 0;

          const color = isEvenRow
            ? isEvenCol
              ? "white"
              : this.backgroundColor
            : isEvenCol
            ? this.backgroundColor
            : "white";

          if (color) {
            ctx.fillStyle = color;
            ctx.fillRect(i * cellWidth, j * cellWidth, cellWidth, cellWidth);
          }
        }
      }
    }
    ctx.restore();
  }
}
