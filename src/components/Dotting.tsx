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
import { DottingData, PixelModifyData, PixelData } from "./Canvas/types";

export interface DottingProps {
  width: number | string;
  height: number | string;
  colors?: Array<string>;
  ref?: ForwardedRef<DottingRef>;
}

export interface DottingRef {
  clear: () => void;
  data: DottingData;
  dataArray: Array<Array<PixelData>>;
  gridIndices: {
    topRowIndex: number;
    bottomRowIndex: number;
    leftColumnIndex: number;
    rightColumnIndex: number;
  };
  dimensions: () => {
    columnCount: number;
    rowCount: number;
  };
  changePixelColor: (changes: PixelModifyData) => void;
}

// forward ref makes the a ref used in a FC component used in the place that uses the FC component
const Dotting = forwardRef<DottingRef, DottingProps>(function Dotting(
  props: DottingProps,
  ref: ForwardedRef<DottingRef>
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const colors = useMemo(() => colors, [props.colors]);

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

  const clear = useCallback(() => {
    canvas?.clear();
  }, [canvas]);

  const data = useMemo(() => {
    return canvas?.getData();
  }, [canvas]);

  const dataArray = useMemo(() => {
    return canvas?.getDataArray();
  }, [canvas]);

  const gridIndices = useMemo(() => {
    return canvas?.getGridIndices();
  }, [canvas]);

  const changePixelColor = useCallback(
    (
      changes: Array<{ rowIndex: number; columnIndex: number; color: string }>
    ) => {
      canvas?.changePixelColor(changes);
    },
    [canvas]
  );

  const dimensions = useCallback(() => {
    return canvas?.getDimensions();
  }, [canvas]);

  // useImperativeHandle makes the ref used in the place that uses the FC component
  // We will make our DotterRef manipulatable with the following functions
  useImperativeHandle(
    ref,
    () => ({
      clear,
      data,
      dataArray,
      gridIndices,
      dimensions,
      changePixelColor,
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
