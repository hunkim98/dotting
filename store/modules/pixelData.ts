import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface pixelDataElement {
  rowIndex: number;
  columnIndex: number;
  color: string | undefined;
  name: string | undefined;
}

export interface pixelIndexes {
  topRowIndex: number;
  bottomRowIndex: number;
  leftColumnIndex: number;
  rightColumnIndex: number;
}

export enum pixelChangeActionType {
  PIXEL_CHANGE,
}

export enum laneChangeActionType {
  ADD_TOP_LANE,
  REMOVE_TOP_LANE,
  ADD_LEFT_LANE,
  REMOVE_LEFT_LANE,
  ADD_RIGHT_LANE,
  REMOVE_RIGHT_LANE,
  ADD_BOTTOM_LANE,
  REMOVE_BOTTOM_LANE,
}

export interface pixelChange {
  action: pixelChangeActionType;
  before: pixelDataElement[];
  after: pixelDataElement[];
}

export interface laneChange {
  action: laneChangeActionType;
  before: pixelDataElement[];
  after: undefined;
}

export interface pixelRecord {
  actions: number;
  indexes: pixelIndexes;
}

export type pixelData = {
  record: pixelDataElement[][];
  present: pixelDataElement[][];
  past: Array<any>;
  future: Array<any>;
  actionHistory: (pixelChange | laneChange)[];
};

const initialState: pixelData = {
  record: [],
  present: [],
  past: [],
  future: [],
  actionHistory: [],
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
      // state.topRowIndex = 0;
      // state.bottomRowIndex = actions.payload.data.length;
      // state.leftColumnIndex = 0;
      // state.rightColumnIndex = actions.payload.data[0].length;
      // state.past = [actions.payload.data];
    },
    update: (state, action: PayloadAction<pixelChange | laneChange>) => {
      state.past = [...state.past, action];
      if (state.future.length !== 0) {
        state.future = [];
      }
    },
    undo: (state) => {
      if (state.past.length > 0) {
        const previous = state.past[state.past.length - 1];
        const newPast = state.past.slice(0, state.past.length - 1);
        state.past = newPast;
        state.record = previous;
        state.future = [state.present, ...state.future];
      }
    },
    redo: (state) => {
      if (state.future.length > 0) {
        const next = state.future[0];
        const newFuture = state.future.slice(1);
        state.past = [...state.past, state.present];
        state.record = next;
        state.future = newFuture;
      }
    },
  },
});

const { reducer, actions } = pixelDataSlice;
export const { initialize, undo, redo, update } = actions;
export default reducer;
