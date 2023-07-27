import { MutableRefObject, useCallback, useEffect, useState } from "react";

import useHandlers from "./useHandlers";
import {
  BRUSH_PATTERN_ELEMENT,
  BrushTool,
  CanvasBrushChangeParams,
} from "../components/Canvas/types";
import { DottingRef } from "../components/Dotting";

const useBrush = (ref: MutableRefObject<DottingRef | null>) => {
  const [brushTool, setBrushTool] = useState<BrushTool>(BrushTool.DOT);
  const [brushColor, setBrushColor] = useState<string>("");
  const [brushPattern, setBrushPattern] = useState<
    Array<Array<BRUSH_PATTERN_ELEMENT>>
  >([[BRUSH_PATTERN_ELEMENT.FILL]]);
  const { addBrushChangeListener, removeBrushChangeListener } =
    useHandlers(ref);

  useEffect(() => {
    const listener = ({
      brushColor,
      brushTool,
      brushPattern,
    }: CanvasBrushChangeParams) => {
      setBrushTool(brushTool);
      setBrushColor(brushColor);
      setBrushPattern(brushPattern);
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

  const changeBrushPattern = useCallback(
    (brushPattern: Array<Array<BRUSH_PATTERN_ELEMENT>>) => {
      ref.current?.changeBrushPattern(brushPattern);
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
    changeBrushPattern,
    brushTool,
    brushColor,
    brushPattern,
  };
};

export default useBrush;
