import React, { useRef } from "react";

import Dotting, { DottingRef } from "../../src/components/Dotting";
import useDotting from "../../src/hooks/useDotting";
import { CreateEmptySquareData } from "../utils/dataCreator";

const SetData = () => {
  const ref = useRef<DottingRef>(null);
  const { setData, setLayers } = useDotting(ref);

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
              setData(CreateEmptySquareData(5));
            }}
          >
            Set Data to 5 X 5
          </button>
          <button
            style={{
              padding: "5px 10px",
              background: "none",
            }}
            onClick={() => {
              setData(CreateEmptySquareData(64));
            }}
          >
            Set Data to 64 X 64
          </button>
          <button
            style={{
              padding: "5px 10px",
              background: "none",
            }}
            onClick={() => {
              setData(CreateEmptySquareData(100));
            }}
          >
            Set Data to 100 X 100
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetData;
