import React, { useEffect, useRef, useState } from "react";

import {
  CanvasHoverPixelChangeHandler,
  CanvasStrokeEndHandler,
  DottingData,
  PixelModifyItem,
} from "../../src/components/Canvas/types";
import Dotting, { DottingRef } from "../../src/components/Dotting";
import useHandlers from "../../src/hooks/useHandlers";

const CanvasElementEvents = () => {
  const ref = useRef<DottingRef>(null);
  const { addCanvasElementEventListener, removeCanvasElementEventListener } =
    useHandlers(ref);
  const [isMouseDown, setIsMouseDown] = useState(false);

  useEffect(() => {
    const handleMouseDown = () => {
      setIsMouseDown(true);
    };
    const handleMouseUp = () => {
      setIsMouseDown(false);
    };
    addCanvasElementEventListener("mousedown", handleMouseDown);
    addCanvasElementEventListener("mouseup", handleMouseUp);
    return () => {
      removeCanvasElementEventListener("mousedown", handleMouseDown);
      removeCanvasElementEventListener("mouseup", handleMouseUp);
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
          alignItems: "center",
          flexDirection: "column",
          marginBottom: 50,
        }}
      >
        <strong>Is Mouse Down?</strong>
        <div>{isMouseDown ? "Yes" : "No"}</div>
      </div>
    </div>
  );
};

export default CanvasElementEvents;
