import React, { useContext, useEffect, useState } from "react";
import {
  dataArrayElement,
  PixelDTO,
  rowColumnColor,
  PanelKeys,
} from "../../../const/CommonDTO";
import { range } from "../../../const/CommonFunctions";
import { DataContext } from "../../../context/DataContext";

import { PixelBordersContainer } from "./PixelBordersContainer";
import { PixelsContainer } from "./PixelsContainer";
import * as S from "./styles";
import { useDispatch, useSelector, Provider } from "react-redux";
import * as pixelData from "../../../store/modules/pixelData";
import ReactDOM from "react-dom";
import { RootState } from "../../../store/modules";
import { Pixel } from "./Pixel";
import { store } from "../../../store/configureStore";
import { ThemeProvider } from "styled-components";
import * as mouseEvent from "../../../store/modules/mouseEvent";
import { PixelBorder } from "./PixelBorder";
import { SizeControl } from "./SizeControl";

interface Props {
  initialData: pixelData.pixelDataElement[][];
  panelRef: React.RefObject<HTMLDivElement>;
  colorArray: dataArrayElement[];
  setColorArray: React.Dispatch<React.SetStateAction<dataArrayElement[]>>;
}

export interface Pixel2dRow {
  rowIndex: number;
  columns: Pixel2dPixel[];
}

export interface Pixel2dPixel {
  columnIndex: number;
  pixel: JSX.Element;
}

export enum Position {
  LEFT,
  RIGHT,
  TOP,
  BOTTOM,
}

const Panel: React.FC<Props> = ({
  initialData,
  panelRef,
  colorArray,
  setColorArray,
}) => {
  console.log("panel rendered");
  const dispatch = useDispatch();
  const [pixel2dArray, setPixel2dArray] = useState<Pixel2dRow[]>([]);
  useEffect(() => {
    const tempPixel2dArray: Pixel2dRow[] = [];
    initialData.map((row, rowIndex) => {
      const tempPixel2dArrayRow: Pixel2dPixel[] = [];
      row.map((pixel, columnIndex) => {
        tempPixel2dArrayRow.push({
          columnIndex: columnIndex,
          pixel: (
            <Pixel
              key={`row${rowIndex}column${columnIndex}`}
              id={`row${rowIndex}column${columnIndex}`}
              rowIndex={rowIndex}
              columnIndex={columnIndex}
              dataColor={pixel.color}
            ></Pixel>
          ),
        });
      });
      tempPixel2dArray.push({
        rowIndex: rowIndex,
        columns: tempPixel2dArrayRow,
      });
    });
    setPixel2dArray(tempPixel2dArray);
  }, [initialData]);

  return (
    <S.Container>
      <div>
        <button
          onClick={() => {
            dispatch(pixelData.undo());
          }}
        >
          back
        </button>
        <button
          onClick={() => {
            dispatch(pixelData.redo());
          }}
        >
          forward
        </button>
      </div>
      <S.PixelsCanvasContainer>
        <SizeControl
          pixel2dArray={pixel2dArray}
          setPixel2dArray={setPixel2dArray}
        >
          <div id="pixelsContainer" ref={panelRef}>
            {pixel2dArray.map((row) => {
              return (
                <div
                  key={`row${row.rowIndex}`}
                  id={`row${row.rowIndex}`}
                  className="row"
                >
                  {row.columns.map((element) => {
                    return element.pixel;
                  })}
                </div>
              );
            })}
          </div>
          <div style={{ position: "absolute", pointerEvents: "none" }}>
            {pixel2dArray.map((row) => {
              return (
                <div style={{ display: "flex" }} key={`row${row.rowIndex}`}>
                  {row.columns.map((element) => {
                    return <PixelBorder />;
                  })}
                </div>
              );
            })}
          </div>
        </SizeControl>
      </S.PixelsCanvasContainer>
    </S.Container>
  );
};

export default Panel;
