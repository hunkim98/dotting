import { RefObject, useEffect, useState } from "react";
import Canvas, { MouseMode } from "../components/Canvas";

interface Params {
  divRef: RefObject<HTMLDivElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  onSetIsPanZoomedCallBack: () => void;
}

function useCanvas({ divRef, canvasRef, onSetIsPanZoomedCallBack }: Params) {
  const [canvas, setCanvas] = useState<Canvas | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const graphCanvasObject = new Canvas(canvasRef.current);
      setCanvas(graphCanvasObject);
    }

    // testing할때 안잡힘..
    // return () => {
    //   if (canvas) {
    //     canvas.destroy();
    //   }
    // };
  }, [canvasRef]);

  useEffect(() => {
    const onResize = () => {
      if (divRef.current && canvas) {
        const dpr = window.devicePixelRatio;
        const rect = divRef.current.getBoundingClientRect();
        canvas.setSize(rect.width, rect.height, dpr);
        canvas.scale(dpr, dpr);
        canvas.render();
      }
    };

    const onMouseUp = () => {
      if (canvas) {
        canvas.setMouseMode(MouseMode.NULL);
        canvas.removePanListeners();
      }
    };

    onResize();
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("resize", onResize);
    canvas?.addEventListener("setIsPanZoomed", onSetIsPanZoomedCallBack);
    return () => {
      window.removeEventListener("resize", onResize);
      canvas?.removeEventListener("setIsPanZoomed", onSetIsPanZoomedCallBack);
    };
  }, [canvas, divRef, onSetIsPanZoomedCallBack]);

  return canvas;
}

export default useCanvas;
