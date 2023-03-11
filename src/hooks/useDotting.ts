import {
  ForwardedRef,
  forwardRef,
  MutableRefObject,
  RefObject,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { PixelModifyItem } from "../components/Canvas/types";
import { DottingRef } from "../components/Dotting";

const useDotting = (ref: MutableRefObject<DottingRef>) => {
  const clear = useCallback(() => {
    ref.current?.clear();
  }, [ref]);

  const colorPixels = useCallback(
    (changes: Array<PixelModifyItem>) => {
      ref.current?.colorPixels(changes);
    },
    [ref]
  );

  const erasePixels = useCallback(
    (changes: Array<{ rowIndex: number; columnIndex: number }>) => {
      ref.current?.erasePixels(changes);
    },
    [ref]
  );

  return {
    clear,
    colorPixels,
    erasePixels,
  };
};

export default useDotting;
