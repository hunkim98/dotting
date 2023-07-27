import React, { useRef } from "react";

import { useBrush, useDotting } from "../../src";
import Dotting, { DottingRef } from "../../src/components/Dotting";
import Layer from "../../src/components/Layer";

const CustomExample = () => {
  const ref = useRef<DottingRef>(null);
  const { undo, redo } = useDotting(ref);
  const { changeBrushColor } = useBrush(ref);

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Dotting ref={ref} width={"100%"} height={300}>
        <Layer data={new Map()} order={0} />
      </Dotting>
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
