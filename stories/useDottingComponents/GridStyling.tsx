import React from "react";
import { useState, useRef } from "react";
import Dotting, { DottingRef } from "../../src/components/Dotting";

const GridStyling = () => {
  const ref = useRef<DottingRef>(null);
  const [gridStrokeColor, setGridStrokeColor] = useState<string>("#000000");
  const [gridStrokeWidth, setGridStrokeWidth] = useState<number>(1);

  return (
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
        height={300}
        gridStrokeColor={gridStrokeColor}
        gridStrokeWidth={gridStrokeWidth}
        style={{ borderColor: "red" }}
        backgroundMode="color"
        backgroundAlpha={0.1}
        backgroundColor="red"
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginTop: 10,
        }}
      >
        <span style={{ fontSize: 13 }}>Grid Stroke Width</span>
        <input
          type="number"
          style={{
            marginLeft: 25,
          }}
          min={1}
          max={10}
          step={1}
          value={gridStrokeWidth}
          onChange={e => {
            setGridStrokeWidth(+e.target.value);
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginTop: 10,
          marginBottom: 3,
        }}
      >
        <span style={{ fontSize: 13 }}>Grid Stroke Color</span>
        <div
          style={{
            borderRadius: "50%",
            width: 20,
            height: 20,
            marginLeft: 15,
            marginRight: 15,
            backgroundColor: gridStrokeColor,
          }}
        ></div>
        <input
          type="color"
          value={gridStrokeColor}
          onChange={e => setGridStrokeColor(e.target.value)}
        />
      </div>
    </div>
  );
};

export default GridStyling;
