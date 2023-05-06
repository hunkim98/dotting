import React, { useRef } from "react";

import Dotting, { DottingRef } from "../../src/components/Dotting";
import useDotting from "../../src/hooks/useDotting";

const Clear = () => {
  const ref = useRef<DottingRef>(null);
  const { clear } = useDotting(ref);
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
      <button
        style={{
          padding: "5px 10px",
          background: "none",
          marginTop: 10,
          marginBottom: 50,
        }}
        onClick={clear}
      >
        Clear Canvas
      </button>
    </div>
  );
};

export default Clear;
