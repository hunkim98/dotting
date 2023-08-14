import { PanZoom } from "./types";

export const DefaultPanZoom: PanZoom = {
  scale: 1,
  offset: { x: 0, y: 0 },
};

export const DefaultGridSquareLength = 20;

export const DefaultButtonHeight = 30;

export enum ButtonDirection {
  TOP = "TOP",
  BOTTOM = "BOTTOM",
  LEFT = "LEFT",
  RIGHT = "RIGHT",
  TOPLEFT = "TOPLEFT",
  TOPRIGHT = "TOPRIGHT",
  BOTTOMLEFT = "BOTTOMLEFT",
  BOTTOMRIGHT = "BOTTOMRIGHT",
}

export const DefaultPixelDataDimensions = {
  columnCount: 10,
  rowCount: 10,
};

export enum MouseMode {
  PANNING = "PANNING",
  EXTENDING = "EXTENDING",
  DRAWING = "DRAWING",
}

export const DefaultZoomSensitivity = 200;

export const DefaultMaxScale = 1.5;

export const DefaultMinScale = 0.3;

export const CurrentDeviceUserId = "current-device-user-id";

// this is used so that we can handle the case when multiplayer user colors a pixel
// when the current device user is changing the size of the grid
export const TemporaryUserId = "temporary-user-id";

export type UserId = string;

export type DimensionChangeRecord = {
  direction: ButtonDirection;
  amount: number;
} | null;

export const InteractionExtensionAllowanceRatio = 2;
export const InteractionEdgeTouchingRange = 6;

export const DefaultPixelExtendRatio = 1;

export const DashedLineOffsetFromPixelCanvas = 15;

export const ExtensionGuideCircleRadius = 3;

export const DefaultExtendArrowPadding = 2;

export const DefaultBackgroundColor = "#999999";
