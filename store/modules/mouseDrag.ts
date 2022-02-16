import { createSlice } from "@reduxjs/toolkit";

const initialState = { value: false };

const mouseDragSlice = createSlice({
  name: "mouseDrag",
  initialState: initialState,
  reducers: {
    mouseDragOn: (state) => {
      state.value = true;
    },
    mouseDragOff: (state) => {
      state.value = false;
    },
  },
});

export const { mouseDragOn, mouseDragOff } = mouseDragSlice.actions;
export default mouseDragSlice.reducer;
