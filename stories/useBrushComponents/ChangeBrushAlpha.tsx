import React, { useRef } from "react";

import Dotting, { DottingRef } from "../../src/components/Dotting";
import useBrush from "../../src/hooks/useBrush";

const ChangeBrushAlpha = () => {
  const ref = useRef<DottingRef>(null);
  const { brushAlpha, changeBrushAlpha } = useBrush(ref);

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: `'Nunito Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif`,
        marginBottom: 50,
      }}
    >
      <Dotting ref={ref} width="100%" height={300} />
      <label style={{ marginTop: 12 }}>
        Brush alpha: {Math.round(brushAlpha * 100)}%
        <input
          aria-label="Brush alpha"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={brushAlpha}
          onChange={event => changeBrushAlpha(Number(event.target.value))}
          style={{ marginLeft: 12 }}
        />
      </label>
    </div>
  );
};

export default ChangeBrushAlpha;
