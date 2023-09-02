import React, { useRef } from "react";

import Dotting, { DottingRef } from "../../src/components/Dotting";
import useDotting from "../../src/hooks/useDotting";

const GridChange = () => {
  const ref = useRef<DottingRef>(null);
  const { colorPixels, erasePixels, addGridIndices, deleteGridIndices } =
    useDotting(ref);
  const [rowIndex, setRowIndex] = React.useState(0);
  const [columnIndex, setColumnIndex] = React.useState(0);
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
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            <div style={{ margin: "0 10px" }}>
              <span>Target row index: </span>
              <input
                style={{ width: 40, height: 20 }}
                type="number"
                value={rowIndex}
                onChange={e => setRowIndex(Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <button
              style={{
                padding: "5px 10px",
                background: "none",
                marginTop: 15,
              }}
              onClick={() =>
                addGridIndices({
                  columnIndices: [],
                  rowIndices: [rowIndex],
                })
              }
            >
              Add Row
            </button>
            <button
              style={{
                padding: "5px 10px",
                background: "none",
                marginTop: 15,
              }}
              onClick={() =>
                deleteGridIndices({
                  columnIndices: [],
                  rowIndices: [rowIndex],
                })
              }
            >
              Remove Row
            </button>
          </div>
        </div>
        <div
          style={{
            padding: "20px 0",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            <div style={{ margin: "0 10px" }}>
              <span>Target column index: </span>
              <input
                style={{ width: 40, height: 20 }}
                type="number"
                value={columnIndex}
                onChange={e => setColumnIndex(Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <button
              style={{
                padding: "5px 10px",
                background: "none",
                marginTop: 15,
                marginBottom: 30,
              }}
              onClick={() => {
                addGridIndices({
                  columnIndices: [columnIndex],
                  rowIndices: [],
                });
              }}
            >
              Add Column
            </button>
            <button
              style={{
                padding: "5px 10px",
                background: "none",
                marginTop: 15,
                marginBottom: 30,
              }}
              onClick={() => {
                deleteGridIndices({
                  columnIndices: [columnIndex],
                  rowIndices: [],
                });
              }}
            >
              Remove Column
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GridChange;
