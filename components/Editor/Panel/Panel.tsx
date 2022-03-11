import React, { useContext, useEffect, useState } from "react";
import {
  dataArrayElement,
  PanelKeys,
  PixelDTO,
  rowColumnColor,
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

const Panel: React.FC<Props> = ({
  initialData,
  panelRef,
  colorArray,
  setColorArray,
}) => {
  const dispatch = useDispatch();
  const [pixel2dArray, setPixel2dArray] = useState<Pixel2dRow[]>([]);

  console.log("panel renderd");

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
      <S.HeightControlContainer>
        <button
          onClick={() => {
            const topRowIndex = pixel2dArray[0].rowIndex - 1;
            const columnCount = pixel2dArray[0].columns.length;
            const columns: Pixel2dPixel[] = [];
            for (let i = 0; i < columnCount; i++) {
              columns.push({
                columnIndex: i,
                pixel: (
                  <Pixel
                    key={`row${topRowIndex}column${i}`}
                    id={`row${topRowIndex}column${i}`}
                    rowIndex={topRowIndex}
                    columnIndex={i}
                  />
                ),
              });
            }
            setPixel2dArray([
              { rowIndex: topRowIndex, columns: columns },
              ...pixel2dArray,
            ]);
          }}
        >
          +
        </button>
        <button
          onClick={() => {
            const tempPixel2dArray = pixel2dArray.filter((row, rowIndex) => {
              return rowIndex !== 0;
            });
            setPixel2dArray(tempPixel2dArray);
          }}
        >
          -
        </button>
      </S.HeightControlContainer>
      <S.PixelsCanvasContainer>
        <S.WidthControlContainer location="left">
          <button
            onClick={() => {
              const leftColumnIndex =
                pixel2dArray[0].columns[0].columnIndex - 1;
              console.log(leftColumnIndex);
              const tempPixel2dArray = pixel2dArray.map((row) => {
                const key = `row${row.rowIndex}column${leftColumnIndex}`;
                return {
                  rowIndex: row.rowIndex,
                  columns: [
                    {
                      columnIndex: leftColumnIndex,
                      pixel: (
                        <Pixel
                          key={key}
                          id={key}
                          rowIndex={row.rowIndex}
                          columnIndex={leftColumnIndex}
                        ></Pixel>
                      ),
                    },
                    ...row.columns,
                  ],
                };
              });
              setPixel2dArray(tempPixel2dArray);
            }}
          >
            +
          </button>
          <button
            onClick={() => {
              const tempPixel2dArray = pixel2dArray.map((row) => {
                return {
                  rowIndex: row.rowIndex,
                  columns: row.columns.slice(1),
                };
              });
              setPixel2dArray(tempPixel2dArray);
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
              const rightColumnIndex =
                pixel2dArray[0].columns[pixel2dArray[0].columns.length - 1]
                  .columnIndex + 1;
              console.log(rightColumnIndex);
              const tempPixel2dArray = pixel2dArray.map((row) => {
                const key = `row${row.rowIndex}column${rightColumnIndex}`;
                return {
                  rowIndex: row.rowIndex,
                  columns: [
                    ...row.columns,
                    {
                      columnIndex: rightColumnIndex,
                      pixel: (
                        <Pixel
                          key={key}
                          id={key}
                          rowIndex={row.rowIndex}
                          columnIndex={rightColumnIndex}
                        ></Pixel>
                      ),
                    },
                  ],
                };
              });
              setPixel2dArray(tempPixel2dArray);
            }}
          >
            +
          </button>
          <button
            onClick={() => {
              const tempPixel2dArray = pixel2dArray.map((row) => {
                return {
                  rowIndex: row.rowIndex,
                  columns: row.columns.slice(0, -1),
                };
              });
              setPixel2dArray(tempPixel2dArray);
            }}
          >
            -
          </button>
        </S.WidthControlContainer>
      </S.PixelsCanvasContainer>
      <S.HeightControlContainer>
        <button
          onClick={() => {
            const bottomRowIndex =
              pixel2dArray[pixel2dArray.length - 1].rowIndex + 1;
            const columnCount = pixel2dArray[0].columns.length;
            const columns: Pixel2dPixel[] = [];
            for (let i = 0; i < columnCount; i++) {
              columns.push({
                columnIndex: i,
                pixel: (
                  <Pixel
                    key={`row${bottomRowIndex}column${i}`}
                    id={`row${bottomRowIndex}column${i}`}
                    rowIndex={bottomRowIndex}
                    columnIndex={i}
                  />
                ),
              });
            }
            setPixel2dArray([
              ...pixel2dArray,
              { rowIndex: bottomRowIndex, columns: columns },
            ]);
          }}
        >
          +
        </button>
        <button
          onClick={() => {
            const tempPixel2dArray = pixel2dArray.filter((row, rowIndex) => {
              return rowIndex !== pixel2dArray.length - 1;
            });
            setPixel2dArray(tempPixel2dArray);
          }}
        >
          -
        </button>
      </S.HeightControlContainer>
    </S.Container>
  );
};

export default Panel;
