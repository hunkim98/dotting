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
import { decodePixelId, modifyPixelById } from "../../../const/PixelFunctions";
import {
  appendToGroup,
  changeGroupColor,
} from "../../../store/modules/colorGroupSlice";
import {
  AddColumnInterface,
  AddRowInterface,
  DeleteColumnInterface,
  DeleteRowInterface,
} from "./SizeControl/SizeControlProps";

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
                    if (newName) {
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
                }
              } else if (path.startsWith(`$.laneKeys`)) {
                //this has to do with lane option
                const changePathArray = path.split(".");
                const changedPart = changePathArray[2];
                // addRow({ position: Position.TOP, data: [] });
                switch (changedPart) {
                  case "rowStartKey":
                    console.log("this is called");
                    const rowStartKey = doc.getRoot().laneKeys.rowStartKey;
                    const prevRowStartKey =
                      doc.getRoot().laneKeys.prev_rowStartKey;
                    const topRowChangeAmount = rowStartKey - prevRowStartKey;
                    if (topRowChangeAmount > 0) {
                      deleteRow({
                        rowIndex: prevRowStartKey,
                        position: Position.TOP,
                      });
                      doc.getRoot().laneKeys.prev_rowStartKey++;
                    } else if (topRowChangeAmount < 0) {
                      console.log("added row to top");
                      addRow({
                        rowIndex: prevRowStartKey - 1,
                        position: Position.TOP,
                        data: [],
                      });
                      doc.getRoot().laneKeys.prev_rowStartKey--;
                    }
                    break;
                  case "rowLastKey":
                    const rowLastKey = doc.getRoot().laneKeys.rowLastKey;
                    const prevRowLastKey =
                      doc.getRoot().laneKeys.prev_rowLastKey;
                    const bottomRowChangeAmount = rowLastKey - prevRowLastKey;
                    if (bottomRowChangeAmount > 0) {
                      addRow({
                        rowIndex: prevRowLastKey + 1,
                        position: Position.BOTTOM,
                        data: [],
                      });
                      doc.getRoot().laneKeys.prev_rowLastKey++;
                    } else if (bottomRowChangeAmount < 0) {
                      deleteRow({
                        rowIndex: prevRowLastKey,
                        position: Position.BOTTOM,
                      });
                      doc.getRoot().laneKeys.prev_rowLastKey--;
                    }
                    break;
                  case "columnStartKey":
                    const columnStartKey =
                      doc.getRoot().laneKeys.columnStartKey;
                    const prevColumnStartKey =
                      doc.getRoot().laneKeys.prev_columnStartKey;
                    const leftColumnChangeAmount =
                      columnStartKey - prevColumnStartKey;
                    if (leftColumnChangeAmount > 0) {
                      deleteColumn({
                        columnIndex: prevColumnStartKey,
                        position: Position.LEFT,
                      });
                      doc.getRoot().laneKeys.prev_columnStartKey++;
                    } else if (leftColumnChangeAmount < 0) {
                      addColumn({
                        columnIndex: prevColumnStartKey - 1,
                        position: Position.LEFT,
                        data: [],
                      });
                      doc.getRoot().laneKeys.prev_columnStartKey--;
                    }
                    break;
                  case "columnLastKey":
                    const columnLastKey = doc.getRoot().laneKeys.columnLastKey;
                    const prevColumnLastKey =
                      doc.getRoot().laneKeys.prev_columnLastKey;
                    const rightColumnChangeAmount =
                      columnLastKey - prevColumnLastKey;
                    if (rightColumnChangeAmount > 0) {
                      addColumn({
                        columnIndex: prevColumnLastKey + 1,
                        position: Position.RIGHT,
                        data: [],
                      });
                      doc.getRoot().laneKeys.prev_columnLastKey++;
                    } else if (rightColumnChangeAmount < 0) {
                      deleteColumn({
                        columnIndex: prevColumnLastKey,
                        position: Position.RIGHT,
                      });
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

  const addColumn = ({ columnIndex, position, data }: AddColumnInterface) => {
    const newColumnIndex = columnIndex;
    let dataIndex = 0;
    setPixel2dArray((previous) => {
      return previous.map((previousRow) => {
        const key = `row${previousRow.rowIndex}column${newColumnIndex}`;
        const newColumn: Pixel2dPixel = {
          columnIndex: newColumnIndex,
          pixel: (
            <Pixel
              key={key}
              id={key}
              rowIndex={previousRow.rowIndex}
              columnIndex={newColumnIndex}
              dataColor={data[dataIndex]?.color}
              dataName={data[dataIndex]?.name}
            />
          ),
        };
        const changedColumns =
          position === Position.LEFT
            ? appendBefore(newColumn, previousRow.columns)
            : appendBehind(newColumn, previousRow.columns);
        return {
          rowIndex: previousRow.rowIndex,
          columns: changedColumns,
        };
      });
    });
  };

  const addRow = ({ rowIndex, position, data }: AddRowInterface) => {
    const newRowIndex = rowIndex;
    //apply changes to pixels
    setPixel2dArray((previous) => {
      const columns = previous[0].columns;
      const columnFirstKey = columns[0].columnIndex;
      const columnEndKey = columns[columns.length - 1].columnIndex;
      const newRowColumns: Pixel2dPixel[] = [];
      let dataIndex = 0;
      for (let i = columnFirstKey; i < columnEndKey + 1; i++) {
        const key = `row${newRowIndex}column${i}`;
        newRowColumns.push({
          columnIndex: i,
          pixel: (
            <Pixel
              key={key}
              id={key}
              rowIndex={newRowIndex}
              columnIndex={i}
              dataColor={data[dataIndex]?.color}
              dataName={data[dataIndex]?.name}
            />
          ),
        });
        dataIndex++;
      }

      if (position === Position.TOP) {
        return appendBefore(
          { rowIndex: newRowIndex, columns: newRowColumns },
          previous
        );
      } else {
        return appendBehind(
          { rowIndex: newRowIndex, columns: newRowColumns },
          previous
        );
      }
    });

    return { newRowIndex: newRowIndex };
  };

  const deleteColumn = ({ columnIndex, position }: DeleteColumnInterface) => {
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

  const deleteRow = ({ rowIndex, position }: DeleteRowInterface) => {
    const rowElements = document.getElementsByClassName("row");
    const rowToDelete =
      position === Position.TOP
        ? rowElements[0]
        : rowElements[rowElements.length - 1];
    const columnsInRow = rowToDelete.children;

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
            root.laneKeys.hi = 0;
          });
        }}
      >
        add row test
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
