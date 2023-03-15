import React from "react";
import { useRef } from "react";
import Dotting, { DottingRef } from "../../src/components/Dotting";
import useDotting from "../../src/hooks/useDotting";

const ChangePixelColor = () => {
  const ref = useRef<DottingRef>(null);
  const { colorPixels, erasePixels } = useDotting(ref);
  const [rowIndex, setRowIndex] = React.useState(0);
  const [columnIndex, setColumnIndex] = React.useState(0);
  const [rowIndex2, setRowIndex2] = React.useState(0);
  const [columnIndex2, setColumnIndex2] = React.useState(0);
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
              <span>Row Index: </span>
              <input
                style={{ width: 40, height: 20 }}
                type="number"
                value={rowIndex}
                onChange={(e) => setRowIndex(Number(e.target.value))}
              />
            </div>
            <div style={{ margin: "0 10px" }}>
              <span>Column Index: </span>
              <input
                style={{ width: 40, height: 20 }}
                type="number"
                value={columnIndex}
                onChange={(e) => setColumnIndex(Number(e.target.value))}
              />
            </div>
          </div>
          <button
            style={{
              padding: "5px 10px",
              background: "none",
              marginTop: 15,
            }}
            onClick={() =>
              colorPixels([
                {
                  rowIndex: rowIndex,
                  columnIndex: columnIndex,
                  color: "red",
                },
              ])
            }
          >
            Color Pixel
          </button>
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
              <span>Row Index: </span>
              <input
                style={{ width: 40, height: 20 }}
                type="number"
                value={rowIndex2}
                onChange={(e) => setRowIndex2(Number(e.target.value))}
              />
            </div>
            <div style={{ margin: "0 10px" }}>
              <span>Column Index: </span>
              <input
                style={{ width: 40, height: 20 }}
                type="number"
                value={columnIndex2}
                onChange={(e) => setColumnIndex2(Number(e.target.value))}
              />
            </div>
          </div>
          <button
            style={{
              padding: "5px 10px",
              background: "none",
              marginTop: 15,
              marginBottom: 30,
            }}
            onClick={() =>
              erasePixels([
                {
                  rowIndex: rowIndex2,
                  columnIndex: columnIndex2,
                },
              ])
            }
          >
            Erase Pixel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangePixelColor;
