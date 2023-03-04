import React from "react";
import { useRef } from "react";
import Dotting, { DottingRef } from "../../src/components/Dotting";
import useDotting from "../../src/hooks/useDotting";

const GridInformation = () => {
  const ref = useRef<DottingRef>();
  const { getDimensions, getGridIndices } = useDotting(ref);
  console.log(getDimensions(), getGridIndices());
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
      <div>
        <span
          onClick={() => {
            console.log(ref.current?.getGridIndices());
            console.log(ref.current?.getDimensions());
          }}
        >
          Dimensions
        </span>
        <div>{ref.current?.getDimensions().columnCount}</div>
        <div>Column Count : {getDimensions()?.columnCount}</div>
        <div>Row Count : {getDimensions()?.rowCount}</div>
      </div>
    </div>
  );
};

export default GridInformation;
