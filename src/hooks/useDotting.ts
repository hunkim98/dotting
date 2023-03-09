import {
  ForwardedRef,
  forwardRef,
  MutableRefObject,
  RefObject,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { PixelModifyData } from "../components/Canvas/types";
import { DottingRef } from "../components/Dotting";

const useDotting = (ref: MutableRefObject<DottingRef>) => {
  const clear = useCallback(() => {
    ref.current?.clear();
  }, [ref]);

  const colorPixels = useCallback(
    (changes: PixelModifyData) => {
      ref.current?.colorPixels(changes);
    },
    [ref]
  );

  const erasePixels = useCallback((changes: PixelModifyData) => {}, [ref]);

  return {
    clear,
    colorPixels,
  };
};

export default useDotting;
