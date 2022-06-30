import { AnyAction, Reducer } from "@reduxjs/toolkit";

export enum historyAction {
  UNDO = "UNDO",
  REDO = "REDO",
}

export const undoHistory = () => {
  type: historyAction.UNDO;
};

export const redoHistory = () => {
  type: historyAction.REDO;
};

export function undoable(reducer: Reducer): Reducer {
  // Call the reducer with empty action to populate the initial state
  const initialState = {
    past: [],
    present: reducer(undefined, {
      type: undefined,
    }),
    future: [],
  };

  // Return a reducer that handles undo and redo
  return function (state = initialState, action: AnyAction) {
    const { past, present, future } = state;

    switch (action.type) {
      case historyAction.UNDO:
        const previous = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);
        return {
          past: newPast,
          present: previous,
          future: [present, ...future],
        };
      case historyAction.REDO:
        const next = future[0];
        const newFuture = future.slice(1);
        return {
          past: [...past, present],
          present: next,
          future: newFuture,
        };
      default:
        // Delegate handling the action to the passed reducer
        const newPresent = reducer(present, action);
        if (present === newPresent) {
          return state;
        }
        return {
          past: [...past, present],
          present: newPresent,
          future: [],
        };
    }
  };
}
