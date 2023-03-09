import { MutableRefObject, useEffect, useMemo, useState } from "react";
import {
  CanvasDataChangeHandler,
  DottingData,
  PixelData,
  PixelModifyItem,
} from "../components/Canvas/types";
import { DottingRef } from "../components/Dotting";
import useHandlers from "./useHandlers";

const useData = (ref: MutableRefObject<DottingRef>) => {
  const { addDataChangeListener, removeDataChangeListener } = useHandlers(ref);
  const [data, setData] = useState<DottingData>(
    new Map<number, Map<number, PixelData>>()
  );

  const [dataArray, setDataArray] = useState<Array<Array<PixelModifyItem>>>([]);

  useEffect(() => {
    const listener: CanvasDataChangeHandler = (canvasData) => {
      setData(canvasData);
      const allRowKeys = Array.from(canvasData.keys());
      const allColumnKeys = Array.from(canvasData.get(allRowKeys[0])!.keys());
      const currentTopIndex = Math.min(...allRowKeys);
      const currentLeftIndex = Math.min(...allColumnKeys);
      const currentBottomIndex = Math.max(...allRowKeys);
      const currentRightIndex = Math.max(...allColumnKeys);
      const tempArray = [];
      for (let i = currentTopIndex; i <= currentBottomIndex; i++) {
        const row = [];
        for (let j = currentLeftIndex; j <= currentRightIndex; j++) {
          const pixel = canvasData.get(i)?.get(j);
          if (pixel) {
            row.push({
              rowIndex: i,
              columnIndex: j,
              color: pixel.color,
            });
          }
        }
        tempArray.push(row);
      }

      setDataArray(tempArray);
    };

    addDataChangeListener(listener);

    return () => {
      removeDataChangeListener(listener);
    };
  }, [addDataChangeListener, removeDataChangeListener]);

  return { data, dataArray };
};

export default useData;
