import { MutableRefObject, useEffect, useState } from "react";

import useHandlers from "./useHandlers";
import { CanvasGridChangeHandler } from "../components/Canvas/types";
import { DottingRef } from "../components/Dotting";

const useGrids = (ref: MutableRefObject<DottingRef | null>) => {
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
    const listener: CanvasGridChangeHandler = ({ dimensions, indices }) => {
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
