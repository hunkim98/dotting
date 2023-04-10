import {
  ForwardedRef,
  forwardRef,
  MutableRefObject,
  RefObject,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  ImageDownloadOptions,
  PixelModifyItem,
} from "../components/Canvas/types";
import { DottingRef } from "../components/Dotting";

const useDotting = (ref: MutableRefObject<DottingRef | null>) => {
  const clear = useCallback(() => {
    ref.current?.clear();
  }, [ref]);

  const colorPixels = useCallback(
    (changes: Array<PixelModifyItem>) => {
      ref.current?.colorPixels(changes);
    },
    [ref],
  );

  const erasePixels = useCallback(
    (changes: Array<{ rowIndex: number; columnIndex: number }>) => {
      ref.current?.erasePixels(changes);
    },
    [ref],
  );

  const downloadImage = useCallback(
    (options?: ImageDownloadOptions) => {
      ref.current?.downloadImage(options);
    },
    [ref],
  );

  const setIndicatorPixels = useCallback(
    (indicators: Array<PixelModifyItem>) => {
      ref.current?.setIndicatorPixels(indicators);
    },
    [ref],
  );

  const undo = useCallback(() => {
    ref.current?.undo();
  }, [ref]);

  const redo = useCallback(() => {
    ref.current?.redo();
  }, [ref]);

  return {
    clear,
    colorPixels,
    erasePixels,
    downloadImage,
    setIndicatorPixels,
    undo,
    redo,
  };
};

export default useDotting;
