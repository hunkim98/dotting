import React, { useEffect, useMemo, useState } from "react";
import { useRef } from "react";
import Dotting, { DottingRef } from "../../src/components/Dotting";
import useBrush from "../../src/hooks/useBrush";
import useData from "../../src/hooks/useData";

const DataInformation = () => {
  const ref = useRef<DottingRef>(null);
  const { dataArray } = useData(ref);
  const { changeBrushColor } = useBrush(ref);
  const [groupData, setGroupData] = useState<Map<string, number>>(new Map());
  useEffect(() => {
    const map = new Map();
    dataArray.forEach(row => {
      row.forEach(pixel => {
        if (pixel.color) {
          if (map.has(pixel.color)) {
            map.set(pixel.color, map.get(pixel.color) + 1);
          } else {
            map.set(pixel.color, 1);
          }
        }
      });
    });
    setGroupData(map);
  }, [dataArray]);

  const entries = useMemo(() => Array.from(groupData.entries()), [groupData]);
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
        {[
          "#FF0000",
          "#0000FF",
          "#00FF00",
          "#FF00FF",
          "#00FFFF",
          "#FFFF00",
          "#000000",
          "#FFFFFF",
        ].map(color => (
          <div
            key={color}
            onClick={changeBrushColor.bind(null, color)}
            style={{
              width: 25,
              height: 25,
              margin: 10,
              border: "1px solid black",
              backgroundColor: color,
              display: "inline-block",
            }}
          />
        ))}
      </div>
      {entries.length === 0 && (
        <div style={{ padding: 10 }}>
          Color some pixels to see color groups!
        </div>
      )}
      <div>
        {entries.map(entry => {
          return (
            <div>
              <span style={{ marginRight: 10, color: entry[0] }}>
                {entry[0]}
              </span>
              <span>{entry[1]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DataInformation;
