import React, { useCallback , useRef } from "react";

import Dotting, { DottingRef } from "../../src/components/Dotting";
import useDotting from "../../src/hooks/useDotting";

const SetIndicatorPixels = () => {
  const ref = useRef<DottingRef>(null);
  const { setIndicatorPixels } = useDotting(ref);
  const [areIndicatorsShown, setAreIndicatorsShown] = React.useState(false);
  const showIndicators = useCallback(() => {
    setIndicatorPixels([
      {
        rowIndex: 0,
        columnIndex: 0,
        color: "#ff0000",
      },
      {
        rowIndex: 1,
        columnIndex: 1,
        color: "#ff0000",
      },
    ]);
  }, [setIndicatorPixels, setAreIndicatorsShown]);
  const hideIndicators = useCallback(() => {
    setIndicatorPixels([]);
  }, [setIndicatorPixels, setAreIndicatorsShown]);

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
          <button
            style={{
              padding: "5px 10px",
              background: "none",
              marginTop: 15,
              marginBottom: 30,
            }}
            onClick={() => {
              if (areIndicatorsShown) {
                setAreIndicatorsShown(false);
                hideIndicators();
              } else {
                setAreIndicatorsShown(true);
                showIndicators();
              }
            }}
          >
            {areIndicatorsShown ? "Hide Indicators" : "Show Indicators"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetIndicatorPixels;
