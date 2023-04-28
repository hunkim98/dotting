import { MutableRefObject, useCallback, useEffect, useState } from "react";
import { BrushTool } from "../components/Canvas/types";
import { DottingRef } from "../components/Dotting";
import useHandlers from "./useHandlers";

const useBrush = (ref: MutableRefObject<DottingRef | null>) => {
  const [brushTool, setBrushTool] = useState<BrushTool>(BrushTool.DOT);
  const [brushColor, setBrushColor] = useState<string>("");
  const { addBrushChangeListener, removeBrushChangeListener } =
    useHandlers(ref);

  useEffect(() => {
    const listener = (brushColor: string, brushMode: BrushTool) => {
      setBrushTool(brushMode);
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

  const changeBrushTool = useCallback(
    (brushMode: BrushTool) => {
      ref.current?.changeBrushTool(brushMode);
    },
    [ref],
  );

  return {
    changeBrushColor,
    changeBrushTool,
    brushTool,
    brushColor,
  };
};

export default useBrush;
