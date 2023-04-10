import React, { useCallback } from "react";
import { useRef } from "react";
import { BrushMode } from "../../src/components/Canvas/types";
import Dotting, { DottingRef } from "../../src/components/Dotting";
import useBrush from "../../src/hooks/useBrush";

const ChangeBrushMode = () => {
  const ref = useRef<DottingRef>(null);
  const { changeBrushColor, changeBrushMode, brushMode, brushColor } =
    useBrush(ref);

  const handleColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      changeBrushColor.bind(null, e.target.value)();
    },
    [],
  );

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
          onChange={e => {
            changeBrushMode(e.target.value as BrushMode);
          }}
        >
          <option value={BrushMode.DOT}>{BrushMode.DOT}</option>
          <option value={BrushMode.ERASER}>{BrushMode.ERASER}</option>
          <option value={BrushMode.PAINT_BUCKET}>
            {BrushMode.PAINT_BUCKET}
          </option>
        </select>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginTop: 10,
          marginBottom: 3,
        }}
      >
        <span style={{ fontSize: 13 }}>Brush Color</span>
        <div
          style={{
            borderRadius: "50%",
            width: 20,
            height: 20,
            marginLeft: 15,
            marginRight: 15,
            backgroundColor: brushColor,
          }}
        ></div>
        <input type="color" value={brushColor} onChange={handleColorChange} />
      </div>
      <div></div>
    </div>
  );
};

export default ChangeBrushMode;
