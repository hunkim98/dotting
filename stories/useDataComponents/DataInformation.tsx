import React from "react";
import { useRef } from "react";
import Dotting, { DottingRef } from "../../src/components/Dotting";
import useData from "../../src/hooks/useData";

const DataInformation = () => {
  const ref = useRef<DottingRef>();
  const { dataArray } = useData(ref);
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
        {dataArray.map((row, relativeRowIndex) => {
          return (
            <div key={row[0].rowIndex} style={{ display: "flex" }}>
              {row.map((pixel) => (
                <div
                  style={{
                    width: 40,
                    fontSize: 10,
                    color: pixel.color ? pixel.color : "rgba(0,0,0,0.5)",
                  }}
                  key={"row" + pixel.rowIndex + "column" + pixel.columnIndex}
                >
                  {pixel.color ? pixel.color : "null"}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DataInformation;
