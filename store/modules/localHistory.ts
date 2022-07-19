import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  actionRecord,
  laneChangeActionType,
  pixelAction,
  pixelChangeActionType,
  pixelDataElement,
} from "./pixelData";

const initialState: localHistoryType = {
  past: [],
  future: [],
  actionRecord: undefined,
};

export type oppositeAction = {
  target: pixelDataElement[];
  type: pixelChangeActionType | laneChangeActionType;
  isPolluted: boolean;
  affectedLaneKey?: number;
};

export type localHistoryType = {
  past: Array<pixelAction & { isPolluted: boolean }>;
  future: Array<pixelAction & { isPolluted: boolean }>;
  actionRecord: oppositeAction | undefined;
};

const getTargetAction = ({
  convertedPixelAction,
  action,
}: {
  convertedPixelAction: pixelAction & { isPolluted: boolean };
  action: "undo" | "redo";
}): oppositeAction => {
  if (action === "undo") {
    return {
      target: convertedPixelAction.before,
      type: convertedPixelAction.type,
      isPolluted: convertedPixelAction.isPolluted,
    };
  } else {
    return {
      target: convertedPixelAction.after,
      type: convertedPixelAction.type,
      isPolluted: convertedPixelAction.isPolluted,
    };
  }
};

const convertActionType = (
  action: pixelAction & { isPolluted: boolean }
): pixelAction & { isPolluted: boolean } => {
  const actionType = action.type;
  if (actionType in pixelChangeActionType) {
    return action;
  } else {
    const oppositeLaneAction = convertLaneActionType(
      actionType as laneChangeActionType
    );
    return {
      type: oppositeLaneAction,
      before: action.before,
      after: action.after,
      isPolluted: action.isPolluted,
    };
  }
};

// const revertOppositeActionToOriginal = (action)

const convertLaneActionType = (
  action: laneChangeActionType
): laneChangeActionType => {
  switch (action) {
    case laneChangeActionType.ADD_BOTTOM_LANE:
      return laneChangeActionType.REMOVE_BOTTOM_LANE;
    case laneChangeActionType.ADD_LEFT_LANE:
      return laneChangeActionType.REMOVE_LEFT_LANE;
    case laneChangeActionType.ADD_RIGHT_LANE:
      return laneChangeActionType.REMOVE_RIGHT_LANE;
    case laneChangeActionType.ADD_TOP_LANE:
      return laneChangeActionType.REMOVE_TOP_LANE;
    case laneChangeActionType.REMOVE_BOTTOM_LANE:
      return laneChangeActionType.ADD_BOTTOM_LANE;
    case laneChangeActionType.REMOVE_LEFT_LANE:
      return laneChangeActionType.ADD_LEFT_LANE;
    case laneChangeActionType.REMOVE_RIGHT_LANE:
      return laneChangeActionType.ADD_RIGHT_LANE;
    case laneChangeActionType.REMOVE_TOP_LANE:
      return laneChangeActionType.ADD_TOP_LANE;
  }
};

const localHistorySlice = createSlice({
  name: "localHistory",
  initialState,
  reducers: {
    initialize: (state) => {
      state.past = [];
      state.future = [];
    },
    update: (state, data: PayloadAction<{ action: pixelAction }>) => {
      state.past = [
        ...state.past,
        { ...data.payload.action, isPolluted: false },
      ];
      if (state.future.length !== 0) {
        state.future = [];
      }
    },

    undo: (state) => {
      if (state.past.length > 0) {
        const previous = state.past[state.past.length - 1]; //previous is the opposite action
        const pixelActionWithConvertedType = convertActionType(previous);
        const targetAction = getTargetAction({
          convertedPixelAction: pixelActionWithConvertedType,
          action: "undo",
        });
        const newPast = state.past.slice(0, state.past.length - 1);
        state.past = newPast;
        state.actionRecord = targetAction;
        state.future = [previous, ...state.future];
      }
      //since we need to track polluted content every time a peer commits an action,
      //we limit the length of past
      if (state.past.length > 30) {
        //we remove the oldest record
        state.past = state.past.slice(0, state.past.length);
      }
    },
    redo: (state) => {
      if (state.future.length > 0) {
        const next = state.future[0];
        const newFuture = state.future.slice(1);
        state.future = newFuture;
        //for redo, we do not need to convert the action type
        state.actionRecord = getTargetAction({
          convertedPixelAction: next,
          action: "redo",
        });
        state.past = [...state.past, next];
      }
    },

    //this is for cases when the other player has overriden the user
    //this just removes the
    checkPollution: (
      state,
      peerAction: PayloadAction<{
        target: pixelDataElement[];
      }>
    ) => {
      outerloop: for (let i = state.past.length - 1; i >= 0; i--) {
        const pastElement = state.past[i];
        const pastElementType = state.past[i].type;
        // const pastElementToCheck = (pastElementType in laneChangeActionType) ?
        if (pastElement.isPolluted) {
          break;
        }
        for (const peerElement of peerAction.payload.target) {
          if (pastElementType in laneChangeActionType) {
            if (!pastElement.affectedLaneKey) {
              throw Error("the affected lane key is not specified");
            }
            switch (pastElementType) {
              case laneChangeActionType.ADD_BOTTOM_LANE ||
                laneChangeActionType.REMOVE_BOTTOM_LANE ||
                laneChangeActionType.ADD_TOP_LANE ||
                laneChangeActionType.REMOVE_TOP_LANE:
                if (peerElement.rowIndex === pastElement.affectedLaneKey) {
                  state.past[i].isPolluted = true;
                  break outerloop;
                }
              case laneChangeActionType.ADD_LEFT_LANE ||
                laneChangeActionType.ADD_RIGHT_LANE ||
                laneChangeActionType.REMOVE_LEFT_LANE ||
                laneChangeActionType.ADD_LEFT_LANE:
                if (peerElement.columnIndex === pastElement.affectedLaneKey) {
                  state.past[i].isPolluted = true;
                  break outerloop;
                }
            }
          } else if (pastElementType in pixelChangeActionType) {
            for (const pastElementPixel of pastElement.before) {
              if (
                pastElementPixel.columnIndex === peerElement.columnIndex &&
                pastElementPixel.rowIndex === peerElement.rowIndex
              ) {
                state.past[i].isPolluted = true;
                break outerloop;
              }
            }
          }
        }
      }
    },
  },
});

const { reducer, actions } = localHistorySlice;
export const { update, undo, redo, checkPollution, initialize } = actions;
export default reducer;
