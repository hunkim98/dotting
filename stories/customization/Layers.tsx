import React, { BaseSyntheticEvent, useRef, useState } from "react";

import { useBrush } from "../../src";
import Dotting, { DottingRef } from "../../src/components/Dotting";
import useLayers from "../../src/hooks/useLayers";
import { CreateEmptySquareData } from "../utils/dataCreator";

const Layers = () => {
  const ref = useRef<DottingRef>(null);
  const { changeBrushColor } = useBrush(ref);
  const {
    layers,
    addLayer,
    removeLayer,
    changeLayerPosition,
    currentLayer,
    setCurrentLayer,
    isolateLayer,
    showLayer,
    hideLayer,
    showAllLayers,
  } = useLayers(ref);
  const [draggingSectionId, setDraggingSectionId] = useState(null); // 1
  const draggingItemIndex = useRef<number | null>(null);
  const draggingOverItemIndex = useRef<number | null>(null);

  const onDragStart = (e: BaseSyntheticEvent, index: number, id: string) => {
    draggingItemIndex.current = index;
    // e.target.style = e.target.style + "; opacity: 0.5";
    setDraggingSectionId(id);
  };

  const onAvailableItemDragEnter = (e: BaseSyntheticEvent, index: number) => {
    draggingOverItemIndex.current = index;
    const copyListItems = [...layers];
    const draggingItemContent = copyListItems[draggingItemIndex.current!];
    copyListItems.splice(draggingItemIndex.current!, 1);
    copyListItems.splice(
      draggingOverItemIndex.current!,
      0,
      draggingItemContent,
    );
    draggingItemIndex.current = draggingOverItemIndex.current;
    draggingOverItemIndex.current = null;
    changeLayerPosition(draggingItemContent.id, index);
  };

  const onDragEnd = (e: BaseSyntheticEvent) => {
    // e.target.style = e.target.style + "; opacity: 1";
    setDraggingSectionId(null);
  };

  const onDragOver = e => {
    e.preventDefault();
  };

  const onClickHandler = (e: BaseSyntheticEvent, id: string) => {
    e.stopPropagation();
    setCurrentLayer(id);
  };
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        fontFamily: `'Nunito Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif`,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          paddingRight: 10,
          maxWidth: 150,
        }}
      >
        <div style={{ fontSize: 18, marginBottom: 5 }}>Layers</div>
        <div style={{ fontSize: 12, marginBottom: 5 }}>
          Drag and Drop the layers to move their positions
        </div>
        <ul
          style={{
            width: "100%",
            height: 440,
            overflowY: "scroll",
            overflow: "auto",
            display: "flex",
            gap: 5,
            flexDirection: "column",
            listStyleType: "none",
            padding: 0,
            margin: 0,
          }}
        >
          {layers.map((layer, index) => (
            <li
              style={{
                display: "flex",
                flexDirection: "column",
                listStyle: "none",
                textAlign: "center",
                border: "1px solid black",
                padding: 5,
                gap: 5,
                backgroundColor:
                  currentLayer.id === layer.id ? "grey" : "white",
                color: currentLayer.id === layer.id ? "white" : "black",
                cursor: "pointer",

                opacity: draggingSectionId === layer.id ? 0.5 : 1,
              }}
              key={layer.id}
              onClick={e => onClickHandler(e, layer.id)}
              onDragStart={e => onDragStart(e, index, layer.id)}
              onDragEnter={e => onAvailableItemDragEnter(e, index)}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              draggable
            >
              <div>{layer.id}</div>
              <div>
                <button
                  style={{
                    fontSize: 12,
                    opacity: layer.isVisible ? 1 : 0.5,
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    layer.isVisible ? hideLayer(layer.id) : showLayer(layer.id);
                  }}
                >
                  {layer.isVisible ? "hide" : "show"}
                </button>
                <button
                  onClick={() => {
                    isolateLayer(layer.id);
                  }}
                >
                  isolate
                </button>
              </div>
            </li>
          ))}
        </ul>
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
          height={500}
          initLayers={[
            {
              id: "layer1",
              data: CreateEmptySquareData(15),
            },
            {
              id: "layer2",
              data: CreateEmptySquareData(15),
            },
            {
              id: "layer3",
              data: CreateEmptySquareData(15),
            },
            {
              id: "layer4",
              data: CreateEmptySquareData(15),
            },
            {
              id: "layer5",
              data: CreateEmptySquareData(15),
            },
            {
              id: "layer6",
              data: CreateEmptySquareData(15),
            },
            {
              id: "layer7",
              data: CreateEmptySquareData(15),
            },
            {
              id: "layer8",
              data: CreateEmptySquareData(15),
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
