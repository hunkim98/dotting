import React from "react";
import { useRef } from "react";
import Dotting, { DottingRef } from "../../src/components/Dotting";
import useDotting from "../../src/hooks/useDotting";

const ChangePixelColor = () => {
  const ref = useRef<DottingRef>();
  const { changePixelColor } = useDotting(ref);
  const [rowIndex, setRowIndex] = React.useState(0);
  const [columnIndex, setColumnIndex] = React.useState(0);
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
        <div style={{ padding: "20px 0" }}>
          <div>
            Row Index:
            <input
              type="number"
              value={rowIndex}
              onChange={(e) => setRowIndex(Number(e.target.value))}
            />
          </div>
          <div>
            Column Index:
            <input
              type="number"
              value={columnIndex}
              onChange={(e) => setColumnIndex(Number(e.target.value))}
            />
          </div>
          <button
            style={{
              padding: "5px 10px",
              background: "none",
              marginTop: 10,
              marginBottom: 30,
            }}
            onClick={() =>
              changePixelColor([
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
      </div>
    </div>
  );
};

export default ChangePixelColor;
