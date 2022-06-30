import { pixelDataElement } from "../store/modules/pixelData";

export interface PanelKeys {
  L_key: number;
  R_key: number;
  T_key: number;
  B_key: number;
}

export interface rowColumnColor {
  rowIndex: number;
  columnIndex: number;
  color: string;
}

export interface dataArrayElement {
  rowIndex: number;
  columnIndex: number;
  color: string;
  name: string;
}

export interface colorGroupElement extends Omit<pixelDataElement, "name"> {}

export interface colorGroup {
  name: string;
  color: string | undefined;
  data: colorGroupElement[];
}

export interface PixelDTO {
  rowIndex: number;
  columnIndex: number;
  dataColor?: string;
}
