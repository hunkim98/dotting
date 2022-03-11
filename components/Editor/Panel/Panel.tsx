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

interface Props {
  initialData: pixelData.pixelDataElement[][];
  panelRef: React.RefObject<HTMLDivElement>;
  colorArray: dataArrayElement[];
  setColorArray: React.Dispatch<React.SetStateAction<dataArrayElement[]>>;
}

interface Pixel2dRow {
  rowIndex: number;
  columns: Pixel2dPixel[];
}

interface Pixel2dPixel {
  columnIndex: number;
  pixel: JSX.Element;
}

enum Position {
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
  function appendBehind<Type>(element: Type, array: Type[]): Type[] {
    return [...array, element];
  }

  function appendBefore<Type>(element: Type, array: Type[]): Type[] {
    return [element, ...array];
  }

  const addColumn = ({
    position,
    data,
  }: {
    position: Position.LEFT | Position.RIGHT;
    data: Pixel2dPixel[];
  }) => {
    const newColumnIndex =
      position === Position.LEFT
        ? pixel2dArray[0].columns[0].columnIndex - 1
        : pixel2dArray[0].columns[pixel2dArray[0].columns.length - 1]
            .columnIndex + 1;
    const tempPixel2dArray = pixel2dArray.map((row) => {
      const key = `row${row.rowIndex}column${newColumnIndex}`;
      const newColumn: Pixel2dPixel = {
        columnIndex: newColumnIndex,
        pixel: (
          <Pixel
            key={key}
            id={key}
            rowIndex={row.rowIndex}
            columnIndex={newColumnIndex}
          ></Pixel>
        ),
      };
      return {
        rowIndex: row.rowIndex,
        columns:
          position === Position.LEFT
            ? appendBefore(newColumn, row.columns)
            : appendBehind(newColumn, row.columns),
      };
    });
    setPixel2dArray(tempPixel2dArray);
  };

  const addRow = ({
    position,
    data,
  }: {
    position: Position.TOP | Position.BOTTOM;
    data: Pixel2dPixel[];
  }) => {
    const newRowIndex =
      position === Position.TOP
        ? pixel2dArray[0].rowIndex - 1
        : pixel2dArray[pixel2dArray.length - 1].rowIndex + 1;
    const columnCount = pixel2dArray[0].columns.length;
    const columns: Pixel2dPixel[] = [];
    for (let i = 0; i < columnCount; i++) {
      columns.push({
        columnIndex: i,
        pixel: (
          <Pixel
            key={`row${newRowIndex}column${i}`}
            id={`row${newRowIndex}column${i}`}
            rowIndex={newRowIndex}
            columnIndex={i}
          />
        ),
      });
    }
    const newRow: Pixel2dRow = { rowIndex: newRowIndex, columns: columns };
    const tempPixel2dArray =
      position === Position.TOP
        ? appendBefore(newRow, pixel2dArray)
        : appendBehind(newRow, pixel2dArray);
    setPixel2dArray(tempPixel2dArray);
  };

  const deleteColumn = ({
    position,
  }: {
    position: Position.LEFT | Position.RIGHT;
  }) => {
    const sliceStartIndex = position === Position.LEFT ? 1 : 0;
    const sliceEndIndex = position === Position.LEFT ? undefined : -1;
    const tempPixel2dArray = pixel2dArray.map((row) => {
      return {
        rowIndex: row.rowIndex,
        columns: row.columns.slice(sliceStartIndex, sliceEndIndex),
      };
    });
    setPixel2dArray(tempPixel2dArray);
  };

  const deleteRow = ({
    position,
  }: {
    position: Position.TOP | Position.BOTTOM;
  }) => {
    const rowIndexToDelete =
      position === Position.TOP ? 0 : pixel2dArray.length - 1;
    const tempPixel2dArray = pixel2dArray.filter((row, rowIndex) => {
      return rowIndex !== rowIndexToDelete;
    });
    setPixel2dArray(tempPixel2dArray);
  };

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
        <S.HeightControlContainer location="top">
          <button
            onClick={() => {
              addRow({ position: Position.TOP, data: [] });
            }}
          >
            +
          </button>
          <button
            onClick={() => {
              deleteRow({ position: Position.TOP });
            }}
          >
            -
          </button>
        </S.HeightControlContainer>

        <S.WidthControlContainer location="left">
          <button
            onClick={() => {
              addColumn({ position: Position.LEFT, data: [] });
            }}
          >
            +
          </button>
          <button
            onClick={() => {
              deleteColumn({ position: Position.LEFT });
            }}
          >
            -
          </button>
        </S.WidthControlContainer>
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
        {/* <PixelsContainer
          panelRef={panelRef}
          initialData={initialData}
          // setIsHistoryBranchCreated={setIsHistoryBranchCreated}
          // finalRows={finalRows}
          // randomKey={randomKey}
          // currentKeys={currentKeys}
          // panelColor={panelColor}
        /> */}
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
        <S.WidthControlContainer location="right">
          <button
            onClick={() => {
              addColumn({ position: Position.RIGHT, data: [] });
            }}
          >
            +
          </button>
          <button
            onClick={() => {
              deleteColumn({ position: Position.RIGHT });
            }}
          >
            -
          </button>
        </S.WidthControlContainer>
        <S.HeightControlContainer location="bottom">
          <button
            onClick={() => {
              addRow({ position: Position.BOTTOM, data: [] });
            }}
          >
            +
          </button>
          <button
            onClick={() => {
              deleteRow({ position: Position.BOTTOM });
            }}
          >
            -
          </button>
        </S.HeightControlContainer>
      </S.PixelsCanvasContainer>
    </S.Container>
  );
};

export default Panel;
