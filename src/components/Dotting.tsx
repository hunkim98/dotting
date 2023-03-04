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
  getData: () => DottingData;
  getDataArray: () => Array<Array<PixelData>>;
  getGridIndices: () => {
    topRowIndex: number;
    bottomRowIndex: number;
    leftColumnIndex: number;
    rightColumnIndex: number;
  };
  getDimensions: () => {
    columnCount: number;
    rowCount: number;
  };
  colorPixels: (data: PixelModifyData) => void;
  changeBrushColor: (color: string) => void;
}

const defaultColors = [
  "#FF0000",
  "#0000FF",
  "#00FF00",
  "#FF00FF",
  "#00FFFF",
  "#FFFF00",
  "#000000",
  "#FFFFFF",
];
// forward ref makes the a ref used in a FC component used in the place that uses the FC component
const Dotting = forwardRef<DottingRef, DottingProps>(function Dotting(
  props: DottingProps,
  ref: ForwardedRef<DottingRef>
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const colors: Array<string> = useMemo(
    () => (colors ? colors : [...defaultColors]),
    [props.colors]
  );

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
      canvas.addEventListener("dataChange", (data) => {
        console.log(data);
      });
      setCanvas(canvas);
    },
    [history]
  );

  const clear = useCallback(() => canvas?.clear(), [canvas]);

  const getData = useCallback(() => canvas?.getData(), [canvas]);

  const getDataArray = useCallback(() => canvas?.getDataArray(), [canvas]);

  const getGridIndices = useCallback(() => canvas?.getGridIndices(), [canvas]);

  const getDimensions = useCallback(() => {
    console.log(canvas?.getDimensions(), "hi");
    return canvas?.getDimensions();
  }, [canvas]);

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
      // for useDotting
      clear,
      getData,
      getDataArray,
      getGridIndices,
      getDimensions,
      colorPixels,
      // for useBrush
      changeBrushColor,
    }),
    [clear]
  );

  return (
    // <div>
    //   <div
    //     style={{
    //       display: "flex",
    //       flexWrap: "wrap",
    //       marginLeft: -2,
    //       marginRight: -2,
    //       marginTop: -2,
    //       marginBottom: 6,
    //       justifyContent: "center",
    //     }}
    //   >
    //     {colors.map((color) => (
    //       <div
    //         key={color}
    //         onClick={changeBrushColor.bind(null, color)}
    //         style={{
    //           width: 25,
    //           height: 25,
    //           margin: 2,
    //           border: "1px solid black",
    //           backgroundColor: color,
    //           display: "inline-block",
    //         }}
    //       />
    //     ))}
    //   </div>
    <div
      style={{ width: props.width, height: props.height }}
      ref={containerRef}
    >
      <canvas ref={gotRef} style={{ border: "1px solid black" }} />
    </div>
    // </div>
  );
});

export default Dotting;
