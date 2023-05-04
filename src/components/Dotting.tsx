import React, {
  ForwardedRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { forwardRef, useRef } from "react";
import {
  PixelData,
  CanvasEvents,
  CanvasDataChangeHandler,
  CanvasGridChangeHandler,
  CanvasStrokeEndHandler,
  BrushTool,
  CanvasBrushChangeHandler,
  PixelModifyItem,
  ImageDownloadOptions,
  CanvasHoverPixelChangeHandler,
} from "./Canvas/types";
import Editor from "./Canvas/Editor";

export interface DottingProps {
  width: number | string;
  height: number | string;
  style?: React.CSSProperties;
  gridStrokeColor?: string;
  gridStrokeWidth?: number;
  isGridVisible?: boolean;
  backgroundMode?: "checkerboard" | "color";
  backgroundColor?: React.CSSProperties["color"];
  backgroundAlpha?: number;
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
  undo: () => void;
  redo: () => void;
  // for useBrush
  changeBrushColor: (color: string) => void;
  changeBrushTool: (tool: BrushTool) => void;
  // for useHandler
  addDataChangeListener: (listener: CanvasDataChangeHandler) => void;
  removeDataChangeListener: (listener: CanvasDataChangeHandler) => void;
  addGridChangeListener: (listener: CanvasGridChangeHandler) => void;
  removeGridChangeListener: (listener: CanvasGridChangeHandler) => void;
  addBrushChangeListener: (listener: CanvasBrushChangeHandler) => void;
  removeBrushChangeListener: (listener: CanvasBrushChangeHandler) => void;
  addStrokeEndListener: (listener: CanvasStrokeEndHandler) => void;
  removeStrokeEndListener: (listener: CanvasStrokeEndHandler) => void;
  addHoverPixelChangeListener: (
    listener: CanvasHoverPixelChangeHandler,
  ) => void;
  removeHoverPixelChangeListener: (
    listener: CanvasHoverPixelChangeHandler,
  ) => void;
  // for canvas element event listeners
  addCanvasElementEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
  ) => void;
  removeCanvasElementEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
  ) => void;
}

// forward ref makes the a ref used in a FC component used in the place that uses the FC component
const Dotting = forwardRef<DottingRef, DottingProps>(function Dotting(
  props: DottingProps,
  ref: ForwardedRef<DottingRef>,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gridCanvas, setGridCanvas] = useState<HTMLCanvasElement | null>(null);
  const [dataCanvas, setDataCanvas] = useState<HTMLCanvasElement | null>(null);
  const [interactionCanvas, setInteractionCanvas] =
    useState<HTMLCanvasElement | null>(null);
  const [backgroundCanvas, setBackgroundCanvas] =
    useState<HTMLCanvasElement | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
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
  const [hoverPixelChangeListeners, setHoverPixelChangeListeners] = useState<
    CanvasHoverPixelChangeHandler[]
  >([]);

  const [canvasElementEventListeners, setCanvasElementEventListeners] =
    useState<
      Array<{
        type: string;
        listener: EventListenerOrEventListenerObject;
      }>
    >([]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.setIsGridFixed(props.isGridFixed);
  }, [editor, props.isGridFixed]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.setGridStrokeColor(props.gridStrokeColor);
  }, [editor, props.gridStrokeColor]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.setGridStrokeWidth(props.gridStrokeWidth);
  }, [editor, props.gridStrokeWidth]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.setIsGridVisible(props.isGridVisible);
  }, [editor, props.isGridVisible]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.setIsPanZoomable(props.isPanZoomable);
  }, [editor, props.isPanZoomable]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    gridChangeListeners.forEach(listener => {
      editor.addEventListener(CanvasEvents.GRID_CHANGE, listener);
    });
    // The below is to emit the initial grid event
    editor.emitGridEvent();
    return () => {
      gridChangeListeners.forEach(listener => {
        editor?.removeEventListener(CanvasEvents.GRID_CHANGE, listener);
      });
    };
  }, [editor, gridChangeListeners]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    dataChangeListeners.forEach(listener => {
      editor.addEventListener(CanvasEvents.DATA_CHANGE, listener);
    });
    editor.emitDataEvent();
    return () => {
      dataChangeListeners.forEach(listener => {
        editor?.removeEventListener(CanvasEvents.DATA_CHANGE, listener);
      });
    };
  }, [editor, dataChangeListeners]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    brushChangeListeners.forEach(listener => {
      editor.addEventListener(CanvasEvents.BRUSH_CHANGE, listener);
    });
    editor.emitBrushChangeEvent();
    return () => {
      brushChangeListeners.forEach(listener => {
        editor?.removeEventListener(CanvasEvents.BRUSH_CHANGE, listener);
      });
    };
  }, [editor, brushChangeListeners]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    strokeEndListeners.forEach(listener => {
      editor.addEventListener(CanvasEvents.STROKE_END, listener);
    });
    // Emitting initial strokeEnd listener is not necessary!
    return () => {
      strokeEndListeners.forEach(listener => {
        editor?.removeEventListener(CanvasEvents.STROKE_END, listener);
      });
    };
  }, [editor, strokeEndListeners]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    hoverPixelChangeListeners.forEach(listener => {
      editor.addEventListener(CanvasEvents.HOVER_PIXEL_CHANGE, listener);
    });
    editor.emitHoverPixelChangeEvent();
    return () => {
      hoverPixelChangeListeners.forEach(listener => {
        editor?.removeEventListener(CanvasEvents.HOVER_PIXEL_CHANGE, listener);
      });
    };
  }, [editor, hoverPixelChangeListeners]);

  // The below is to add event listeners directly to the canvas element
  // E.g. for mousemove, mousedown, mouseup, etc.
  useEffect(() => {
    if (!editor) {
      return;
    }
    canvasElementEventListeners.forEach(({ type, listener }) => {
      const canvasElement = editor.getCanvasElement();
      canvasElement.addEventListener(type, listener);
    });
    return () => {
      canvasElementEventListeners.forEach(({ type, listener }) => {
        const canvasElement = editor.getCanvasElement();
        canvasElement.removeEventListener(type, listener);
      });
    };
  }, [editor, canvasElementEventListeners]);

  // We put resize handler
  useEffect(() => {
    const onResize = () => {
      if (containerRef.current && editor) {
        const dpr = window.devicePixelRatio;
        const rect = containerRef.current.getBoundingClientRect();
        editor.setSize(rect.width, rect.height, dpr);
        editor.scale(dpr, dpr);
        editor.renderAll();
      }
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [editor, containerRef, props.height, props.width]);

  useEffect(() => {
    if (!gridCanvas || !interactionCanvas || !dataCanvas || !backgroundCanvas) {
      return;
    }
    const editor = new Editor({
      gridCanvas,
      interactionCanvas,
      dataCanvas,
      backgroundCanvas,
      initData: props.initData,
    });
    editor.setIsGridFixed(props.isGridFixed);
    editor.setBackgroundAlpha(props.backgroundAlpha);
    editor.setBackgroundMode(props.backgroundMode);
    editor.setIsPanZoomable(props.isPanZoomable);

    editor.setIsGridVisible(props.isGridVisible);

    editor.setGridStrokeColor(props.gridStrokeColor);

    editor.setGridStrokeWidth(props.gridStrokeWidth);

    editor.setBrushColor(props.initBrushColor);

    editor.setIndicatorPixels(props.initIndicatorData);

    setEditor(editor);

    return () => {
      editor.destroy();
    };
  }, [gridCanvas, interactionCanvas, dataCanvas, backgroundCanvas]);

  // Reference: https://github.com/ascorbic/react-artboard/blob/main/src/components/Artboard.tsx
  const gotGridCanvasRef = useCallback((element: HTMLCanvasElement) => {
    if (!element) {
      return;
    }
    element.style["touchAction"] = "none";
    setGridCanvas(element);
  }, []);

  const gotInteractionCanvasRef = useCallback((element: HTMLCanvasElement) => {
    if (!element) {
      return;
    }
    element.style["touchAction"] = "none";
    setInteractionCanvas(element);
  }, []);

  const gotDataCanvasRef = useCallback((element: HTMLCanvasElement) => {
    if (!element) {
      return;
    }
    element.style["touchAction"] = "none";
    setDataCanvas(element);
  }, []);

  const gotBackgroundCanvasRef = useCallback((element: HTMLCanvasElement) => {
    if (!element) {
      return;
    }
    element.style["touchAction"] = "none";
    setBackgroundCanvas(element);
  }, []);

  const addDataChangeListener = useCallback(
    (listener: CanvasDataChangeHandler) => {
      setDataChangeListeners(listeners => [...listeners, listener]);
    },
    [],
  );

  const removeDataChangeListener = useCallback(
    (listener: CanvasDataChangeHandler) => {
      editor.removeEventListener(CanvasEvents.DATA_CHANGE, listener);
      setDataChangeListeners(listeners =>
        listeners.filter(l => l !== listener),
      );
    },
    [editor],
  );

  const addGridChangeListener = useCallback(
    (listener: CanvasGridChangeHandler) => {
      setGridChangeListeners(listeners => [...listeners, listener]);
    },
    [],
  );

  const removeGridChangeListener = useCallback(
    (listener: CanvasGridChangeHandler) => {
      editor.removeEventListener(CanvasEvents.GRID_CHANGE, listener);
      setGridChangeListeners(listeners =>
        listeners.filter(l => l !== listener),
      );
    },
    [editor],
  );

  const addBrushChangeListener = useCallback(
    (listener: CanvasBrushChangeHandler) => {
      setBrushChangeListeners(listeners => [...listeners, listener]);
    },
    [],
  );

  const removeBrushChangeListener = useCallback(
    (listener: CanvasBrushChangeHandler) => {
      editor.removeEventListener(CanvasEvents.BRUSH_CHANGE, listener);
      setBrushChangeListeners(listeners =>
        listeners.filter(l => l !== listener),
      );
    },
    [editor],
  );

  const addStrokeEndListener = useCallback(
    (listener: CanvasStrokeEndHandler) => {
      setStrokeEndListeners(listeners => [...listeners, listener]);
    },
    [],
  );

  const removeStrokeEndListener = useCallback(
    (listener: CanvasStrokeEndHandler) => {
      editor.removeEventListener(CanvasEvents.STROKE_END, listener);
      setStrokeEndListeners(listeners => listeners.filter(l => l !== listener));
    },
    [editor],
  );

  const addHoverPixelChangeListener = useCallback(
    (listener: CanvasHoverPixelChangeHandler) => {
      setHoverPixelChangeListeners(listeners => [...listeners, listener]);
    },
    [],
  );

  const removeHoverPixelChangeListener = useCallback(
    (listener: CanvasHoverPixelChangeHandler) => {
      editor.removeEventListener(CanvasEvents.HOVER_PIXEL_CHANGE, listener);
      setHoverPixelChangeListeners(listeners =>
        listeners.filter(l => l !== listener),
      );
    },
    [editor],
  );

  const addCanvasElementEventListener = useCallback(
    (type: string, listener: EventListenerOrEventListenerObject) => {
      setCanvasElementEventListeners(listeners => [
        ...listeners,
        { type, listener },
      ]);
    },
    [editor],
  );

  const removeCanvasElementEventListener = useCallback(
    (type: string, listener: EventListenerOrEventListenerObject) => {
      if (!editor) {
        return;
      }
      const canvasElement = editor.getCanvasElement();
      canvasElement.removeEventListener(type, listener);
      setCanvasElementEventListeners(listeners =>
        listeners.filter(l => l.type !== type && l.listener !== listener),
      );
    },
    [editor],
  );

  const clear = useCallback(() => editor?.clear(), [editor]);

  const colorPixels = useCallback(
    (
      changes: Array<{
        rowIndex: number;
        columnIndex: number;
        color: string;
      }>,
    ) => {
      editor?.colorPixels(changes);
    },
    [editor],
  );

  const erasePixels = useCallback(
    (changes: Array<{ rowIndex: number; columnIndex: number }>) => {
      editor?.erasePixels(changes);
    },
    [editor],
  );

  const setIndicatorPixels = useCallback(
    (indicators: Array<PixelModifyItem>) => {
      editor?.setIndicatorPixels(indicators);
    },
    [editor],
  );

  const downloadImage = useCallback(
    (options?: ImageDownloadOptions) => {
      editor?.downloadImage(options);
    },
    [editor],
  );

  const changeBrushColor = useCallback(
    (color: string) => {
      editor?.changeBrushColor(color);
    },
    [editor],
  );

  const changeBrushTool = useCallback(
    (brushTool: BrushTool) => {
      editor?.setBrushTool(brushTool);
    },
    [editor],
  );

  const undo = useCallback(() => {
    editor?.undo();
  }, [editor]);

  const redo = useCallback(() => {
    editor?.redo();
  }, [editor]);

  // useImperativeHandle makes the ref used in the place that uses the FC component
  // We will make our DotterRef manipulatable with the following functions
  useImperativeHandle(
    ref,
    () => ({
      // for useDotting
      clear,
      colorPixels,
      erasePixels,
      downloadImage,
      setIndicatorPixels,
      undo,
      redo,
      // for useBrush
      changeBrushColor,
      changeBrushTool,
      // for useHandler
      addDataChangeListener,
      removeDataChangeListener,
      addGridChangeListener,
      removeGridChangeListener,
      addBrushChangeListener,
      removeBrushChangeListener,
      addStrokeEndListener,
      removeStrokeEndListener,
      addHoverPixelChangeListener,
      removeHoverPixelChangeListener,
      // for canvas element listener
      addCanvasElementEventListener,
      removeCanvasElementEventListener,
    }),
    [
      // for useDotting
      clear,
      colorPixels,
      erasePixels,
      downloadImage,
      setIndicatorPixels,
      undo,
      redo,
      // for useBrush
      changeBrushColor,
      changeBrushTool,
      // for useHandler
      addDataChangeListener,
      removeDataChangeListener,
      addGridChangeListener,
      removeGridChangeListener,
      addBrushChangeListener,
      removeBrushChangeListener,
      addStrokeEndListener,
      removeStrokeEndListener,
      addHoverPixelChangeListener,
      removeHoverPixelChangeListener,
      // for canvas element listener
      addCanvasElementEventListener,
      removeCanvasElementEventListener,
    ],
  );

  return (
    <div
      style={{ width: props.width, height: props.height, position: "relative" }}
      ref={containerRef}
      // onKeyDown={(e) => {
      //   console.log(e.code, e.ctrlKey, e.metaKey);
      //   if (e.code === "KeyZ" && (e.ctrlKey || e.metaKey)) {
      //     canvas?.undo();
      //   }
      // }}
      // tabIndex={0}
    >
      <canvas
        ref={gotBackgroundCanvasRef}
        style={{
          position: "absolute",
          border: "1px solid #555555",
          ...props.style,
        }}
      />
      <canvas
        ref={gotDataCanvasRef}
        style={{
          position: "absolute",
          pointerEvents: "none",
          border: "1px solid #555555",
          ...props.style,
        }}
      />
      <canvas
        ref={gotInteractionCanvasRef}
        style={{
          position: "absolute",
          border: "1px solid #555555",
          ...props.style,
        }}
      />
      <canvas
        ref={gotGridCanvasRef}
        style={{
          position: "absolute",
          pointerEvents: "none",
          border: "1px solid #555555",
          ...props.style,
        }}
      />
    </div>
  );
});

export default Dotting;
