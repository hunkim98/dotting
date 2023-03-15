import React, { useCallback } from "react";
import { useRef } from "react";
import Dotting, { DottingRef } from "../../src/components/Dotting";
import useBrush from "../../src/hooks/useBrush";

const ChangeBrushColor = () => {
  const ref = useRef<DottingRef>(null);
  const { changeBrushColor, brushColor } = useBrush(ref);
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: `'Nunito Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif`,
        marginBottom: 50,
      }}
    >
      <Dotting ref={ref} width={"100%"} height={300} />
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
            backgroundColor: brushColor,
          }}
        ></div>
      </div>
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
        ].map((color) => (
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
    </div>
  );
};

export default ChangeBrushColor;
