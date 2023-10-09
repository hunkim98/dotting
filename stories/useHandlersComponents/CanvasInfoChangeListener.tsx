import React, { useEffect, useRef, useState } from "react";

import {
  CanvasInfoChangeHandler,
} from "../../src/components/Canvas/types";
import Dotting, { DottingRef } from "../../src/components/Dotting";
import useHandlers from "../../src/hooks/useHandlers";
import { PanZoom } from "../../src/utils/types";

const CanvasInfoChangeListener = () => {
  const ref = useRef<DottingRef>(null);
  const {
    addCanvasInfoChangeEventListener,
    removeCanvasInfoChangeEventListener,
  } = useHandlers(ref);
  const [canvasPanZoom, setCanvasPanZoom] = useState<PanZoom | null>(null);
  const [gridSquareSize, setGridSquareSize] = useState<number>(0);
  const [topLeftCornerOffset, setTopLeftCornerOffset] =
    useState<{
      x: number;
      y: number;
    } | null>(null);

  useEffect(() => {
    const handleHoverPixelChangeHandler: CanvasInfoChangeHandler = ({
      panZoom,
      topLeftCornerOffset,
      topRightCornerOffset,
      bottomLeftCornerOffset,
      bottomRightCornerOffset,
      gridSquareSize,
    }) => {
      setCanvasPanZoom(panZoom);
      setGridSquareSize(gridSquareSize);
      setTopLeftCornerOffset(topLeftCornerOffset);
    };

    addCanvasInfoChangeEventListener(handleHoverPixelChangeHandler);
    return () => {
      removeCanvasInfoChangeEventListener(handleHoverPixelChangeHandler);
    };
  }, []);
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: `'Nunito Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif`,
      }}
    >
      <Dotting ref={ref} width={"100%"} height={300} />
      <div
        style={{
          marginTop: 25,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginBottom: 50,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <strong>Current Scale</strong>
          {canvasPanZoom && <div>{canvasPanZoom.scale}</div>}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <strong>Current Offset</strong>
          {canvasPanZoom && (
            <div>
              x : {canvasPanZoom.offset.x}, y: {canvasPanZoom.offset.y}
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <strong>Top Left Corner Canvas Offset</strong>
          {canvasPanZoom && (
            <div>
              x : {topLeftCornerOffset.x}, y: {topLeftCornerOffset.y}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CanvasInfoChangeListener;
