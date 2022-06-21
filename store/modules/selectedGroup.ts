import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { pixelDataElement } from "./pixelData";

const initialState: pixelDataElement[] = [];

const groupSlice = createSlice({
  name: "selectedGroup",
  initialState,
  reducers: {
    setSelectedGroup: (
      state,
      action: PayloadAction<{ data: pixelDataElement[] }>
    ) => {
      state = action.payload.data;
    },
  },
});

const { reducer, actions } = groupSlice;
export const { setSelectedGroup } = actions;
export default reducer;
