import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { pixelDataElement } from "./pixelData";

export type ColorGroup = {
  [key: string]: Exclude<pixelDataElement, "name">[];
};

export type PixelIndexInner = {
  [key: string]: string | undefined;
};
export type PixelIndexNested = {
  [key: string]: PixelIndexInner;
};

export interface ColorGroupState {
  data: ColorGroup;
  getNameByPixelIndex: PixelIndexNested;
}
const initialState: ColorGroupState = {
  data: {},
  getNameByPixelIndex: {},
};

const ColorGroupSlice = createSlice({
  name: "colorGroupSlice",
  initialState,
  reducers: {
    changeGroupName(
      state,
      action: PayloadAction<{ originalKey: string; newKey: string }>
    ) {
      const data = [...state.data[action.payload.originalKey]];
      state.data[action.payload.newKey] = data;
      delete state.data[action.payload.originalKey];
    },
    changeGroupColor(
      state,
      action: PayloadAction<{ key: string; color: string }>
    ) {
      const elementsToChangeColor = state.data[action.payload.key];
      for (const item of elementsToChangeColor) {
        item.color = action.payload.color;
      }
    },
    removeFromGroup(
      state,
      action: PayloadAction<{ rowIndex?: number; columnIndex?: number }>
    ) {
      console.log("called!");
      if (
        action.payload.rowIndex !== undefined &&
        action.payload.columnIndex === undefined
      ) {
        const rowIndexToDelete = action.payload.rowIndex;
        if (state.getNameByPixelIndex[rowIndexToDelete]) {
          const columnIndexes = Object.keys(
            state.getNameByPixelIndex[rowIndexToDelete]
          );
          for (const columnIndex of columnIndexes) {
            const groupName =
              state.getNameByPixelIndex[rowIndexToDelete][columnIndex];
            if (groupName) {
              if (state.data[groupName]) {
                state.data[groupName] = state.data[groupName].filter(
                  (element) => {
                    return element.rowIndex !== rowIndexToDelete;
                  }
                );
                if (state.data[groupName].length === 0) {
                  delete state.data[groupName];
                }
                delete state.getNameByPixelIndex[rowIndexToDelete][columnIndex];
              }
            }
          }
        }
      }
      if (
        action.payload.columnIndex !== undefined &&
        action.payload.rowIndex === undefined
      ) {
        const columnIndexToDelete = action.payload.columnIndex;
        const currentRowIndexes = Object.keys(state.getNameByPixelIndex);
        for (const rowIndex of currentRowIndexes) {
          const groupName =
            state.getNameByPixelIndex[rowIndex][columnIndexToDelete];
          if (groupName) {
            if (state.data[groupName]) {
              state.data[groupName] = state.data[groupName].filter(
                (element) => element.columnIndex !== columnIndexToDelete
              );

              if (state.data[groupName].length === 0) {
                delete state.data[groupName];
              }
              delete state.getNameByPixelIndex[rowIndex][columnIndexToDelete];
            }
          }
        }
      }
      if (
        action.payload.columnIndex !== undefined &&
        action.payload.rowIndex !== undefined
      ) {
        const columnIndexToDelete = action.payload.columnIndex;
        const rowIndexToDelete = action.payload.rowIndex;
        if (state.getNameByPixelIndex[rowIndexToDelete]) {
          const groupName =
            state.getNameByPixelIndex[rowIndexToDelete][columnIndexToDelete];
          if (groupName) {
            if (state.data[groupName]) {
              state.data[groupName] = state.data[groupName].filter(
                (element) => {
                  return (
                    element.rowIndex !== rowIndexToDelete &&
                    element.columnIndex !== columnIndexToDelete
                  );
                }
              );
              if (state.data[groupName].length === 0) {
                delete state.data[groupName];
              }
              delete state.getNameByPixelIndex[rowIndexToDelete][
                columnIndexToDelete
              ];
            }
          }
        }
      }
    },
    appendToGroup(
      state,
      action: PayloadAction<{
        key: string;
        data: Exclude<pixelDataElement, "name">[];
      }>
    ) {
      if (state.data[action.payload.key]) {
        state.data[action.payload.key] = state.data[action.payload.key].concat(
          action.payload.data
        );
      } else {
        state.data[action.payload.key] = action.payload.data;
      }

      for (const pixelElement of action.payload.data) {
        const rowIndex = pixelElement.rowIndex;
        const columnIndex = pixelElement.columnIndex;
        const previousName =
          state.getNameByPixelIndex[rowIndex] &&
          state.getNameByPixelIndex[rowIndex][columnIndex];
        if (previousName) {
          let pixelElementIndexToDelete: undefined | number = undefined;
          if (state.data[previousName]) {
            for (let i = 0; i < state.data[previousName].length; i++) {
              const stateElement = state.data[previousName][i];
              if (
                stateElement.rowIndex === rowIndex &&
                stateElement.columnIndex === columnIndex
              ) {
                pixelElementIndexToDelete = i;
              }
            }
            if (pixelElementIndexToDelete !== undefined) {
              state.data[previousName] = state.data[previousName].filter(
                (item, index) => index !== pixelElementIndexToDelete
              );
              if (state.data[previousName].length === 0) {
                delete state.data[previousName];
              }
            }
          }
        }
        if (!state.getNameByPixelIndex[rowIndex]) {
          state.getNameByPixelIndex[rowIndex] = {};
        }
        state.getNameByPixelIndex[rowIndex][columnIndex] = action.payload.key;
      }
    },
  },
});

const { reducer, actions } = ColorGroupSlice;
export const {
  changeGroupName,
  appendToGroup,
  changeGroupColor,
  removeFromGroup,
} = actions;
export default reducer;
