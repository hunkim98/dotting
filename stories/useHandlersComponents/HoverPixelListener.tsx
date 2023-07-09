import React, { useEffect, useRef, useState } from "react";

import { CanvasHoverPixelChangeHandler } from "../../src/components/Canvas/types";
import Dotting, { DottingRef } from "../../src/components/Dotting";
import useHandlers from "../../src/hooks/useHandlers";

const HoverPixelListener = () => {
  const ref = useRef<DottingRef>(null);
  const { addHoverPixelChangeListener, removeHoverPixelChangeListener } =
    useHandlers(ref);
  const [hoveredPixel, setHoveredPixel] =
    useState<{
      rowIndex: number;
      columnIndex: number;
    } | null>(null);
  const handleHoverPixelChangeHandler: CanvasHoverPixelChangeHandler = ({
    indices,
  }) => {
    setHoveredPixel(indices);
  };

  useEffect(() => {
    addHoverPixelChangeListener(handleHoverPixelChangeHandler);
    return () => {
      removeHoverPixelChangeListener(handleHoverPixelChangeHandler);
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
        <strong>Hovered Pixel</strong>
        {hoveredPixel && (
          <div>
            rowIndex: {hoveredPixel.rowIndex}, columnIndex:{" "}
            {hoveredPixel.columnIndex}
          </div>
        )}
      </div>
    </div>
  );
};

export default HoverPixelListener;
