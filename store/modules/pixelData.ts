import { createSlice } from "@reduxjs/toolkit";

export interface pixelDataElement {
  rowIndex: number;
  columnIndex: number;
  color: string | undefined;
  name: string | undefined;
}

interface updateActions {
  type: string;
  payload: { color: string; rowIndex: number; columnIndex: number };
}

interface initializeActions {
  type: string;
  payload: { initialData: pixelDataElement[][] };
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
    initialize: (state, actions: initializeActions) => {
      console.log(actions.payload.initialData);
      state.data = actions.payload.initialData;
    },
    update: (state, actions: updateActions) => {
      state.data[actions.payload.rowIndex][actions.payload.columnIndex].color =
        actions.payload.color;
    },
  },
});

const { reducer, actions } = pixelDataSlice;
export const { update, initialize } = actions;
export default reducer;
