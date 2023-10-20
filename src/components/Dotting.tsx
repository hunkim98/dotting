import React, {
  ForwardedRef,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import Editor from "./Canvas/Editor";
import {
  AddGridIndicesParams,
  BRUSH_PATTERN_ELEMENT,
  BrushTool,
  CanvasBrushChangeHandler,
  CanvasDataChangeHandler,
  CanvasEvents,
  CanvasGridChangeHandler,
  CanvasHoverPixelChangeHandler,
  CanvasInfoChangeHandler,
  CanvasStrokeEndHandler,
  DeleteGridIndicesParams,
  DottingData,
  ImageDownloadOptions,
  LayerChangeHandler,
  LayerProps,
  PixelModifyItem,
} from "./Canvas/types";
import { validateLayers } from "../utils/data";
import { TouchyEvent } from "../utils/touch";

export interface DottingProps {
  width: number | string;
  height: number | string;
  style?: React.CSSProperties;
  gridStrokeColor?: string;
  gridStrokeWidth?: number;
  isGridVisible?: boolean;
  // TODO: The background mode has been removed for now
  //       This is because the `renderCanvasMask` function in interactionLayer does not work for
  //       backgroundMode "checkerboard"
  // backgroundMode?: "checkerboard" | "color";
  backgroundColor?: string;
  initLayers?: Array<LayerProps>;
  isPanZoomable?: boolean;
  isGridFixed?: boolean;
  brushTool?: BrushTool;
  brushColor?: string;
  indicatorData?: Array<PixelModifyItem>;
  isInteractionApplicable?: boolean;
  isDrawingEnabled?: boolean;
  gridSquareLength?: number;
  defaultPixelColor?: string;
  minScale?: number;
  maxScale?: number;
  // children?: React.ReactNode;
  // initIndicatorData?: Array<PixelModifyItem>;
  // initBrushColor?: string;
}

export interface DottingRef {
  // for useDotting
  clear: () => void;
  colorPixels: (data: Array<PixelModifyItem>) => void;
  erasePixels: (data: Array<{ rowIndex: number; columnIndex: number }>) => void;
  downloadImage: (options: ImageDownloadOptions) => void;
  setIndicatorPixels: (data: Array<PixelModifyItem>) => void;
  undo: () => void;
  redo: () => void;
  setData: (data: Array<Array<PixelModifyItem>>) => void;
  addGridIndices: ({
    rowIndices,
    columnIndices,
    data,
    layerId,
    isLocalChange,
  }: AddGridIndicesParams) => void;
  deleteGridIndices: ({
    rowIndices,
    columnIndices,
    layerId,
    isLocalChange,
  }: DeleteGridIndicesParams) => void;

  // for useBrush
  changeBrushColor: (color: string) => void;
  changeBrushTool: (tool: BrushTool) => void;
  changeBrushPattern: (pattern: Array<Array<BRUSH_PATTERN_ELEMENT>>) => void;
  // for useLayers
  addLayer: (
    layerId: string,
    insertPosition: number,
    data?: Array<Array<PixelModifyItem>>,
  ) => void;
  removeLayer: (layerId: string) => void;
  changeLayerPosition: (layerId: string, insertPosition: number) => void;
  showLayer: (layerId: string) => void;
  hideLayer: (layerId: string) => void;
  isolateLayer: (layerId: string) => void;
  showAllLayers: () => void;
  setCurrentLayer: (layerId: string) => void;
  reorderLayersByIds: (layerIds: Array<string>) => void;
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
  addLayerChangeEventListener: (listener: LayerChangeHandler) => void;
  removeLayerChangeEventListener: (listener: LayerChangeHandler) => void;
  addCanvasInfoChangeEventListener: (listener: CanvasInfoChangeHandler) => void;
  removeCanvasInfoChangeEventListener: (
    listener: CanvasInfoChangeHandler,
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
  getLayers: () => Array<{ id: string; data: DottingData }>;
  getLayersAsArray: () => Array<{
    id: string;
    data: Array<Array<PixelModifyItem>>;
  }>;
  setLayers: (layers: Array<LayerProps>) => void;
  // for manipulating innate mouse events
  onMouseDown: (e: { offsetX: number; offsetY: number }) => void;
  onMouseMove: (e: { offsetX: number; offsetY: number }) => void;
  onMouseUp: (e: { offsetX: number; offsetY: number }) => void;
  // for manipulating custom foreground and background canvas
  getCustomForeGroundCanvas: () => HTMLCanvasElement | null;
  getCustomBackGroundCanvas: () => HTMLCanvasElement | null;
}

// forward ref makes the a ref used in a FC component used in the place that uses the FC component
const Dotting = forwardRef<DottingRef, DottingProps>(function Dotting(
  props: DottingProps,
  ref: ForwardedRef<DottingRef>,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [customForeGroundCanvas, setCustomForeGroundCanvas] =
    useState<HTMLCanvasElement | null>(null);
  const [customBackGroundCanvas, setCustomBackGroundCanvas] =
    useState<HTMLCanvasElement | null>(null);
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
  const [layerChangeListeners, setLayerChangeListeners] = useState<
    LayerChangeHandler[]
  >([]);
  const [canvasInfoChangeListeners, setCanvasInfoChangeListeners] = useState<
    CanvasInfoChangeHandler[]
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
    editor.setIsInteractionApplicable(props.isInteractionApplicable);
  }, [editor, props.isInteractionApplicable]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.setGridSquareLength(props.gridSquareLength);
  }, [editor, props.gridSquareLength]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.setDefaultPixelColor(props.defaultPixelColor);
  }, [editor, props.defaultPixelColor]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.setMinScale(props.minScale);
  }, [editor, props.minScale]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.setMaxScale(props.maxScale);
  }, [editor, props.maxScale]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    gridChangeListeners.forEach(listener => {
      editor.addEventListener(CanvasEvents.GRID_CHANGE, listener);
    });
    // The below is to emit the initial grid event
    editor.emitCurrentGridStatus();
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
    editor.emitCurrentData();
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
    editor.emitCurrentBrushTool();
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
    editor.emitCurrentHoverPixelStatus();
    return () => {
      hoverPixelChangeListeners.forEach(listener => {
        editor?.removeEventListener(CanvasEvents.HOVER_PIXEL_CHANGE, listener);
      });
    };
  }, [editor, hoverPixelChangeListeners]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    layerChangeListeners.forEach(listener => {
      editor.addEventListener(CanvasEvents.LAYER_CHANGE, listener);
    });
    editor.emitCurrentLayerStatus();
    return () => {
      layerChangeListeners.forEach(listener => {
        editor?.removeEventListener(CanvasEvents.LAYER_CHANGE, listener);
      });
    };
  }, [editor, layerChangeListeners]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    canvasInfoChangeListeners.forEach(listener => {
      editor.addEventListener(CanvasEvents.CANVAS_INFO_CHANGE, listener);
    });
    editor.emitCurrentCanvasInfoStatus();
    return () => {
      canvasInfoChangeListeners.forEach(listener => {
        editor?.removeEventListener(CanvasEvents.CANVAS_INFO_CHANGE, listener);
      });
    };
  }, [editor, canvasInfoChangeListeners]);

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

        // This is to resize the custom foreground and background canvas
        if (customForeGroundCanvas) {
          customForeGroundCanvas.width = dpr ? rect.width * dpr : rect.width;
          customForeGroundCanvas.height = dpr ? rect.height * dpr : rect.height;
          customForeGroundCanvas.style.width = `${rect.width}px`;
          customForeGroundCanvas.style.height = `${rect.height}px`;
        }
        if (customBackGroundCanvas) {
          customBackGroundCanvas.width = dpr ? rect.width * dpr : rect.width;
          customBackGroundCanvas.height = dpr ? rect.height * dpr : rect.height;
          customBackGroundCanvas.style.width = `${rect.width}px`;
          customBackGroundCanvas.style.height = `${rect.height}px`;
        }
      }
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [
    editor,
    containerRef,
    props.height,
    props.width,
    customBackGroundCanvas,
    customForeGroundCanvas,
  ]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    if (props.indicatorData) {
      editor.setIndicatorPixels(props.indicatorData);
    }
  }, [editor, props.indicatorData]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    if (props.brushColor) {
      editor.setBrushColor(props.brushColor);
    }
    if (props.brushTool) {
      editor.setBrushTool(props.brushTool);
    }
  }, [editor, props.brushColor, props.brushTool]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    if (props.backgroundColor) {
      editor.setBackgroundColor(props.backgroundColor);
    }
    // if (props.backgroundMode) {
    //   editor.setBackgroundMode(props.backgroundMode);
    // }
  }, [
    editor,
    // props.backgroundMode,
    props.backgroundColor,
  ]);

  useEffect(() => {
    if (
      !gridCanvas ||
      !interactionCanvas ||
      !dataCanvas ||
      !backgroundCanvas ||
      !containerRef.current
    ) {
      return;
    }
    const { width, height } = containerRef.current.getBoundingClientRect();
    // this only happens once
    const validatedLayers =
      props.initLayers && validateLayers(props.initLayers)
        ? props.initLayers
        : undefined;

    const editor = new Editor({
      gridCanvas,
      interactionCanvas,
      dataCanvas,
      backgroundCanvas,
      initLayers: validatedLayers,
      gridSquareLength: props.gridSquareLength,
      width,
      height,
    });
    editor.setIsGridFixed(props.isGridFixed);
    editor.setIsInteractionApplicable(props.isInteractionApplicable);
    editor.setIsDrawingEnabled(props.isDrawingEnabled);
    // editor.setBackgroundMode(props.backgroundMode);
    editor.setIsPanZoomable(props.isPanZoomable);
    editor.setIsGridVisible(props.isGridVisible);
    editor.setGridStrokeColor(props.gridStrokeColor);
    editor.setGridStrokeWidth(props.gridStrokeWidth);
    editor.setGridSquareLength(props.gridSquareLength);
    editor.setDefaultPixelColor(props.defaultPixelColor);
    editor.setMinScale(props.minScale);
    editor.setMaxScale(props.maxScale);

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

  const gotCustomForeGroundCanvasRef = useCallback(
    (element: HTMLCanvasElement) => {
      if (!element) {
        return;
      }
      element.style["touchAction"] = "none";
      setCustomForeGroundCanvas(element);
    },
    [],
  );

  const gotCustomBackGroundCanvasRef = useCallback(
    (element: HTMLCanvasElement) => {
      if (!element) {
        return;
      }
      element.style["touchAction"] = "none";
      setCustomBackGroundCanvas(element);
    },
    [],
  );

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

  const addCanvasInfoChangeEventListener = useCallback(
    (listener: CanvasInfoChangeHandler) => {
      setCanvasInfoChangeListeners(listeners => [...listeners, listener]);
    },
    [],
  );

  const removeCanvasInfoChangeEventListener = useCallback(
    (listener: CanvasInfoChangeHandler) => {
      editor.removeEventListener(CanvasEvents.CANVAS_INFO_CHANGE, listener);
      setCanvasInfoChangeListeners(listeners =>
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

  const addLayerChangeEventListener = useCallback(
    (listener: LayerChangeHandler) => {
      setLayerChangeListeners(listeners => [...listeners, listener]);
    },
    [],
  );

  const removeLayerChangeEventListener = useCallback(
    (listener: LayerChangeHandler) => {
      if (!editor) {
        return;
      }
      editor.removeEventListener(CanvasEvents.LAYER_CHANGE, listener);
      setLayerChangeListeners(listeners =>
        listeners.filter(l => l !== listener),
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

  const changeBrushPattern = useCallback(
    (pattern: Array<Array<BRUSH_PATTERN_ELEMENT>>) => {
      editor?.setBrushPattern(pattern);
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

  const setData = useCallback(
    (data: Array<Array<PixelModifyItem>>) => {
      editor?.setData(data);
    },
    [editor],
  );

  const addLayer = useCallback(
    (
      layerId: string,
      insertPosition: number,
      data?: Array<Array<PixelModifyItem>>,
    ) => {
      editor?.addLayer(layerId, insertPosition, data, true);
    },
    [editor],
  );

  const removeLayer = useCallback(
    (layerId: string) => {
      editor?.removeLayer(layerId, true);
    },
    [editor],
  );

  const changeLayerPosition = useCallback(
    (layerId: string, insertPosition: number) => {
      editor?.changeLayerPosition(layerId, insertPosition);
    },
    [editor],
  );

  const showLayer = useCallback(
    (layerId: string) => {
      editor?.showLayer(layerId);
    },
    [editor],
  );

  const hideLayer = useCallback(
    (layerId: string) => {
      editor?.hideLayer(layerId);
    },
    [editor],
  );

  const isolateLayer = useCallback(
    (layerId: string) => {
      editor?.isolateLayer(layerId);
    },
    [editor],
  );

  const showAllLayers = useCallback(() => {
    editor?.showAllLayers();
  }, [editor]);

  const setCurrentLayer = useCallback(
    (layerId: string) => {
      editor?.setCurrentLayer(layerId);
    },
    [editor],
  );

  const reorderLayersByIds = useCallback(
    (layerIds: Array<string>) => {
      editor?.reorderLayersByIds(layerIds);
    },
    [editor],
  );

  const addGridIndices = useCallback(
    ({
      rowIndices,
      columnIndices,
      data,
      layerId,
      isLocalChange = false,
    }: {
      rowIndices: Array<number>;
      columnIndices: Array<number>;
      data?: Array<PixelModifyItem>;
      layerId?: string;
      isLocalChange?: boolean;
    }) => {
      editor?.addGridIndices({
        rowIndices,
        columnIndices,
        data,
        layerId,
        isLocalChange,
      });
    },
    [editor],
  );

  const deleteGridIndices = useCallback(
    ({
      rowIndices,
      columnIndices,
      layerId,
      isLocalChange = false,
    }: {
      rowIndices: Array<number>;
      columnIndices: Array<number>;
      data?: Array<PixelModifyItem>;
      layerId?: string;
      isLocalChange?: boolean;
    }) => {
      editor?.deleteGridIndices({
        rowIndices,
        columnIndices,
        layerId,
        isLocalChange,
      });
    },
    [editor],
  );

  const getLayers = useCallback(() => {
    return editor?.getLayers();
  }, [editor]);

  const getLayersAsArray = useCallback(() => {
    return editor?.getLayersAsArray();
  }, [editor]);

  const setLayers = useCallback(
    (layers: Array<LayerProps>) => {
      editor?.setLayers(layers);
    },
    [editor],
  );

  const onMouseDown = useCallback(
    (e: { offsetX: number; offsetY: number }) => {
      const fakeMouseEvent = new MouseEvent("mousedown", {
        clientX: e.offsetX,
        clientY: e.offsetY,
      });
      editor?.onMouseDown(fakeMouseEvent as TouchyEvent);
    },
    [editor],
  );

  const onMouseMove = useCallback(
    (e: { offsetX: number; offsetY: number }) => {
      const fakeMouseEvent = new MouseEvent("mousemove", {
        clientX: e.offsetX,
        clientY: e.offsetY,
      });
      editor?.onMouseMove(fakeMouseEvent as TouchyEvent);
    },
    [editor],
  );

  const onMouseUp = useCallback(
    (e: { offsetX: number; offsetY: number }) => {
      const fakeMouseEvent = new MouseEvent("mouseup", {
        clientX: e.offsetX,
        clientY: e.offsetY,
      });
      editor?.onMouseUp(fakeMouseEvent as TouchyEvent);
    },
    [editor],
  );

  const getCustomForeGroundCanvas = useCallback(() => {
    return customForeGroundCanvas;
  }, [customForeGroundCanvas]);

  const getCustomBackGroundCanvas = useCallback(() => {
    return customBackGroundCanvas;
  }, [customBackGroundCanvas]);

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
      setData,
      addGridIndices,
      deleteGridIndices,
      // for useBrush
      changeBrushColor,
      changeBrushTool,
      changeBrushPattern,
      // for useLayer,
      addLayer,
      removeLayer,
      changeLayerPosition,
      showLayer,
      hideLayer,
      isolateLayer,
      showAllLayers,
      setCurrentLayer,
      reorderLayersByIds,
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
      addLayerChangeEventListener,
      removeLayerChangeEventListener,
      addCanvasInfoChangeEventListener,
      removeCanvasInfoChangeEventListener,
      // for canvas element listener
      addCanvasElementEventListener,
      removeCanvasElementEventListener,
      getLayers,
      getLayersAsArray,
      setLayers,
      // for manipulating innate mouse events
      onMouseDown,
      onMouseMove,
      onMouseUp,
      // for manipulating custom foreground and background canvas
      getCustomForeGroundCanvas,
      getCustomBackGroundCanvas,
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
      setData,
      addGridIndices,
      deleteGridIndices,
      // for useBrush
      changeBrushColor,
      changeBrushTool,
      changeBrushPattern,
      // for useLayer,
      addLayer,
      removeLayer,
      changeLayerPosition,
      showLayer,
      hideLayer,
      isolateLayer,
      showAllLayers,
      reorderLayersByIds,
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
      addLayerChangeEventListener,
      removeLayerChangeEventListener,
      addCanvasInfoChangeEventListener,
      removeCanvasInfoChangeEventListener,
      // for canvas element listener
      addCanvasElementEventListener,
      removeCanvasElementEventListener,
      getLayers,
      getLayersAsArray,
      setLayers,
      // for manipulating innate mouse events
      onMouseDown,
      onMouseMove,
      onMouseUp,
      // for manipulating custom foreground and background canvas
      getCustomForeGroundCanvas,
      getCustomBackGroundCanvas,
    ],
  );

  return (
    <div
      style={{
        width: props.width,
        height: props.height,
        position: "relative",
        outline: "none",
      }}
      ref={containerRef}
      tabIndex={1}
      onMouseDown={() => {
        containerRef.current?.focus();
      }}
      onKeyDown={e => {
        editor?.onKeyDown(e);
      }}
      onKeyUp={e => {
        editor?.onKeyUp(e);
      }}
    >
      <canvas
        id="dotting-background-canvas"
        ref={gotBackgroundCanvasRef}
        style={{
          position: "absolute",
          border: "1px solid #555555",
          pointerEvents: "none",
          ...props.style,
        }}
      />
      <canvas
        id="dotting-custom-background-canvas"
        ref={gotCustomBackGroundCanvasRef}
        style={{
          position: "absolute",
          pointerEvents: "none",
          border: "1px solid #555555",
          ...props.style,
        }}
      />
      <canvas
        id="dotting-data-canvas"
        ref={gotDataCanvasRef}
        style={{
          position: "absolute",
          pointerEvents: "none",
          border: "1px solid #555555",
          ...props.style,
        }}
      />
      <canvas
        id="dotting-interaction-canvas"
        ref={gotInteractionCanvasRef}
        style={{
          position: "absolute",
          border: "1px solid #555555",
          ...props.style,
        }}
      />
      <canvas
        id="dotting-grid-canvas"
        ref={gotGridCanvasRef}
        style={{
          position: "absolute",
          pointerEvents: "none",
          border: "1px solid #555555",
          ...props.style,
        }}
      />
      <canvas
        ref={gotCustomForeGroundCanvasRef}
        id="dotting-custom-foreground-canvas"
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
