import { combineReducers } from "@reduxjs/toolkit";
import mouseEvent from "./mouseEvent";
import pixelData from "./pixelData";

const rootReducer = combineReducers({ mouseEvent, pixelData });

export default rootReducer;

export type RootState = ReturnType<typeof rootReducer>;
