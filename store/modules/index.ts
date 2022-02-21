import { combineReducers } from "@reduxjs/toolkit";
import mouseEvent from "./mouseEvent";
import { undoable } from "../helper/undoable";
import pixelData from "./pixelData";
import pixelHistory from "./pixelHistory";

const rootReducer = combineReducers({
  mouseEvent,
  pixelData,
  pixelHistory: undoable(pixelHistory),
});

export default rootReducer;

export type RootState = ReturnType<typeof rootReducer>;
