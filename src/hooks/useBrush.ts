import { MutableRefObject, useCallback, useEffect, useState } from "react";

import useHandlers from "./useHandlers";
import {
  BRUSH_PATTERN_ELEMENT,
  BrushPattern,
  BrushTool,
  CanvasBrushChangeParams,
} from "../components/Canvas/types";
import { DottingRef } from "../components/Dotting";

const useBrush = (ref: MutableRefObject<DottingRef | null>) => {
  const [brushTool, setBrushTool] = useState<BrushTool>(BrushTool.DOT);
  const [brushColor, setBrushColor] = useState<string>("");
  const [brushAlpha, setBrushAlpha] = useState(1);
  const [brushPattern, setBrushPattern] = useState<BrushPattern>([
    [BRUSH_PATTERN_ELEMENT.FILL],
  ]);
  const { addBrushChangeListener, removeBrushChangeListener } =
    useHandlers(ref);

  useEffect(() => {
    const listener = ({
      brushColor,
      brushAlpha,
      brushTool,
      brushPattern,
    }: CanvasBrushChangeParams) => {
      setBrushTool(brushTool);
      setBrushColor(brushColor);
      setBrushAlpha(brushAlpha);
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
    (brushPattern: BrushPattern) => {
      ref.current?.changeBrushPattern(brushPattern);
    },
    [ref],
  );

  const changeBrushAlpha = useCallback(
    (brushAlpha: number) => {
      ref.current?.changeBrushAlpha(brushAlpha);
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
    changeBrushAlpha,
    changeBrushTool,
    changeBrushPattern,
    brushTool,
    brushColor,
    brushAlpha,
    brushPattern,
  };
};

export default useBrush;
