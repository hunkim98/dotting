import React, { useRef } from "react";
import useCanvas from "./Canvas/useCanvas";

export default {
  title: "Dotting",
};

export const Primary = () => {
  const divRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvas = useCanvas({
    divRef: divRef,
    canvasRef: canvasRef,
    onSetIsPanZoomedCallBack: () => {
      return;
    },
  });

  return (
    <div style={{ width: "100%", height: 300 }} ref={divRef}>
      <canvas ref={canvasRef} style={{ border: "1px solid black" }} />
    </div>
  );
};
