import React, { useEffect, useRef, useState } from "react";
import {
  CanvasStrokeEndHandler,
  DottingData,
  PixelModifyItem,
} from "../../src/components/Canvas/types";
import Dotting, { DottingRef } from "../../src/components/Dotting";
import useHandlers from "../../src/hooks/useHandlers";

const StrokeListener = () => {
  const ref = useRef<DottingRef>();
  const { addStrokeEndListener, removeStrokeEndListener } = useHandlers(ref);
  const [strokedPixels, setStrokedPixels] = useState<Array<PixelModifyItem>>(
    []
  );
  const handleStrokeEnd: CanvasStrokeEndHandler = (
    strokedPixels: Array<PixelModifyItem>,
    data: DottingData
  ) => {
    setStrokedPixels(strokedPixels);
  };

  useEffect(() => {
    addStrokeEndListener(handleStrokeEnd);
    return () => {
      removeStrokeEndListener(handleStrokeEnd);
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
        <div>
          <strong>Stroked Pixels</strong>
        </div>
        {strokedPixels.map((item, index) => {
          return (
            <div key={index}>
              rowIndex: {item.rowIndex}, columnIndex: {item.columnIndex}, color:{" "}
              {item.color}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StrokeListener;
