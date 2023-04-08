import React from "react";
import { useRef } from "react";
import Dotting, { DottingRef } from "../../src/components/Dotting";
import useDotting from "../../src/hooks/useDotting";

const UndoRedo = () => {
  const ref = useRef<DottingRef>(null);
  const { undo, redo } = useDotting(ref);
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Dotting ref={ref} width={"100%"} height={300} />
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

export default UndoRedo;
