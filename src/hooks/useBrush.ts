import { MutableRefObject, useCallback, useEffect, useState } from "react";
import { BrushMode } from "../components/Canvas/types";
import { DottingRef } from "../components/Dotting";
import useHandlers from "./useHandlers";

const useBrush = (ref: MutableRefObject<DottingRef | null>) => {
  const [brushMode, setBrushMode] = useState<BrushMode>(BrushMode.DOT);
  const [brushColor, setBrushColor] = useState<string>("");
  const { addBrushChangeListener, removeBrushChangeListener } =
    useHandlers(ref);

  useEffect(() => {
    const listener = (brushColor: string, brushMode: BrushMode) => {
      setBrushMode(brushMode);
      setBrushColor(brushColor);
    };
    addBrushChangeListener(listener);
    return () => {
      removeBrushChangeListener(listener);
    };
  }, [addBrushChangeListener, removeBrushChangeListener]);
  const changeBrushColor = useCallback(
    (brushColor: string) => {
      ref.current?.changeBrushColor(brushColor);
    },
    [ref],
  );

  const changeBrushMode = useCallback(
    (brushMode: BrushMode) => {
      ref.current?.changeBrushMode(brushMode);
    },
    [ref],
  );

  return {
    changeBrushColor,
    changeBrushMode,
    brushMode,
    brushColor,
  };
};

export default useBrush;
