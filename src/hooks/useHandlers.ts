import { MutableRefObject, useCallback } from "react";
import {
  CanvasDataChangeHandler,
  CanvasGridChangeHandler,
  CanvasStrokeEndHandler,
} from "../components/Canvas/types";
import { DottingRef } from "../components/Dotting";

const useHandlers = (ref: MutableRefObject<DottingRef>) => {
  const addDataChangeListener = useCallback(
    (listener: CanvasDataChangeHandler) => {
      ref.current?.addDataChangeListener(listener);
    },
    [ref]
  );

  const removeDataChangeListener = useCallback(
    (listener: CanvasDataChangeHandler) => {
      ref.current?.removeDataChangeListener(listener);
    },
    [ref]
  );

  const addGridChangeListener = useCallback(
    (listener: CanvasGridChangeHandler) => {
      ref.current?.addGridChangeListener(listener);
    },
    [ref]
  );

  const removeGridChangeListener = useCallback(
    (listener: CanvasGridChangeHandler) => {
      ref.current?.removeGridChangeListener(listener);
    },
    [ref]
  );

  const addStrokeEndListener = useCallback(
    (listener: CanvasStrokeEndHandler) => {
      ref.current?.addStrokeEndListener(listener);
    },
    [ref]
  );

  const removeStrokeEndListener = useCallback(
    (listener: CanvasStrokeEndHandler) => {
      ref.current?.removeStrokeEndListener(listener);
    },
    [ref]
  );

  return {
    addDataChangeListener,
    removeDataChangeListener,
    addGridChangeListener,
    removeGridChangeListener,
    addStrokeEndListener,
    removeStrokeEndListener,
  };
};

export default useHandlers;
