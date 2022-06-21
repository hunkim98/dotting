import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { pixelDataElement } from "./pixelData";

export interface colorGroup {
  pixelDataElement: pixelDataElement[];
}

const initialState = {
  colorGroups: [],
};

const colorGroupSlice = createSlice({
  name: "colorGroup",
  initialState,
  reducers: {},
});
