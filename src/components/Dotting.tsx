import React, {
  ForwardedRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { forwardRef, useRef } from "react";
import Canvas from "./Canvas";
import {
  PixelData,
  CanvasEvents,
  CanvasDataChangeHandler,
  CanvasGridChangeHandler,
  CanvasStrokeEndHandler,
  CanvasEventHandlerType,
  BrushMode,
  CanvasBrushChangeHandler,
  PixelModifyItem,
  ImageDownloadOptions,
} from "./Canvas/types";

export interface DottingProps {
  width: number | string;
  height: number | string;
  isGridVisible?: boolean;
  initData?: Array<Array<PixelData>>;
  initIndicatorData?: Array<PixelModifyItem>;
  isPanZoomable?: boolean;
  isGridFixed?: boolean;
  ref?: ForwardedRef<DottingRef>;
  initBrushColor?: string;
}

export interface DottingRef {
  // for useDotting
  clear: () => void;
  colorPixels: (data: Array<PixelModifyItem>) => void;
  erasePixels: (data: Array<{ rowIndex: number; columnIndex: number }>) => void;
  downloadImage: (options?: ImageDownloadOptions) => void;
  setIndicatorPixels: (data: Array<PixelModifyItem>) => void;
  // for useBrush
  changeBrushColor: (color: string) => void;
  changeBrushMode: (mode: BrushMode) => void;
  // for useHandler
  addDataChangeListener: (listener: CanvasDataChangeHandler) => void;
  removeDataChangeListener: (listener: CanvasDataChangeHandler) => void;
  addGridChangeListener: (listener: CanvasGridChangeHandler) => void;
  removeGridChangeListener: (listener: CanvasGridChangeHandler) => void;
  addBrushChangeListener: (listener: CanvasBrushChangeHandler) => void;
  removeBrushChangeListener: (listener: CanvasBrushChangeHandler) => void;
  addStrokeEndListener: (listener: CanvasStrokeEndHandler) => void;
  removeStrokeEndListener: (listener: CanvasStrokeEndHandler) => void;
  // initial data
}

// forward ref makes the a ref used in a FC component used in the place that uses the FC component
const Dotting = forwardRef<DottingRef, DottingProps>(function Dotting(
  props: DottingProps,
  ref: ForwardedRef<DottingRef>
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [dataChangeListeners, setDataChangeListeners] = useState<
    CanvasDataChangeHandler[]
  >([]);
  const [gridChangeListeners, setGridChangeListeners] = useState<
    CanvasGridChangeHandler[]
  >([]);
  const [strokeEndListeners, setStrokeEndListeners] = useState<
    CanvasStrokeEndHandler[]
  >([]);
  const [brushChangeListeners, setBrushChangeListeners] = useState<
    CanvasBrushChangeHandler[]
  >([]);

  useEffect(() => {
    if (!canvas) {
      return;
    }
    canvas.setIsGridFixed(props.isGridFixed);
  }, [canvas, props.isGridFixed]);

  useEffect(() => {
    if (!canvas) {
      return;
    }
    canvas.setIsGridVisible(props.isGridVisible);
  }, [canvas, props.isGridVisible]);

  useEffect(() => {
    if (!canvas) {
      return;
    }
    canvas.setIsPanZoomable(props.isPanZoomable);
  }, [canvas, props.isPanZoomable]);

  useEffect(() => {
    if (!canvas) {
      return;
    }
    gridChangeListeners.forEach((listener) => {
      canvas.addEventListener(CanvasEvents.GRID_CHANGE, listener);
    });
    // The below is to emit the initial grid event
    canvas.emitGridEvent();
    return () => {
      gridChangeListeners.forEach((listener) => {
        canvas?.removeEventListener(CanvasEvents.GRID_CHANGE, listener);
      });
    };
  }, [canvas, gridChangeListeners]);

  useEffect(() => {
    if (!canvas) {
      return;
    }
    dataChangeListeners.forEach((listener) => {
      canvas.addEventListener(CanvasEvents.DATA_CHANGE, listener);
    });
    canvas.emitDataEvent();
    return () => {
      dataChangeListeners.forEach((listener) => {
        canvas?.removeEventListener(CanvasEvents.DATA_CHANGE, listener);
      });
    };
  }, [canvas, dataChangeListeners]);

  useEffect(() => {
    if (!canvas) {
      return;
    }
    brushChangeListeners.forEach((listener) => {
      canvas.addEventListener(CanvasEvents.BRUSH_CHANGE, listener);
    });
    canvas.emitBrushChangeEvent();
    return () => {
      brushChangeListeners.forEach((listener) => {
        canvas?.removeEventListener(CanvasEvents.BRUSH_CHANGE, listener);
      });
    };
  }, [canvas, brushChangeListeners]);

  useEffect(() => {
    if (!canvas) {
      return;
    }
    strokeEndListeners.forEach((listener) => {
      canvas.addEventListener(CanvasEvents.STROKE_END, listener);
    });
    return () => {
      strokeEndListeners.forEach((listener) => {
        canvas?.removeEventListener(CanvasEvents.STROKE_END, listener);
      });
    };
  }, [canvas, strokeEndListeners]);

  // We put resize handler
  useEffect(() => {
    const onResize = () => {
      if (containerRef.current && canvas) {
        const dpr = window.devicePixelRatio;
        const rect = containerRef.current.getBoundingClientRect();
        canvas.setSize(rect.width, rect.height, dpr);
        canvas.scale(dpr, dpr);
        canvas.render();
      }
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [canvas, containerRef, props.height, props.width]);

  // Reference: https://github.com/ascorbic/react-artboard/blob/main/src/components/Artboard.tsx
  const gotRef = useCallback(
    (canvasRef: HTMLCanvasElement) => {
      if (!canvasRef) {
        return;
      }
      const canvas = new Canvas(
        canvasRef,
        props.initData,
        props.isPanZoomable,
        props.isGridVisible,
        props.isGridFixed,
        props.initBrushColor,
        props.initIndicatorData
      );
      setCanvas(canvas);
    },
    [history]
  );

  const addDataChangeListener = useCallback(
    (listener: CanvasDataChangeHandler) => {
      setDataChangeListeners((listeners) => [...listeners, listener]);
    },
    []
  );

  const removeDataChangeListener = useCallback(
    (listener: CanvasDataChangeHandler) => {
      canvas.removeEventListener(CanvasEvents.DATA_CHANGE, listener);
      setDataChangeListeners((listeners) =>
        listeners.filter((l) => l !== listener)
      );
    },
    [canvas]
  );

  const addGridChangeListener = useCallback(
    (listener: CanvasGridChangeHandler) => {
      setGridChangeListeners((listeners) => [...listeners, listener]);
    },
    []
  );

  const removeGridChangeListener = useCallback(
    (listener: CanvasGridChangeHandler) => {
      canvas.removeEventListener(CanvasEvents.GRID_CHANGE, listener);
      setGridChangeListeners((listeners) =>
        listeners.filter((l) => l !== listener)
      );
    },
    [canvas]
  );

  const addBrushChangeListener = useCallback(
    (listener: CanvasBrushChangeHandler) => {
      setBrushChangeListeners((listeners) => [...listeners, listener]);
    },
    []
  );

  const removeBrushChangeListener = useCallback(
    (listener: CanvasBrushChangeHandler) => {
      canvas.removeEventListener(CanvasEvents.BRUSH_CHANGE, listener);
      setBrushChangeListeners((listeners) =>
        listeners.filter((l) => l !== listener)
      );
    },
    [canvas]
  );

  const addStrokeEndListener = useCallback(
    (listener: CanvasStrokeEndHandler) => {
      setStrokeEndListeners((listeners) => [...listeners, listener]);
    },
    []
  );

  const removeStrokeEndListener = useCallback(
    (listener: CanvasStrokeEndHandler) => {
      canvas.removeEventListener(CanvasEvents.STROKE_END, listener);
      setStrokeEndListeners((listeners) =>
        listeners.filter((l) => l !== listener)
      );
    },
    [canvas]
  );

  const addEventListener = useCallback(
    (type: CanvasEvents, listener: CanvasEventHandlerType) => {
      canvas?.addEventListener(type, listener);
    },
    [canvas]
  );

  const removeEventListener = useCallback(
    (type: CanvasEvents, listener: CanvasEventHandlerType) => {
      canvas?.removeEventListener(type, listener);
    },
    [canvas]
  );

  const clear = useCallback(() => canvas?.clear(), [canvas]);

  const colorPixels = useCallback(
    (
      changes: Array<{ rowIndex: number; columnIndex: number; color: string }>
    ) => {
      canvas?.colorPixels(changes);
    },
    [canvas]
  );

  const erasePixels = useCallback(
    (changes: Array<{ rowIndex: number; columnIndex: number }>) => {
      canvas?.erasePixels(changes);
    },
    [canvas]
  );

  const setIndicatorPixels = useCallback(
    (indicators: Array<PixelModifyItem>) => {
      canvas?.setIndicatorPixels(indicators);
    },
    [canvas]
  );

  const downloadImage = useCallback(
    (options?: ImageDownloadOptions) => {
      canvas?.downloadImage(options);
    },
    [canvas]
  );

  const changeBrushColor = useCallback(
    (color: string) => {
      canvas?.changeBrushColor(color);
    },
    [canvas]
  );

  const changeBrushMode = useCallback(
    (brushMode: BrushMode) => {
      canvas?.changeBrushMode(brushMode);
    },
    [canvas]
  );

  // useImperativeHandle makes the ref used in the place that uses the FC component
  // We will make our DotterRef manipulatable with the following functions
  useImperativeHandle(
    ref,
    () => ({
      addEventListener,
      removeEventListener,
      setIndicatorPixels,
      // for useDotting
      clear,
      colorPixels,
      erasePixels,
      downloadImage,
      // for useBrush
      changeBrushColor,
      changeBrushMode,
      // for useHandler
      addDataChangeListener,
      removeDataChangeListener,
      addGridChangeListener,
      removeGridChangeListener,
      addBrushChangeListener,
      removeBrushChangeListener,
      addStrokeEndListener,
      removeStrokeEndListener,
      // initial Data
    }),
    [clear]
  );

  return (
    <div
      style={{ width: props.width, height: props.height }}
      ref={containerRef}
    >
      <canvas
        ref={gotRef}
        style={{ border: "1px solid black", touchAction: "none" }}
      />
    </div>
  );
});

export default Dotting;