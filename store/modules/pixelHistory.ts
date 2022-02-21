import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { pixelDataElement } from "./pixelData";

type pixelHistory = {
  history: pixelDataElement[][];
};

const initialState: pixelHistory = {
  history: [],
};

const pixelHistorySlice = createSlice({
  name: "pixelHistory",
  initialState,
  reducers: {
    record: (state, actions: PayloadAction<pixelDataElement[][]>) => {
      state.history = actions.payload;
    },
  },
});

const { reducer, actions } = pixelHistorySlice;
export const { record } = actions;
export default reducer;
