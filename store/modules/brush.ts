import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Color, ColorChangeHandler, ColorResult } from "react-color";

const DEFAULT_COLOR = "#f44336";

export type brushData = {
  colorString: string;
  color: Color;
};

export type brushColor = {
  color: string;
};

const initialState: brushData = {
  colorString: DEFAULT_COLOR,
  color: DEFAULT_COLOR,
};

const brushSlice = createSlice({
  name: "colorData",
  initialState,
  reducers: {
    changeBrushColor: (
      state,
      actions: PayloadAction<{ brushColor: string }>
    ) => {
      const colorFromClient: string = actions.payload.brushColor;
      state.colorString = colorFromClient;
    },
  },
});

const { reducer, actions } = brushSlice;
export const { changeBrushColor } = actions;
export default reducer;
