import { combineReducers } from "@reduxjs/toolkit";
import { HYDRATE } from "next-redux-wrapper";
import mouseDrag from "./mouseDrag";

const reducer = (state: any, action: any) => {
  if (action.type === HYDRATE) {
    return { ...state, ...action.payload };
  }
  return combineReducers({ mouseDrag })(state, action);
};

export default reducer;
