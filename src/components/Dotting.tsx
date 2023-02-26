import React, {
  ForwardedRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { forwardRef, useRef } from "react";
import Canvas from "./Canvas";
import useCanvas from "./Canvas/useCanvas";

export interface DottingProps {
  width: number;
  height: number;
  ref?: ForwardedRef<DottingRef>;
}

export interface DottingRef {
  download: (filename?: string, type?: string) => void;
  clear: () => void;
  context?: CanvasRenderingContext2D | null;
}

// forward ref makes the a ref used in a FC component used in the place that uses the FC component
const Dotting = forwardRef<DottingRef, DottingProps>(function Dotting(
  props: DottingProps,
  ref: ForwardedRef<DottingRef>
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);

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
    if (!canvas) {
      return;
    }
    canvas.clear();
  }, [canvas]);

  // useImperativeHandle makes the ref used in the place that uses the FC component
  // We will make our DotterRef manipulatable with the following functions
  useImperativeHandle(
    ref,
    () => ({
      download: (filename = "image.png", type?: string) => {
        if (!canvas) {
          return;
        }
        const a = document.createElement("a");
        // a.href = canvas.toDataURL(type);
        // a.download = filename;
        a.click();
      },
      clear,
    }),
    [canvas]
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