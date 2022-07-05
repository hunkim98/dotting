import React, { useContext, useEffect, useState } from "react";
import {
  dataArrayElement,
  PixelDTO,
  rowColumnColor,
  PanelKeys,
} from "../../../const/CommonDTO";

import { PixelsContainer } from "./PixelsContainer";
import * as S from "./styles";
import { useDispatch, useSelector } from "react-redux";
import * as pixelData from "../../../store/modules/pixelData";
import { Pixel } from "./Pixel";
import { PixelBorder } from "./PixelBorder";
import { SizeControl } from "./SizeControl";
import { Client, Document } from "yorkie-js-sdk";
import { setReduxClient, setReduxDoc } from "../../../store/modules/docSlice";
import { RootState } from "../../../store/modules";
import { modifyPixelById } from "../../../const/PixelFunctions";
import {
  appendToGroup,
  changeGroupColor,
} from "../../../store/modules/colorGroupSlice";

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
const INITIAL_ROW_COUNT = 32;
const INITIAL_COLUMN_COUNT = 32;

const Panel: React.FC<Props> = ({
  initialData,
  panelRef,
  colorArray,
  setColorArray,
}) => {
  const doc = useSelector((state: RootState) => state.docSlice.doc);
  const client = useSelector((state: RootState) => state.docSlice.client);
  useEffect(() => {
    const activate = async () => {
      const yorkie = await import("yorkie-js-sdk");
      const client = new yorkie.Client("http://localhost:8080");
      await client.activate();

      dispatch(setReduxClient(client));

      const doc = new yorkie.Document<any>("dotting");
      await client.attach(doc);
      dispatch(setReduxDoc(doc));
      doc.update((root) => {
        console.log("useEffect updated");

        if (!root.dataArray) {
          root.dataArray = {};
          for (let i = 0; i < INITIAL_ROW_COUNT; i++) {
            root.dataArray[i] = {};
            for (let j = 0; j < INITIAL_COLUMN_COUNT; j++) {
              root.dataArray[i][j] = {};
              root.dataArray[i][j].name = undefined;
              root.dataArray[i][j].color = undefined;
            }
          }
        } else {
          //root.dataArray exists
        }
        // if (!root.laneKeys) {
        root.laneKeys = {
          prev_rowStartKey: 0,
          rowStartKey: 0,
          prev_rowLastKey: INITIAL_ROW_COUNT - 1,
          rowLastKey: INITIAL_ROW_COUNT - 1,
          prev_columnStartKey: 0,
          columnStartKey: 0,
          prev_columnLastKey: INITIAL_COLUMN_COUNT - 1,
          columnLastKey: INITIAL_COLUMN_COUNT - 1,
        };
        // }
        // root.laneKeys.rowStartKey = new yorkie.Counter(0);
        // root.laneKeys.rowLastkey = new yorkie.Counter(INITIAL_ROW_COUNT - 1);
        // root.laneKeys.columnStartKey = new yorkie.Counter(0);
        // root.laneKeys.columnLastKey = new yorkie.Counter(
        //   INITIAL_COLUMN_COUNT - 1
        // );
        // }

        console.log("Is this dataArray", Object.keys(root.dataArray));
      });

      doc.subscribe((event) => {
        if (event.type === "local-change") {
          // console.log("local evetn", event);
          // console.log("local event value: ", event.value);
        } else if (event.type === "remote-change") {
          for (const changeInfo of event.value) {
            // console.log(changeInfo.change);
            for (const path of changeInfo.paths) {
              console.log("all paths: ", path);
              if (path.startsWith(`$.dataArray`)) {
                //dataArray is change
                const changePathArray = path.split(".");
                const rowIndex = changePathArray[2];
                const columnIndex = changePathArray[3];
                const changeType = changePathArray[4];
                if (doc.getRoot().dataArray[rowIndex][columnIndex]) {
                  const newColor =
                    doc.getRoot().dataArray[rowIndex][columnIndex].color;
                  const newName =
                    doc.getRoot().dataArray[rowIndex][columnIndex].name;
                  if (changeType === "color") {
                    modifyPixelById({
                      rowIndex: Number(rowIndex),
                      columnIndex: Number(columnIndex),
                      color: newColor,
                      name: newName,
                    });
                  } else if (changeType === "name") {
                    dispatch(
                      appendToGroup({
                        key: newName,
                        data: [
                          {
                            rowIndex: Number(rowIndex),
                            columnIndex: Number(columnIndex),
                            color: newColor,
                            name: newName,
                          },
                        ],
                      })
                    );
                    dispatch(
                      changeGroupColor({ key: newName, color: newColor })
                    );
                  }
                }
              } else if (path.startsWith(`$.laneKeys`)) {
                //this has to do with lane option
                const changePathArray = path.split(".");
                const changedPart = changePathArray[2];
                switch (changedPart) {
                  case "rowStartKey":
                    console.log("this is called");
                    const topRowChangeAmount =
                      doc.getRoot().laneKeys.rowStartKey -
                      doc.getRoot().laneKeys.prev_rowStartKey;
                    if (topRowChangeAmount > 0) {
                      deleteRow({ position: Position.TOP });
                      doc.getRoot().laneKeys.prev_rowStartKey++;
                    } else if (topRowChangeAmount < 0) {
                      console.log("added row to tope");
                      addRow({ position: Position.TOP, data: [] });
                      doc.getRoot().laneKeys.prev_rowStartKey--;
                    }
                    break;
                  case "rowLastKey":
                    const bottomRowChangeAmount =
                      doc.getRoot().laneKeys.rowLastKey -
                      doc.getRoot().laneKeys.prev_rowLastKey;
                    if (bottomRowChangeAmount > 0) {
                      addRow({ position: Position.BOTTOM, data: [] });
                      doc.getRoot().laneKeys.prev_rowLastKey++;
                    } else if (bottomRowChangeAmount < 0) {
                      deleteRow({ position: Position.BOTTOM });
                      doc.getRoot().laneKeys.prev_rowLastKey--;
                    }
                    break;
                  case "columnStartKey":
                    const leftColumnChangeAmount =
                      doc.getRoot().laneKeys.columnStartKey -
                      doc.getRoot().laneKeys.prev_columnStartKey;
                    if (leftColumnChangeAmount > 0) {
                      addColumn({ position: Position.LEFT, data: [] });
                      doc.getRoot().laneKeys.prev_columnStartKey++;
                    } else if (leftColumnChangeAmount < 0) {
                      deleteColumn({ position: Position.LEFT });
                      doc.getRoot().laneKeys.prev_columnStartKey--;
                    }
                    break;
                  case "columnLastKey":
                    const rightColumnChangeAmount =
                      doc.getRoot().laneKeys.columnLastKey -
                      doc.getRoot().laneKeys.prev_columnLastKey;
                    if (rightColumnChangeAmount > 0) {
                      addColumn({ position: Position.RIGHT, data: [] });
                      doc.getRoot().laneKeys.prev_columnLastKey++;
                    } else if (rightColumnChangeAmount < 0) {
                      deleteColumn({ position: Position.RIGHT });
                      doc.getRoot().laneKeys.prev_columnLastKey--;
                    }
                    break;
                }
              }
            }
          }
        }
      });

      // });
    };

    activate();
  }, []);

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
    data: pixelData.pixelDataElement[];
  }) => {
    const newColumnIndex =
      position === Position.LEFT
        ? pixel2dArray[0].columns[0].columnIndex - 1
        : pixel2dArray[0].columns[pixel2dArray[0].columns.length - 1]
            .columnIndex + 1;
    doc?.update((root) => {
      for (const rows of root.dataArray) {
        rows[newColumnIndex].name = undefined;
        rows[newColumnIndex].color = undefined;
      }
      position === Position.LEFT
        ? (root.laneKeys.columnStartKey -= 1)
        : (root.laneKeys.columnLastKey += 1);
    });

    const tempPixel2dArray = pixel2dArray.map((row, elementIndex) => {
      const key = `row${row.rowIndex}column${newColumnIndex}`;
      const newColumn: Pixel2dPixel = {
        columnIndex: newColumnIndex,
        pixel: (
          <Pixel
            key={key}
            id={key}
            rowIndex={row.rowIndex}
            columnIndex={newColumnIndex}
            dataColor={data[elementIndex]?.color}
            dataName={data[elementIndex]?.name}
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
    data: pixelData.pixelDataElement[];
  }) => {
    let newRowIndex!: number;
    // const newRowIndex =
    // position === Position.TOP
    //   ? pixel2dArray[0].rowIndex - 1
    //   : pixel2dArray[pixel2dArray.length - 1].rowIndex + 1;
    doc?.update((root) => {
      newRowIndex =
        position === Position.TOP
          ? Number(root.laneKeys.rowStartKey - 1)
          : Number(root.laneKeys.rowLastKey + 1);
      root.dataArray[newRowIndex] = {};
      for (
        let i = root.laneKeys.columnStartKey;
        i < root.laneKeys.columnLastKey + 1;
        i++
      ) {
        root.dataArray[newRowIndex][i] = {};
        root.dataArray[newRowIndex][i].name = undefined;
        root.dataArray[newRowIndex][i].color = undefined;
      }
      if (position === Position.TOP) {
        root.laneKeys.rowStartKey--;
      } else {
        root.laneKeys.rowLastKey++;
      }
    });
    if (newRowIndex) {
      const firstRowColumns = pixel2dArray[0].columns;
      console.log(newRowIndex, firstRowColumns, "this is inner");
      const columns: Pixel2dPixel[] = [];
      firstRowColumns.map((element) => {
        const i = element.columnIndex;
        columns.push({
          columnIndex: i,
          pixel: (
            <Pixel
              key={`row${newRowIndex}column${i}`}
              id={`row${newRowIndex}column${i}`}
              rowIndex={newRowIndex}
              columnIndex={i}
              dataColor={data[i]?.color}
              dataName={data[i]?.name}
            />
          ),
        });
      });
      const newRow: Pixel2dRow = { rowIndex: newRowIndex, columns: columns };
      const tempPixel2dArray =
        position === Position.TOP
          ? appendBefore(newRow, pixel2dArray)
          : appendBehind(newRow, pixel2dArray);
      setPixel2dArray(tempPixel2dArray);
    }
  };

  const deleteColumn = ({
    position,
  }: {
    position: Position.LEFT | Position.RIGHT;
  }) => {
    doc?.update((root) => {
      const columnIndexToDelete =
        position === Position.LEFT
          ? root.laneKeys.columnStartKey + 1
          : root.laneKeys.columnLastKey - 1;
      for (const rows of root.dataArray) {
        rows[columnIndexToDelete].name = undefined;
        rows[columnIndexToDelete].color = undefined;
      }
      position === Position.LEFT
        ? (root.laneKeys.columnStartKey += 1)
        : (root.laneKeys.columnLastKey -= 1);
    });
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
    doc?.update((root) => {
      const rowIndexToDelete =
        position === Position.TOP
          ? root.laneKeys.rowStartKey + 1
          : root.laneKeys.rowLastKey - 1;
      for (
        let i = root.laneKeys.columnStartKey;
        i < root.laneKeys.columnLastKey + 1;
        i++
      ) {
        root.dataArray[rowIndexToDelete][i].name = undefined;
        root.dataArray[rowIndexToDelete][i].color = undefined;
      }
      position === Position.TOP
        ? (root.laneKeys.rowStartKey += 1)
        : (root.laneKeys.rowLastKey -= 1);
    });
    const rowIndexToDelete =
      position === Position.TOP ? 0 : pixel2dArray.length - 1;
    const tempPixel2dArray = pixel2dArray.filter((row, rowIndex) => {
      return rowIndex !== rowIndexToDelete;
    });
    setPixel2dArray(tempPixel2dArray);
  };

  const initialize = () => {
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
              dataName={pixel.name}
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
  };

  useEffect(() => {
    initialize();
  }, [initialData]);

  if (!doc || !client) {
    return null;
  }

  return (
    <S.Container>
      <button
        onClick={(e) => {
          doc.update((root) => {
            console.log(root.dataArray[1][1].name);
            root.dataArray[1][1].name = "hi";
          });
        }}
      >
        doc array update
      </button>
      <button
        onClick={(e) => {
          doc.update((root) => {
            // console.log(root.dataArray.row1, root.dataArray.column1);
            // console.log(root.dataArray[1][1]);
            // root.dataArray[1][1] = undefined;
          });
        }}
      >
        checkflag
      </button>
      <button
        onClick={(e) => {
          doc.update((root) => {
            console.log(root.dataArray[1][1]);
            root.dataArray[1][1] = undefined;
          });
        }}
      >
        doc make undefined
      </button>
      <button
        onClick={(e) => {
          doc.update((root) => {
            root.number = Math.random();
          });
        }}
      >
        other update
      </button>
      <button
        onClick={(e) => {
          doc.update((root) => {
            // root.row1column1 = undefined;
            // root.oneDimension[0] = 2;
          });
        }}
      >
        make undefined
      </button>
      <button
        onClick={(e) => {
          doc.update((root) => {
            // root.row1column1.name = "daff";
            // root.oneDimension[0] = 2;
          });
        }}
      >
        change name
      </button>
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
          addRow={addRow}
          addColumn={addColumn}
          deleteRow={deleteRow}
          deleteColumn={deleteColumn}
          pixel2dArray={pixel2dArray}
        >
          <PixelsContainer
            doc={doc}
            client={client}
            panelRef={panelRef}
            pixel2dArray={pixel2dArray}
            addColumn={addColumn}
            addRow={addRow}
            deleteColumn={deleteColumn}
            deleteRow={deleteRow}
          />
          <div style={{ position: "absolute", pointerEvents: "none" }}>
            {pixel2dArray.map((row) => {
              return (
                <div style={{ display: "flex" }} key={`row${row.rowIndex}`}>
                  {row.columns.map((element) => {
                    return (
                      <PixelBorder
                        key={`row${row.rowIndex}column${element.columnIndex}`}
                      />
                    );
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
