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
  DottingData,
  PixelModifyData,
  PixelData,
  CanvasEvents,
  CanvasDataChangeHandler,
  CanvasGridChangeHandler,
  CanvasStrokeEndHandler,
  CanvasEventHandlerType,
} from "./Canvas/types";

export interface DottingProps {
  width: number | string;
  height: number | string;
  columnCount?: number;
  rowCount?: number;
  ref?: ForwardedRef<DottingRef>;
}

const DefaultDottingColumnCount = 5;
const DefaultDottingRowCount = 5;

export interface DottingRef {
  clear: () => void;
  colorPixels: (data: PixelModifyData) => void;
  changeBrushColor: (color: string) => void;
  // for useHandler
  addDataChangeListener: (listener: CanvasDataChangeHandler) => void;
  removeDataChangeListener: (listener: CanvasDataChangeHandler) => void;
  addGridChangeListener: (listener: CanvasGridChangeHandler) => void;
  removeGridChangeListener: (listener: CanvasGridChangeHandler) => void;
  addStrokeEndListener: (listener: CanvasStrokeEndHandler) => void;
  removeStrokeEndListener: (listener: CanvasStrokeEndHandler) => void;
  // initial data
  initColumnCount: number;
  initRowCount: number;
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
      const canvas = new Canvas(canvasRef);
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
      console.log("added listener!", canvas);
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

  const changeBrushColor = useCallback(
    (color: string) => {
      canvas?.changeBrushColor(color);
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
      // for useDotting
      clear,
      colorPixels,
      // for useBrush
      changeBrushColor,
      // for useHandler
      addDataChangeListener,
      removeDataChangeListener,
      addGridChangeListener,
      removeGridChangeListener,
      addStrokeEndListener,
      removeStrokeEndListener,
      // initial Data
      initColumnCount: props.columnCount
        ? props.columnCount
        : DefaultDottingColumnCount,
      initRowCount: props.rowCount ? props.rowCount : DefaultDottingRowCount,
    }),
    [clear]
  );

  return (
    <div
      style={{ width: props.width, height: props.height }}
      ref={containerRef}
    >
      <canvas ref={gotRef} style={{ border: "1px solid black" }} />
    </div>
  );
});

export default Dotting;
