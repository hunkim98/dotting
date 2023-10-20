import React, { useEffect, useRef } from "react";

import { CanvasInfoChangeParams, useDotting, useHandlers } from "../../src";
import Dotting, { DottingRef } from "../../src/components/Dotting";

const CustomRender = () => {
  const ref = useRef<DottingRef>(null);
  const { getCustomBackGroundCanvas, getCustomForeGroundCanvas } =
    useDotting(ref);
  const {
    addCanvasInfoChangeEventListener,
    removeCanvasInfoChangeEventListener,
    addCanvasElementEventListener,
    removeCanvasElementEventListener,
  } = useHandlers(ref);

  useEffect(() => {
    const renderer: EventListenerOrEventListenerObject = (e: any) => {
      const fgCanvas = getCustomForeGroundCanvas();
      const width = fgCanvas.width;
      const height = fgCanvas.height;
      const fgCtx = getCustomForeGroundCanvas().getContext("2d");
      fgCtx.clearRect(0, 0, width, height);
      fgCtx.fillStyle = "#FFFFFF";
      fgCtx.strokeStyle = "#000000";
      const dpr = window.devicePixelRatio;
      const offsetX = dpr ? e.offsetX * dpr : e.offsetX;
      const offsetY = dpr ? e.offsetY * dpr : e.offsetY;
      const mouseOffset = {
        x: offsetX,
        y: offsetY,
      };
      fgCtx.beginPath();
      fgCtx.arc(mouseOffset.x, mouseOffset.y, 20, 0, 2 * Math.PI);
      fgCtx.closePath();

      fgCtx.fill();
      fgCtx.stroke();
    };
    addCanvasElementEventListener("mousemove", renderer);
    return () => {
      removeCanvasElementEventListener("mousemove", renderer);
    };
  }, []);

  useEffect(() => {
    const renderer = ({
      topLeftCornerOffset,
      gridSquareSize,
    }: CanvasInfoChangeParams) => {
      const bgCanvas = getCustomBackGroundCanvas();
      const width = bgCanvas.width;
      const height = bgCanvas.height;
      const bgCtx = getCustomBackGroundCanvas().getContext("2d");
      const imgUrl =
        "https://www.cosy.sbg.ac.at/~pmeerw/Watermarking/lena_gray.gif";
      const img = new Image();
      img.src = imgUrl;
      const dpr = window.devicePixelRatio;
      const imageWidth = dpr ? gridSquareSize * 10 * dpr : gridSquareSize * 10;
      const imageHeight = dpr ? gridSquareSize * 10 * dpr : gridSquareSize * 10;

      img.onload = () => {
        bgCtx.clearRect(0, 0, width, height);
        bgCtx.drawImage(
          img,
          topLeftCornerOffset.x * window.devicePixelRatio,
          topLeftCornerOffset.y * window.devicePixelRatio,
          imageWidth,
          imageHeight,
        );
      };
    };
    addCanvasInfoChangeEventListener(renderer);
    return () => {
      removeCanvasInfoChangeEventListener(renderer);
    };
  }, [
    getCustomBackGroundCanvas,
    getCustomForeGroundCanvas,
    addCanvasInfoChangeEventListener,
    removeCanvasInfoChangeEventListener,
  ]);

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        fontFamily: `'Nunito Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif`,
        marginBottom: 50,
      }}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Dotting
          ref={ref}
          width={"100%"}
          height={500}
          defaultPixelColor="transparent"
        />
      </div>
    </div>
  );
};

export default CustomRender;
