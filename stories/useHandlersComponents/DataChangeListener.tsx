import React, { useEffect, useRef, useState } from "react";

import {
  CanvasDataChangeHandler,
  CanvasDelta,
} from "../../src/components/Canvas/types";
import Dotting, { DottingRef } from "../../src/components/Dotting";
import useHandlers from "../../src/hooks/useHandlers";

const DataChangeListener = () => {
  const ref = useRef<DottingRef>(null);
  const { addDataChangeListener, removeDataChangeListener } = useHandlers(ref);
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
      <Dotting ref={ref} width={"100%"} height={300} />
      <div
        style={{
          marginTop: 25,
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
          marginBottom: 50,
        }}
      >
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
