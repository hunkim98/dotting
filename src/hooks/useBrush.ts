import { MutableRefObject, useCallback } from "react";
import { DottingRef } from "../components/Dotting";

const useBrush = (ref: MutableRefObject<DottingRef>) => {
  const changeBrushColor = useCallback(
    (brushColor: string) => {
      ref.current?.changeBrushColor(brushColor);
    },
    [ref]
  );

  return {
    changeBrushColor,
  };
};

export default useBrush;
