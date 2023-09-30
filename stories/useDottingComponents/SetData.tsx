import React, { useRef } from "react";

import Dotting, { DottingRef } from "../../src/components/Dotting";
import useDotting from "../../src/hooks/useDotting";

const SetData = () => {
  const ref = useRef<DottingRef>(null);
  const { setData } = useDotting(ref);

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
      <div>
        <div
          style={{
            padding: "20px 0",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 50,
            gap: 5,
          }}
        >
          <button
            style={{
              padding: "5px 10px",
              background: "none",
            }}
            onClick={() => {
              setData([
                [
                  { rowIndex: 0, columnIndex: 0, color: "" },
                  { rowIndex: 0, columnIndex: 1, color: "" },
                  { rowIndex: 0, columnIndex: 2, color: "" },
                ],
                [
                  { rowIndex: 1, columnIndex: 0, color: "" },
                  { rowIndex: 1, columnIndex: 1, color: "" },
                  { rowIndex: 1, columnIndex: 2, color: "" },
                ],
                [
                  { rowIndex: 2, columnIndex: 0, color: "" },
                  { rowIndex: 2, columnIndex: 1, color: "" },
                  { rowIndex: 2, columnIndex: 2, color: "" },
                ],
              ]);
            }}
          >
            Set Data to 3 X 3
          </button>
          <button
            style={{
              padding: "5px 10px",
              background: "none",
            }}
            onClick={() => {
              setData([
                [
                  { rowIndex: 0, columnIndex: 0, color: "" },
                  { rowIndex: 0, columnIndex: 1, color: "" },
                  { rowIndex: 0, columnIndex: 2, color: "" },
                  { rowIndex: 0, columnIndex: 3, color: "" },
                ],
                [
                  { rowIndex: 1, columnIndex: 0, color: "" },
                  { rowIndex: 1, columnIndex: 1, color: "" },
                  { rowIndex: 1, columnIndex: 2, color: "" },
                  { rowIndex: 1, columnIndex: 3, color: "" },
                ],
                [
                  { rowIndex: 2, columnIndex: 0, color: "" },
                  { rowIndex: 2, columnIndex: 1, color: "" },
                  { rowIndex: 2, columnIndex: 2, color: "" },
                  { rowIndex: 2, columnIndex: 3, color: "" },
                ],
                [
                  { rowIndex: 3, columnIndex: 0, color: "" },
                  { rowIndex: 3, columnIndex: 1, color: "" },
                  { rowIndex: 3, columnIndex: 2, color: "" },
                  { rowIndex: 3, columnIndex: 3, color: "" },
                ],
              ]);
            }}
          >
            Set Data to 4 X 4
          </button>
          <button
            style={{
              padding: "5px 10px",
              background: "none",
            }}
            onClick={() => {
              setData([
                [
                  { rowIndex: 0, columnIndex: 0, color: "" },
                  { rowIndex: 0, columnIndex: 1, color: "" },
                  { rowIndex: 0, columnIndex: 2, color: "" },
                  { rowIndex: 0, columnIndex: 3, color: "" },
                  { rowIndex: 0, columnIndex: 4, color: "" },
                ],
                [
                  { rowIndex: 1, columnIndex: 0, color: "" },
                  { rowIndex: 1, columnIndex: 1, color: "" },
                  { rowIndex: 1, columnIndex: 2, color: "" },
                  { rowIndex: 1, columnIndex: 3, color: "" },
                  { rowIndex: 1, columnIndex: 4, color: "" },
                ],
                [
                  { rowIndex: 2, columnIndex: 0, color: "" },
                  { rowIndex: 2, columnIndex: 1, color: "" },
                  { rowIndex: 2, columnIndex: 2, color: "" },
                  { rowIndex: 2, columnIndex: 3, color: "" },
                  { rowIndex: 2, columnIndex: 4, color: "" },
                ],
                [
                  { rowIndex: 3, columnIndex: 0, color: "" },
                  { rowIndex: 3, columnIndex: 1, color: "" },
                  { rowIndex: 3, columnIndex: 2, color: "" },
                  { rowIndex: 3, columnIndex: 3, color: "" },
                  { rowIndex: 3, columnIndex: 4, color: "" },
                ],
                [
                  { rowIndex: 4, columnIndex: 0, color: "" },
                  { rowIndex: 4, columnIndex: 1, color: "" },
                  { rowIndex: 4, columnIndex: 2, color: "" },
                  { rowIndex: 4, columnIndex: 3, color: "" },
                  { rowIndex: 4, columnIndex: 4, color: "" },
                ],
              ]);
            }}
          >
            Set Data to 5 X 5
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetData;
