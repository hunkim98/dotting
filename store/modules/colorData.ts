import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type colorData = {
  hexString: string;
};

const initialState: colorData = {
  hexString: "#000000",
};

const colorDataSlice = createSlice({
  name: "colorData",
  initialState,
  reducers: {
    changeColor: (state, actions: PayloadAction<{ data: colorData }>) => {
      state.hexString = actions.payload.data.hexString;
    },
  },
});

const { reducer, actions } = colorDataSlice;
export const {} = actions;
export default reducer;
