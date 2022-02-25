import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface pixelDataElement {
  rowIndex: number;
  columnIndex: number;
  color: string | undefined;
  name: string | undefined;
}

export type pixelData = {
  record: pixelDataElement[][];
  present: pixelDataElement[][];
  past: Array<any>;
  future: Array<any>;
};

const initialState: pixelData = {
  record: [],
  present: [],
  past: [],
  future: [],
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
      state.present = actions.payload.data;
      state.record = actions.payload.data;
      state.past = [actions.payload.data];
    },
    update: (
      state,
      actions: PayloadAction<{
        color: string;
        rowIndex: number;
        columnIndex: number;
      }>
    ) => {
      state.present[actions.payload.rowIndex][
        actions.payload.columnIndex
      ].color = actions.payload.color;

      console.log("updated!");

      const pastLength = state.past.length;
      console.log(pastLength);
      if (pastLength > 30) {
        state.past = state.past.slice(1);
      }
      state.past = [...state.past, state.present];
      if (state.future.length !== 0) {
        state.future = [];
      }
    },
    // addToHistory: (state) => {
    //   // add past history
    //   console.log("addedToHistory!");
    //   const pastLength = state.past.length;
    //   console.log(pastLength);
    //   if (pastLength > 30) {
    //     state.past = state.past.slice(1);
    //   }
    //   state.past = [...state.past, state.present];
    // },
    undo: (state) => {
      if (state.past.length > 0) {
        const previous = state.past[state.past.length - 1];
        const newPast = state.past.slice(0, state.past.length - 1);
        state.past = newPast;
        state.present = previous;
        state.record = previous;
        state.future = [state.present, ...state.future];
      }
    },
    redo: (state) => {
      if (state.future.length > 0) {
        const next = state.future[0];
        const newFuture = state.future.slice(1);
        state.past = [...state.past, state.present];
        state.present = next;
        state.record = next;
        state.future = newFuture;
      }
    },
  },
});

const { reducer, actions } = pixelDataSlice;
export const { initialize, undo, redo, update } = actions;
export default reducer;
