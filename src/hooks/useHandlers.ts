import { MutableRefObject, useCallback } from "react";

import {
  CanvasBrushChangeHandler,
  CanvasDataChangeHandler,
  CanvasGridChangeHandler,
  CanvasHoverPixelChangeHandler,
  CanvasStrokeEndHandler,
} from "../components/Canvas/types";
import { DottingRef } from "../components/Dotting";

const useHandlers = (ref: MutableRefObject<DottingRef | null>) => {
  const addDataChangeListener = useCallback(
    (listener: CanvasDataChangeHandler) => {
      ref.current?.addDataChangeListener(listener);
    },
    [ref],
  );

  const removeDataChangeListener = useCallback(
    (listener: CanvasDataChangeHandler) => {
      ref.current?.removeDataChangeListener(listener);
    },
    [ref],
  );

  const addGridChangeListener = useCallback(
    (listener: CanvasGridChangeHandler) => {
      ref.current?.addGridChangeListener(listener);
    },
    [ref],
  );

  const removeGridChangeListener = useCallback(
    (listener: CanvasGridChangeHandler) => {
      ref.current?.removeGridChangeListener(listener);
    },
    [ref],
  );

  const addBrushChangeListener = useCallback(
    (listener: CanvasBrushChangeHandler) => {
      ref.current?.addBrushChangeListener(listener);
    },
    [ref],
  );

  const removeBrushChangeListener = useCallback(
    (listener: CanvasBrushChangeHandler) => {
      ref.current?.removeBrushChangeListener(listener);
    },
    [ref],
  );

  const addStrokeEndListener = useCallback(
    (listener: CanvasStrokeEndHandler) => {
      ref.current?.addStrokeEndListener(listener);
    },
    [ref],
  );

  const removeStrokeEndListener = useCallback(
    (listener: CanvasStrokeEndHandler) => {
      ref.current?.removeStrokeEndListener(listener);
    },
    [ref],
  );

  const addHoverPixelChangeListener = useCallback(
    (listener: CanvasHoverPixelChangeHandler) => {
      ref.current?.addHoverPixelChangeListener(listener);
    },
    [ref],
  );

  const removeHoverPixelChangeListener = useCallback(
    (listener: CanvasHoverPixelChangeHandler) => {
      ref.current?.removeHoverPixelChangeListener(listener);
    },
    [ref],
  );

  const addCanvasElementEventListener = useCallback(
    (event: string, listener: EventListenerOrEventListenerObject) => {
      ref.current?.addCanvasElementEventListener(event, listener);
    },
    [ref],
  );

  const removeCanvasElementEventListener = useCallback(
    (event: string, listener: EventListenerOrEventListenerObject) => {
      ref.current?.removeCanvasElementEventListener(event, listener);
    },
    [ref],
  );

  return {
    addDataChangeListener,
    removeDataChangeListener,
    addGridChangeListener,
    removeGridChangeListener,
    addBrushChangeListener,
    removeBrushChangeListener,
    addStrokeEndListener,
    removeStrokeEndListener,
    addHoverPixelChangeListener,
    removeHoverPixelChangeListener,
    // Below are for canvas element listener
    addCanvasElementEventListener,
    removeCanvasElementEventListener,
  };
};

export default useHandlers;
