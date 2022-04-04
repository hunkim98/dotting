import { combineReducers } from "@reduxjs/toolkit";
import mouseEvent from "./mouseEvent";
import { undoable } from "../helper/undoable";
import pixelData from "./pixelData";
import pixelHistory from "./pixelHistory";
import brush from "./brush";

const rootReducer = combineReducers({
  mouseEvent,
  pixelData,
  pixelHistory,
  brush,
});

export default rootReducer;

export type RootState = ReturnType<typeof rootReducer>;
