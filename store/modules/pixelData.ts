import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface pixelDataElement {
  rowIndex: number;
  columnIndex: number;
  color: string | undefined;
  name: string | undefined;
}

export type pixelData = {
  data: pixelDataElement[][];
};

const initialState: pixelData = {
  data: [],
};

const pixelDataSlice = createSlice({
  name: "pixelData",
  initialState,
  reducers: {
    initialize: (
      state,
      actions: PayloadAction<{ data: pixelDataElement[][] }>
    ) => {
      console.log(actions.payload.data);
      state.data = actions.payload.data;
    },
    update: (
      state,
      actions: PayloadAction<{
        color: string;
        rowIndex: number;
        columnIndex: number;
      }>
    ) => {
      console.log(actions.payload);
      state.data[actions.payload.rowIndex][actions.payload.columnIndex].color =
        actions.payload.color;
    },
  },
});

const { reducer, actions } = pixelDataSlice;
export const { update, initialize } = actions;
export default reducer;
