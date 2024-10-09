import React, { useCallback, useRef } from "react";

import { useDotting } from "../../src";
import { BrushTool } from "../../src/components/Canvas/types";
import Dotting, { DottingRef } from "../../src/components/Dotting";
import useBrush from "../../src/hooks/useBrush";

const ChangeBrushTool = () => {
  const ref = useRef<DottingRef>(null);
  const { changeBrushColor, changeBrushTool, brushTool, brushColor } =
    useBrush(ref);
  const { undo, redo } = useDotting(ref);

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
        position: "relative",
        marginBottom: 50,
      }}
    >
      <Dotting ref={ref} width={"100%"} height={300} />
      {/* <div
        style={{
          position: "absolute",
          width: "100%",
          height: 300,
          backgroundColor: "rgba(0,0,0,0.5)",
          top: 0,
          left: 0,
        }}
        onMouseDown={e => {
          ref.current.onMouseDown({
            offsetX: e.nativeEvent.offsetX,
            offsetY: e.nativeEvent.offsetY,
          });
        }}
        onMouseMove={e => {
          ref.current.onMouseMove({
            offsetX: e.nativeEvent.offsetX,
            offsetY: e.nativeEvent.offsetY,
          });
        }}
        onMouseUp={e => {
          ref.current.onMouseUp({
            offsetX: e.nativeEvent.offsetX,
            offsetY: e.nativeEvent.offsetY,
          });
        }}
      ></div> */}
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
          value={brushTool}
          onChange={e => {
            changeBrushTool(e.target.value as BrushTool);
          }}
        >
          <option value={BrushTool.DOT}>{BrushTool.DOT}</option>
          <option value={BrushTool.ERASER}>{BrushTool.ERASER}</option>
          <option value={BrushTool.PAINT_BUCKET}>
            {BrushTool.PAINT_BUCKET}
          </option>
          <option value={BrushTool.SELECT}>{BrushTool.SELECT}</option>
          <option value={BrushTool.LINE}>{BrushTool.LINE}</option>
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
        {/* <button onClick={undo}>undo</button> */}
        {/* <button onClick={redo}>redo</button> */}
      </div>
      <div></div>
    </div>
  );
};

export default ChangeBrushTool;
