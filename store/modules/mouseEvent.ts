import { createSlice } from "@reduxjs/toolkit";

export type MouseState = {
  isLeftClicked: boolean;
};

const initialState: MouseState = { isLeftClicked: false };

const mouseEventSlice = createSlice({
  name: "mouseDrag",
  initialState,
  reducers: {
    mouseClickOn: (state) => {
      state.isLeftClicked = true;
      console.log("ononon");
    },
    mouseClickOff: (state) => {
      state.isLeftClicked = false;
    },
  },
});

const { reducer, actions } = mouseEventSlice;
export const { mouseClickOn, mouseClickOff } = actions;
export default reducer;
