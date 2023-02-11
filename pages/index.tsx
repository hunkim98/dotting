import React, { useEffect, useRef } from "react";
import useCanvas from "../components/Canvas/hooks/useCanvas";

const Canvas = () => {
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
    <div style={{ width: 300, height: 300 }} ref={divRef}>
      <div>hihihih</div>
      <canvas ref={canvasRef} />
    </div>
  );
};

export default Canvas;
