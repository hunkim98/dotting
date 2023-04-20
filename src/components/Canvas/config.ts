import { PanZoom } from "./types";

export const DefaultPanZoom: PanZoom = {
  scale: 1,
  offset: { x: 0, y: 0 },
};

export const DefaultGridSquareLength: number = 20;

export const DefaultButtonHeight: number = 20;

export enum ButtonDirection {
  TOP = "TOP",
  BOTTOM = "BOTTOM",
  LEFT = "LEFT",
  RIGHT = "RIGHT",
}
