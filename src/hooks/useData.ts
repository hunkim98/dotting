import { MutableRefObject, useEffect, useState } from "react";
import { DottingRef } from "../components/Dotting";
import useHandlers from "./useHandlers";

const useGrids = (ref: MutableRefObject<DottingRef>) => {
  const { addDataChangeListener, removeDataChangeListener } = useHandlers(ref);
  useEffect(() => {
    const listener = undefined;

    addDataChangeListener(listener);

    return () => {
      removeDataChangeListener(listener);
    };
  }, [addDataChangeListener, removeDataChangeListener]);

  return {};
};

export default useGrids;
