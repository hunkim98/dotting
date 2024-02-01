import React, { useRef } from "react";

import { BrushTool, useBrush, useDotting } from "../../src";
import Dotting, { DottingRef } from "../../src/components/Dotting";

const CustomExample = () => {
  const ref = useRef<DottingRef>(null);
  const { undo, redo } = useDotting(ref);
  const { changeBrushColor, brushTool, changeBrushTool } = useBrush(ref);
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
      }}
    >
      <Dotting ref={ref} width={"100%"} height={300} />
      {/* <button
        onClick={() => {
          setLayerIds([...layerIds, "layer" + layerIds.length]);
        }}
      >
        hi
      </button> */}
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
      <div>
        {[
          "#FF0000",
          "#0000FF",
          "#00FF00",
          "#FF00FF",
          "#00FFFF",
          "#FFFF00",
          "#000000",
          "#FFFFFF",
        ].map(color => (
          <div
            key={color}
            onClick={changeBrushColor.bind(null, color)}
            style={{
              width: 25,
              height: 25,
              margin: 10,
              border: "1px solid black",
              backgroundColor: color,
              display: "inline-block",
            }}
          />
        ))}
      </div>
      <div>
        <select
          style={{
            marginLeft: 15,
          }}
          value={brushTool}
          onChange={e => {
            changeBrushTool(e.target.value as BrushTool);
          }}
        >
          <option value={BrushTool.NONE}>{BrushTool.NONE}</option>
          <option value={BrushTool.DOT}>{BrushTool.DOT}</option>
          <option value={BrushTool.ERASER}>{BrushTool.ERASER}</option>
          <option value={BrushTool.PAINT_BUCKET}>
            {BrushTool.PAINT_BUCKET}
          </option>
          <option value={BrushTool.SELECT}>{BrushTool.SELECT}</option>
        </select>
      </div>
      <div
        style={{
          marginTop: 10,
          marginBottom: 50,
          display: "flex",
        }}
      >
        <button
          style={{
            padding: "5px 10px",
            background: "none",
          }}
          onClick={undo}
        >
          undo
        </button>
        <button
          style={{
            padding: "5px 10px",
            background: "none",
          }}
          onClick={redo}
        >
          redo
        </button>
      </div>
    </div>
  );
};

export default CustomExample;
