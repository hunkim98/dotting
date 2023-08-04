import React, { useEffect, useRef, useState } from "react";

import { useBrush, useDotting } from "../../src";
import Dotting, { DottingRef } from "../../src/components/Dotting";
import { DottingDataLayer } from "../../src/helpers/DottingDataLayer";
import { EmptyFiveByFive } from "../config/data";

const Layers = () => {
  const ref = useRef<DottingRef>(null);
  const { undo, redo } = useDotting(ref);
  const { changeBrushColor } = useBrush(ref);
  const [layerIds, setLayerIds] = useState<string[]>([]);
  const layer1 = useRef<DottingDataLayer>(
    new DottingDataLayer({
      data: EmptyFiveByFive,
      id: "layer1",
    }),
  );
  const layer2 = useRef<DottingDataLayer>(
    new DottingDataLayer({
      data: EmptyFiveByFive,
      id: "layer2",
    }),
  );
  const [isClicked, setIsClicked] = React.useState(false);
  useEffect(() => {
    console.log("layer 1 changed");
  }, [layer1]);

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
      }}
    >
      <div
        style={{
          width: 100,
        }}
      >
        hi
      </div>
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Dotting
          ref={ref}
          width={"100%"}
          height={300}
          initLayers={[
            {
              id: "layer1",
              data: EmptyFiveByFive,
            },
            {
              id: "layer2",
              data: EmptyFiveByFive,
            },
          ]}
        />
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
      </div>
    </div>
  );
};

export default Layers;
