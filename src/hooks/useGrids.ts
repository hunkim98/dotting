import { MutableRefObject, useEffect, useState } from "react";
import { DottingRef } from "../components/Dotting";
import useHandlers from "./useHandlers";

const useGrids = (ref: MutableRefObject<DottingRef>) => {
  const { addGridChangeListener, removeGridChangeListener } = useHandlers(ref);
  const [dimensions, setDimensions] = useState({
    columnCount: 0,
    rowCount: 0,
  });
  const [indices, setIndices] = useState({
    topRowIndex: 0,
    bottomRowIndex: 0,
    leftColumnIndex: 0,
    rightColumnIndex: 0,
  });

  useEffect(() => {
    const listener = (
      dimensions: {
        columnCount: number;
        rowCount: number;
      },
      indices: {
        topRowIndex: number;
        bottomRowIndex: number;
        leftColumnIndex: number;
        rightColumnIndex: number;
      }
    ) => {
      setDimensions({
        columnCount: dimensions.columnCount,
        rowCount: dimensions.rowCount,
      });
      setIndices({
        topRowIndex: indices.topRowIndex,
        bottomRowIndex: indices.bottomRowIndex,
        leftColumnIndex: indices.leftColumnIndex,
        rightColumnIndex: indices.rightColumnIndex,
      });
    };

    addGridChangeListener(listener);

    return () => {
      removeGridChangeListener(listener);
    };
  }, [addGridChangeListener, removeGridChangeListener]);

  return {
    dimensions,
    indices,
  };
};

export default useGrids;
