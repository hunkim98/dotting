import {
  configureStore,
  createStore,
  getDefaultMiddleware,
} from "@reduxjs/toolkit";
import { createWrapper } from "next-redux-wrapper";
import rootReducer from "./modules";

export const store = () => {
  const store = configureStore({
    reducer: rootReducer,
    // middleware: [...getDefaultMiddleware()],
  });
  return store;
};

const wrapper = createWrapper(store, {
  debug: process.env.NODE_ENV === "development",
});

export default wrapper;
