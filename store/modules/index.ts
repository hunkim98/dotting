import { combineReducers } from "@reduxjs/toolkit";
import mouseEvent from "./mouseEvent";

const rootReducer = combineReducers({ mouseEvent });

export default rootReducer;

export type RootState = ReturnType<typeof rootReducer>;
