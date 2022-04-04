import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type brushData = {
  colorString: string;
};

const initialState: brushData = {
  colorString: "#000000",
};

const brushSlice = createSlice({
  name: "colorData",
  initialState,
  reducers: {
    changeBrushColor: (state, actions: PayloadAction<{ data: brushData }>) => {
      state.colorString = actions.payload.data.colorString;
    },
  },
});

const { reducer, actions } = brushSlice;
export const { changeBrushColor } = actions;
export default reducer;
