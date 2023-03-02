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

const RefObjectNotSetError = new Error(
  "Ref Object is not linked with Dotting component,\
   Please connect the ref object with the Dotting component."
);

const useDotting = (ref: MutableRefObject<DottingRef>) => {
  const clear = useCallback(() => {
    ref.current?.clear();
  }, [ref]);

  const changePixelColor = useCallback(
    (changes: PixelModifyData) => {
      ref.current?.changePixelColor(changes);
    },
    [ref]
  );

  return {
    clear,
    changePixelColor,
  };
};

export default useDotting;
