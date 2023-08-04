import React, { useRef } from "react";

import { useBrush } from "../../src";
import Dotting, { DottingRef } from "../../src/components/Dotting";
import useLayers from "../../src/hooks/useLayers";
import { EmptyFiveByFive } from "../config/data";

const Layers = () => {
  const ref = useRef<DottingRef>(null);
  const { changeBrushColor } = useBrush(ref);
  const { layers, addLayer, removeLayer, changeLayerPosition } = useLayers(ref);
  const [isClicked, setIsClicked] = React.useState(false);

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
          display: "flex",
          flexDirection: "column",
        }}
      >
        {layers.map((layer, index) => (
          <div key={layer.getId()}>{layer.getId()}</div>
        ))}
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
