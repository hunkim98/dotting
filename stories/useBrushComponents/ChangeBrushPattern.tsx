import React, { useCallback, useMemo, useRef, useState } from "react";

import { BRUSH_PATTERN_ELEMENT } from "../../src";
import Dotting, { DottingRef } from "../../src/components/Dotting";
import useBrush from "../../src/hooks/useBrush";

const ChangeBrushPattern = () => {
  const ref = useRef<DottingRef>(null);
  const { changeBrushColor, changeBrushPattern, brushColor } = useBrush(ref);

  const handleColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      changeBrushColor.bind(null, e.target.value)();
    },
    [],
  );
  const [selectedPatternIndex, setSelectedPatternIndex] = useState<number>(0);
  const patterns: Array<Array<Array<BRUSH_PATTERN_ELEMENT>>> = useMemo<
    Array<Array<Array<BRUSH_PATTERN_ELEMENT>>>
  >(() => {
    return [
      [[1]],
      [
        [0, 1, 0],
        [1, 1, 1],
        [0, 1, 0],
      ],
      [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
      ],
      [
        [0, 0, 1, 0, 0],
        [0, 1, 1, 1, 0],
        [1, 1, 1, 1, 1],
        [0, 1, 1, 1, 0],
        [0, 0, 1, 0, 0],
      ],
      [
        [0, 1, 1, 1, 0],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [0, 1, 1, 1, 0],
      ],
      [
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
      ],
    ];
  }, []);

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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginTop: 10,
          marginBottom: 3,
          fontSize: 13,
        }}
      >
        <span>Brush Mode</span>
        <div style={{ display: "flex", alignItems: "center", marginTop: 10 }}>
          {patterns.map((pattern, index) => {
            return (
              <div
                style={{
                  display: "flex",
                  backgroundColor: selectedPatternIndex === index ? "grey" : "",
                  marginLeft: 5,
                  marginRight: 5,
                  width: 80,
                  height: 80,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onClick={() => {
                  setSelectedPatternIndex(index);
                  changeBrushPattern(pattern);
                }}
              >
                {pattern.map(row => {
                  return (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {row.map(cell => {
                        return (
                          <div
                            style={{
                              width: 10,
                              height: 10,
                              backgroundColor: cell === 1 ? "black" : "",
                              margin: 1,
                            }}
                          ></div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginTop: 10,
          marginBottom: 3,
        }}
      >
        <span style={{ fontSize: 13 }}>Brush Color</span>
        <div
          style={{
            borderRadius: "50%",
            width: 20,
            height: 20,
            marginLeft: 15,
            marginRight: 15,
            backgroundColor: brushColor,
          }}
        ></div>
        <input type="color" value={brushColor} onChange={handleColorChange} />
        {/* <button onClick={undo}>undo</button> */}
        {/* <button onClick={redo}>redo</button> */}
      </div>
      <div></div>
    </div>
  );
};

export default ChangeBrushPattern;
