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
  PIXEL_CHANGE = "PIXEL_CHANGE",
}

export enum laneChangeActionType {
  ADD_TOP_LANE = "ADD_TOP_LANE",
  REMOVE_TOP_LANE = "REMOVE_TOP_LANE",
  ADD_LEFT_LANE = "ADD_LEFT_LANE",
  REMOVE_LEFT_LANE = "REMOVE_LEFT_LANE",
  ADD_RIGHT_LANE = "ADD_RIGHT_LANE",
  REMOVE_RIGHT_LANE = "REMOVE_RIGHT_LANE",
  ADD_BOTTOM_LANE = "ADD_BOTTOM_LANE",
  REMOVE_BOTTOM_LANE = "REMOVE_BOTTOM_LANE",
}

export interface pixelAction {
  type: pixelChangeActionType | laneChangeActionType;
  affectedLaneKey?: number;
  before: pixelDataElement[];
  after: pixelDataElement[];
}

export interface actionRecord extends pixelAction {
  action: "redo" | "undo";
}

export interface pixelRecord {
  actions: number;
  indexes: pixelIndexes;
}

export type pixelData = {
  record: pixelDataElement[][];
  past: Array<any>;
  future: Array<any>;
  actionRecord: actionRecord | undefined;
  pixelDataTriggered: boolean;
};

const initialState: pixelData = {
  record: [],
  past: [],
  future: [],
  // colorGroupActionPast: [],
  // colorGroupActionFuture: []
  actionRecord: undefined,
  pixelDataTriggered: false,
};

const pixelDataSlice = createSlice({
  name: "pixelData",
  initialState,
  reducers: {
    initialize: (
      state,
      actions: PayloadAction<{ data: pixelDataElement[][] }>
    ) => {
      state.pixelDataTriggered = !state.pixelDataTriggered;
      // state.topRowIndex = 0;
      // state.bottomRowIndex = actions.payload.data.length;
      // state.leftColumnIndex = 0;
      // state.rightColumnIndex = actions.payload.data[0].length;
      // state.past = [actions.payload.data];
    },
    update: (
      state,
      data: PayloadAction<{
        action: pixelAction;
        // element: pixelDataElement
      }>
    ) => {
      state.past = [...state.past, data.payload.action];
      if (state.future.length !== 0) {
        state.future = [];
      }
      state.pixelDataTriggered = !state.pixelDataTriggered;
    },
    undo: (state) => {
      if (state.past.length > 0) {
        const previous = state.past[state.past.length - 1];
        const newPast = state.past.slice(0, state.past.length - 1);
        state.past = newPast;
        state.actionRecord = { action: "undo", ...previous };
        state.future = [previous, ...state.future];
        state.pixelDataTriggered = !state.pixelDataTriggered;
      }
    },
    redo: (state) => {
      if (state.future.length > 0) {
        const next = state.future[0];
        const newFuture = state.future.slice(1);
        state.past = [...state.past, next];
        state.actionRecord = { action: "redo", ...next };
        state.future = newFuture;
        state.pixelDataTriggered = !state.pixelDataTriggered;
      }
    },
  },
});

const { reducer, actions } = pixelDataSlice;
export const { initialize, undo, redo, update } = actions;
export default reducer;
