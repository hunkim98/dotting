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

  const getData = useCallback(() => ref.current?.getData(), [ref.current]);

  const getDataArray = useCallback(() => ref.current?.getDataArray(), [ref]);

  const getGridIndices = useCallback(
    () => ref.current?.getGridIndices(),
    [ref]
  );

  const getDimensions = useCallback(() => ref.current?.getDimensions(), [ref]);

  const colorPixels = useCallback(
    (changes: PixelModifyData) => {
      ref.current?.colorPixels(changes);
    },
    [ref]
  );

  return {
    clear,
    getData,
    getDataArray,
    getGridIndices,
    getDimensions,
    colorPixels,
  };
};

export default useDotting;
