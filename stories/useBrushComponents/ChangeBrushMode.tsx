import React, { useCallback } from "react";
import { useRef } from "react";
import { BrushMode } from "../../src/components/Canvas/types";
import Dotting, { DottingRef } from "../../src/components/Dotting";
import useBrush from "../../src/hooks/useBrush";

const ChangeBrushMode = () => {
  const ref = useRef<DottingRef>();
  const { changeBrushColor, changeBrushMode, brushMode } = useBrush(ref);
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
          display: "flex",
          alignItems: "center",
          marginTop: 10,
          marginBottom: 3,
          fontSize: 13,
        }}
      >
        <span>Brush Mode</span>
        <select
          style={{
            marginLeft: 15,
          }}
          value={brushMode}
          onChange={(e) => {
            changeBrushMode(e.target.value as BrushMode);
          }}
        >
          <option value={BrushMode.DOT}>{BrushMode.DOT}</option>
          <option value={BrushMode.ERASER}>{BrushMode.ERASER}</option>
        </select>
      </div>
      <div></div>
    </div>
  );
};

export default ChangeBrushMode;
