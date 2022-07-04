import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { pixelDataElement } from "./pixelData";

export interface SelectedGroup {
  group: pixelDataElement[];
  groupName: string | undefined;
}

const initialState: SelectedGroup = {
  group: [],
  groupName: undefined,
};

const groupSlice = createSlice({
  name: "selectedGroup",
  initialState,
  reducers: {
    setSelectedGroup: (
      state,
      action: PayloadAction<{ data: pixelDataElement[]; name: string }>
    ) => {
      state.group = action.payload.data;
      state.groupName = action.payload.data[0].name;
    },
    initializeSelectedGroup: (state) => {
      state.group = [];
      state.groupName = undefined;
    },
    //used when applying color with the color window open
    appendToSelectedGroup: (
      state,
      action: PayloadAction<{ data: pixelDataElement }>
    ) => {
      state.group.push(action.payload.data);
      // console.log(state.group.length);
      // state.group.push(action.payload.data);
    },
  },
});

const { reducer, actions } = groupSlice;
export const {
  setSelectedGroup,
  initializeSelectedGroup,
  appendToSelectedGroup,
} = actions;
export default reducer;
