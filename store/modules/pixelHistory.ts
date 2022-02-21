import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { undoable } from "../helper/undoable";
import { pixelDataElement } from "./pixelData";

type pixelHistory = {
  present: pixelDataElement[][];
  past: Array<any>;
  future: Array<any>;
};

const initialState: pixelHistory = {
  present: [],
  past: [],
  future: [],
};

const pixelHistorySlice = createSlice({
  name: "pixelHistory",
  initialState,
  reducers: {
    record: (state, actions: PayloadAction<{ data: pixelDataElement[][] }>) => {
      state.present = actions.payload.data;
      state.past = [...state.past, actions.payload.data];
      if (state.future.length !== 0) {
        state.future = [];
      }
    },
    undo: (state) => {
      if (state.past.length !== 0) {
        const previous = state.past[state.past.length - 1];
        const newPast = state.past.slice(0, state.past.length - 1);
        state.past = newPast;
        state.present = previous;
        state.future = [state.present, ...state.future];
      }
    },
    redo: (state) => {
      if (state.future.length !== 0) {
        const next = state.future[0];
        const newFuture = state.future.slice(1);
        state.past = [...state.past, state.present];
        state.present = next;
        state.future = newFuture;
      }
    },
  },
});

const { reducer, actions } = pixelHistorySlice;
export const { record, undo, redo } = actions;
export default reducer;
