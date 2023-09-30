import { MutableRefObject, useCallback, useEffect, useState } from "react";

import useHandlers from "./useHandlers";
import {
  LayerChangeParams,
  LayerDataForHook,
  PixelModifyItem,
} from "../components/Canvas/types";
import { DottingRef } from "../components/Dotting";

const useLayers = (ref: MutableRefObject<DottingRef | null>) => {
  const [currentLayer, setCurrentLayerHook] = useState<LayerDataForHook>();
  const [layersInfo, setLayersInfo] = useState<Array<LayerDataForHook>>([]);

  const { addLayerChangeEventListener, removeLayerChangeEventListener } =
    useHandlers(ref);

  useEffect(() => {
    const listener = ({ currentLayer, layers }: LayerChangeParams) => {
      setCurrentLayerHook({
        id: currentLayer.getId(),
        data: currentLayer.getDataArray(),
        isVisible: currentLayer.getIsVisible(),
      });
      setLayersInfo(
        layers.map(layer => ({
          id: layer.getId(),
          data: layer.getDataArray(),
          isVisible: layer.getIsVisible(),
        })),
      );
    };
    addLayerChangeEventListener(listener);
    return () => {
      removeLayerChangeEventListener(listener);
    };
  }, [addLayerChangeEventListener, removeLayerChangeEventListener]);

  const addLayer = useCallback(
    (
      layerId: string,
      insertPosition: number,
      data?: Array<Array<PixelModifyItem>>,
    ) => {
      ref.current?.addLayer(layerId, insertPosition, data);
    },
    [ref],
  );

  const removeLayer = useCallback(
    (layerId: string) => {
      ref.current?.removeLayer(layerId);
    },
    [ref],
  );

  const changeLayerPosition = useCallback(
    (layerId: string, toIndex: number) => {
      ref.current?.changeLayerPosition(layerId, toIndex);
    },
    [ref],
  );

  const showLayer = useCallback(
    (layerId: string) => {
      ref.current?.showLayer(layerId);
    },
    [ref],
  );

  const hideLayer = useCallback(
    (layerId: string) => {
      ref.current?.hideLayer(layerId);
    },
    [ref],
  );

  const isolateLayer = useCallback(
    (layerId: string) => {
      ref.current?.isolateLayer(layerId);
    },
    [ref],
  );

  const showAllLayers = useCallback(() => {
    ref.current?.showAllLayers();
  }, [ref]);

  const setCurrentLayer = useCallback(
    (layerId: string) => {
      ref.current?.setCurrentLayer(layerId);
    },
    [ref],
  );

  const reorderLayersByIds = useCallback(
    (layerIds: Array<string>) => {
      ref.current?.reorderLayersByIds(layerIds);
    },
    [ref],
  );

  return {
    currentLayer,
    layers: layersInfo,
    addLayer,
    removeLayer,
    changeLayerPosition,
    showLayer,
    hideLayer,
    isolateLayer,
    showAllLayers,
    setCurrentLayer,
    reorderLayersByIds,
  };
};

export default useLayers;
