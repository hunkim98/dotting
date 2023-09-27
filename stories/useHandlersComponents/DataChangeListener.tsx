import React, { useEffect, useRef, useState } from "react";

import {
  BrushTool,
  CanvasDataChangeHandler,
  CanvasDelta,
} from "../../src/components/Canvas/types";
import Dotting, { DottingRef } from "../../src/components/Dotting";
import useHandlers from "../../src/hooks/useHandlers";
import { useDotting } from "../../src";

const DataChangeListener = () => {
  const ref = useRef<DottingRef>(null);
  const { addDataChangeListener, removeDataChangeListener } = useHandlers(ref);
  const [selectedBrushTool, setSelectedBrushTool] = useState<BrushTool>(
    BrushTool.DOT,
  );
  const { clear } = useDotting(ref);

  const [dataDelta, setDataDelta] = useState<CanvasDelta | null>(null);

  const handlDataChangeHandler: CanvasDataChangeHandler = ({
    // isLocalChange,
    // layerId,
    // data,
    delta,
  }) => {
    setDataDelta(delta);
  };

  useEffect(() => {
    addDataChangeListener(handlDataChangeHandler);
    return () => {
      removeDataChangeListener(handlDataChangeHandler);
    };
  }, [addDataChangeListener, removeDataChangeListener]);
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
      <Dotting
        ref={ref}
        width={"100%"}
        height={300}
        brushTool={selectedBrushTool}
      />
      <div
        style={{
          marginTop: 25,
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
          marginBottom: 50,
        }}
      >
        <div
          style={{
            padding: "10px 0",
          }}
        >
          <select
            value={selectedBrushTool}
            onChange={e => {
              setSelectedBrushTool(e.target.value as BrushTool);
            }}
          >
            <option value={BrushTool.DOT}>DOT</option>
            <option value={BrushTool.ERASER}>ERASER</option>
            <option value={BrushTool.PAINT_BUCKET}>LINE</option>
            <option value={BrushTool.SELECT}>SELECT</option>
          </select>
        </div>
        <div
          style={{
            padding: "10px 0",
          }}
        >
          <button
            onClick={() => {
              clear();
            }}
          >
            Clear
          </button>
        </div>
        <strong>Data Delta</strong>
        {dataDelta && (
          <>
            {dataDelta.modifiedPixels.length !== 0 && (
              <div>modified {dataDelta.modifiedPixels.length} pixels</div>
            )}
            {dataDelta.addedOrDeletedRows.length !== 0 && (
              <>
                {dataDelta.addedOrDeletedRows.filter(
                  row => row.isDelete === true,
                ).length !== 0 && (
                  <div>
                    removed{" "}
                    {
                      dataDelta.addedOrDeletedRows.filter(
                        row => row.isDelete === true,
                      ).length
                    }{" "}
                    rows
                  </div>
                )}
                {dataDelta.addedOrDeletedRows.filter(
                  row => row.isDelete === false,
                ).length !== 0 && (
                  <div>
                    added{" "}
                    {
                      dataDelta.addedOrDeletedRows.filter(
                        row => row.isDelete === false,
                      ).length
                    }{" "}
                    rows
                  </div>
                )}
              </>
            )}
            {dataDelta.addedOrDeletedColumns.length !== 0 && (
              <>
                {dataDelta.addedOrDeletedColumns.filter(
                  column => column.isDelete === true,
                ).length !== 0 && (
                  <div>
                    removed{" "}
                    {
                      dataDelta.addedOrDeletedColumns.filter(
                        column => column.isDelete === true,
                      ).length
                    }{" "}
                    columns
                  </div>
                )}
                {dataDelta.addedOrDeletedColumns.filter(
                  column => column.isDelete === false,
                ).length !== 0 && (
                  <div>
                    added{" "}
                    {
                      dataDelta.addedOrDeletedColumns.filter(
                        column => column.isDelete === false,
                      ).length
                    }{" "}
                    columns
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DataChangeListener;
