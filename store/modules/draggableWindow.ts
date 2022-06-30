import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type draggableWindowPosition = {
  position: { x: number; y: number };
};

const initialState: draggableWindowPosition = {
  position: {
    x: 200,
    y: 200,
  },
};

const draggableWindowSlice = createSlice({
  name: "draggableWindow",
  initialState,
  reducers: {
    setColorWindowPosition: (
      state,
      action: PayloadAction<{ x: number; y: number }>
    ) => {
      state.position.x = action.payload.x;
      state.position.y = action.payload.y;
    },
  },
});

const { reducer, actions } = draggableWindowSlice;
export const { setColorWindowPosition } = actions;
export default reducer;
