import React from "react";

import { BaseLayer } from "./BaseLayer";

export default class BackgroundLayer extends BaseLayer {
  private backgroundMode: "checkerboard" | "color";
  private backgroundColor: React.CSSProperties["color"] = "#c9c9c9";
  private backgroundAlpha: number;

  constructor({ canvas }: { canvas: HTMLCanvasElement }) {
    super({ canvas });
  }

  setBackgroundMode(backgroundMode?: "checkerboard" | "color") {
    this.backgroundMode = backgroundMode ? backgroundMode : "checkerboard";
  }

  setBackgroundAlpha(alpha?: number) {
    if (alpha === undefined) {
      this.backgroundAlpha = 0.5;
    }
    this.backgroundAlpha = alpha
      ? alpha >= 1
        ? 1
        : alpha < 0
        ? 0
        : alpha
      : 0.5;
  }

  setBackgroundColor(color?: React.CSSProperties["color"]) {
    this.backgroundColor = color ? color : "#c9c9c9";
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.save();

    ctx.globalAlpha = this.backgroundAlpha;
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
