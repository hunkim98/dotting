import React, { useRef } from "react";
import Dotting, { DottingRef } from "../../src/components/Dotting";
import useGrids from "../../src/hooks/useGrids";

const GridInformation = () => {
  const ref = useRef<DottingRef>(null);
  const { dimensions, indices } = useGrids(ref);
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
      <div>column count: {dimensions.columnCount}</div>
      <div>row count: {dimensions.rowCount}</div>
      <div>top row index: {indices.topRowIndex}</div>
      <div>left column index: {indices.leftColumnIndex}</div>
      <div>bottom row index: {indices.bottomRowIndex}</div>
      <div>right column index: {indices.rightColumnIndex}</div>
    </div>
  );
};

export default GridInformation;
