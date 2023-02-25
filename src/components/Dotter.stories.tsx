import React, { useRef } from "react";
import useCanvas from "./Canvas/useCanvas";
import { Dotter, DotterRef } from "./Dotter";

export default {
  title: "Dotting",
  component: useCanvas,
};

export const Primary = () => {
  const dotterRef = useRef<DotterRef>(null);
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <button
        onClick={() => {
          dotterRef.current?.clear();
        }}
      >
        clear
      </button>
      <Dotter ref={dotterRef} width={500} height={300} />
    </div>
  );
};
