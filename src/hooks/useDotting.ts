import { MutableRefObject, useCallback } from "react";

import {
  AddGridIndicesParams,
  DeleteGridIndicesParams,
  ImageDownloadOptions,
  LayerProps,
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
    (options: ImageDownloadOptions) => {
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

  const setData = useCallback(
    (data: Array<Array<PixelModifyItem>>) => {
      ref.current?.setData(data);
    },
    [ref],
  );

  const setLayers = useCallback(
    (layers: Array<LayerProps>) => {
      ref.current?.setLayers(layers);
    },
    [ref],
  );

  const addGridIndices = useCallback(
    (params: AddGridIndicesParams) => {
      ref.current?.addGridIndices(params);
    },
    [ref],
  );

  const deleteGridIndices = useCallback(
    (params: DeleteGridIndicesParams) => {
      ref.current?.deleteGridIndices(params);
    },
    [ref],
  );

  const getForegroundCanvas = useCallback(() => {
    return ref.current?.getForegroundCanvas();
  }, [ref]);

  const getBackgroundCanvas = useCallback(() => {
    return ref.current?.getBackgroundCanvas();
  }, [ref]);

  const convertWorldPosToCanvasOffset = useCallback(
    (x: number, y: number) => {
      return ref.current?.convertWorldPosToCanvasOffset(x, y);
    },
    [ref],
  );

  return {
    clear,
    colorPixels,
    erasePixels,
    downloadImage,
    setIndicatorPixels,
    undo,
    redo,
    setData,
    setLayers,
    addGridIndices,
    deleteGridIndices,
    getForegroundCanvas,
    getBackgroundCanvas,
    convertWorldPosToCanvasOffset,
  };
};

export default useDotting;
