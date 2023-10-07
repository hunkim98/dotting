import React, { useRef } from "react";

import Dotting, { DottingRef } from "../../src/components/Dotting";
import useDotting from "../../src/hooks/useDotting";

const DownloadImage = () => {
  const ref = useRef<DottingRef>(null);
  const { downloadImage } = useDotting(ref);
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
      <button
        style={{
          padding: "5px 10px",
          background: "none",
          marginTop: 15,
        }}
        onClick={() =>
          downloadImage({
            type: "png",
          })
        }
      >
        Download as PNG
      </button>
      <button
        style={{
          padding: "5px 10px",
          background: "none",
          marginTop: 10,
          marginBottom: 50,
        }}
        onClick={() =>
          downloadImage({
            type: "svg",
          })
        }
      >
        Download as SVG
      </button>
    </div>
  );
};

export default DownloadImage;
