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

interface Props {
  // resetKeys: PanelKeys;
  initialData: pixelData.pixelDataElement[][];
  panelRef: React.RefObject<HTMLDivElement>;
  // setResetKeys: React.Dispatch<React.SetStateAction<PanelKeys>>;
  // currentKeys: PanelKeys;
  // setCurrentKeys: React.Dispatch<React.SetStateAction<PanelKeys>>;
  colorArray: dataArrayElement[];
  setColorArray: React.Dispatch<React.SetStateAction<dataArrayElement[]>>;
}

const Panel: React.FC<Props> = ({
  initialData,
  panelRef,
  // resetKeys,
  // setResetKeys,
  // currentKeys,
  // setCurrentKeys,
  colorArray,
  setColorArray,
}) => {
  const dispatch = useDispatch();
  const [pixel2dArray, setPixel2dArray] = useState<
    { id: string; columns: JSX.Element[] }[]
  >([]);
  const [finalRows, setFinalRows] = useState<PixelDTO[][]>([]); //this is a 2d array
  const [randomKey, setRandomKey] = useState<number>(Math.random());
  const [panelColor, setPanelColor] = useState<dataArrayElement[]>([]);

  console.log("panel renderd");

  useEffect(() => {
    const tempPixel2dArray: { id: string; columns: JSX.Element[] }[] = [];
    initialData.map((row, rowIndex) => {
      const tempPixel2dArrayRow: JSX.Element[] = [];
      row.map((pixel, columnIndex) => {
        tempPixel2dArrayRow.push(
          <Pixel
            id={`row${rowIndex}column${columnIndex}`}
            rowIndex={rowIndex}
            columnIndex={columnIndex}
            dataColor={pixel.color}
          ></Pixel>
        );
      });
      tempPixel2dArray.push({
        id: `row${rowIndex}`,
        columns: tempPixel2dArrayRow,
      });
    });
    setPixel2dArray(tempPixel2dArray);
  }, [initialData]);

  // useEffect(() => {
  //   if (panelRef && panelRef.current) {
  //     for (let i = 0; i < initialData.length; i++) {
  //       const tempRow = document.createElement("div");
  //       tempRow.id = `row${i}`;
  //       tempRow.className = "row";
  //       panelRef.current.append(tempRow);
  //       const tempRowElements: JSX.Element[] = [];
  //       for (let j = 0; j < initialData[0].length; j++) {
  //         const rowRef = document.getElementById(`row${i}`);
  //         const tempColumn = document.createElement("div");
  //         const containerId = `row${i}column${j}container`;
  //         tempColumn.id = containerId;
  //         rowRef?.append();
  //         tempRowElements.push(
  //           // <Provider store={store()}>
  //           <div id={`row${i}column${j}container`}>
  //             <Pixel id={`row${i}column${j}`} rowIndex={i} columnIndex={j} />
  //           </div>
  //           // </Provider>
  //         );
  //       }
  //       // const tempRow = <Provider store={store()}>{tempRowElements}</Provider>;
  //     }
  //   }
  // }, [initialData, panelRef]);

  // useEffect(() => {
  //   // setRandomKey(Math.random()); //this allows pixel remapping
  //   setPanelColor(dataArray);
  //   if (historyIndex === history.length) {
  //     if (history.length === 0) {
  //       //initialize
  //       setHistory([{ colorHistory: dataArray, keyHistory: currentKeys }]);
  //     } else if (history.length > 0) {
  //       if (
  //         JSON.stringify(dataArray) !==
  //           JSON.stringify(history[history.length - 1].colorHistory) ||
  //         JSON.stringify(currentKeys) !==
  //           JSON.stringify(history[history.length - 1].keyHistory)
  //       ) {
  //         console.log("history set");
  //         //do not save duplicate histories with the same values
  //         addToHistory(dataArray, currentKeys);
  //       }
  //     }
  //   }
  // }, [dataArray]);

  // useEffect(() => {
  //   if (!isHistoryBranchCreated) {
  //     console.log("user created new history");
  //     createNewBranchHistory(dataArray, currentKeys);
  //   }
  // }, [isHistoryBranchCreated]);

  // useEffect(() => {
  //   setRandomKey(Math.random()); //to rerender mapped JSX components we needto change the keys
  //   console.log("currentKeys changed");
  //   const existingRowIndex = range(currentKeys.T_key, currentKeys.B_key);
  //   const existingColumnIndex = range(currentKeys.L_key, currentKeys.R_key);
  //   setDataArray(
  //     //because the currentkey change also changes data array, we can set history in useEffect dataArray
  //     dataArray.filter(
  //       (i) =>
  //         existingRowIndex.includes(i.rowIndex) &&
  //         existingColumnIndex.includes(i.columnIndex)
  //     )
  //   ); // this deletes data of pixels that are out of boundary
  // }, [currentKeys]);

  // useEffect(() => {
  //   //this is for going back to previous history
  //   if (historyIndex < history.length && historyIndex > 0) {
  //     setColorArray(
  //       JSON.parse(JSON.stringify(history[historyIndex - 1].colorHistory))
  //     );
  //     setResetKeys(
  //       JSON.parse(JSON.stringify(history[historyIndex - 1].keyHistory))
  //     );
  //   }
  // }, [historyIndex]);
  return (
    <S.Container

    // onMouseDown={() => {
    //   dispatch(mouseEvent.mouseClickOn());
    // }}
    // onMouseUp={() => {
    //   dispatch(mouseEvent.mouseClickOff());
    // }}
    // onMouseLeave={() => {
    //   dispatch(mouseEvent.mouseClickOff());
    // }}
    >
      <div>
        <button
          onClick={() => {
            // if (historyIndex > 0) {
            //   console.log("this is index", historyIndex);
            //   setHistoryIndex((X: number) => X - 1);
            //   setIsHistoryBranchCreated(true);
            // }
            dispatch(pixelData.undo());
          }}
        >
          back
        </button>
        <button
          onClick={() => {
            dispatch(pixelData.redo());
            console.log("hihihihihi");
            ReactDOM.createPortal(
              <Pixel id="2" columnIndex={-99} rowIndex={22} />,
              document.body
            );
            //   if (historyIndex < history.length) {
            //     console.log("length", history.length);
            //     console.log("forward index", historyIndex);
            //     if (historyIndex + 1 === history.length) {
            //       //going back to original
            //       setColorArray(
            //         JSON.parse(JSON.stringify(history[historyIndex].colorHistory))
            //       );
            //       setResetKeys(
            //         JSON.parse(JSON.stringify(history[historyIndex].keyHistory))
            //       );
            //       console.log("setttt");
            //       // setCreateNewHistory(false);
            //     }
            //     setHistoryIndex((X: number) => X + 1);
            //   }
          }}
        >
          forward
        </button>
      </div>
      <S.HeightControlContainer>
        <button
          onClick={() => {
            const rows = document.getElementsByClassName("row");
            const columnCount = rows[0].children.length;
            const topRowIndex = Number(rows[0].id.replace("row", "")) - 1;
            const columns: JSX.Element[] = [];
            for (let i = 0; i < columnCount; i++) {
              console.log(i, "kkk");
              columns.push(
                <Pixel
                  key={`row${topRowIndex}column${i}`}
                  id={`row${topRowIndex}column${i}`}
                  rowIndex={topRowIndex}
                  columnIndex={i}
                />
              );
            }
            setPixel2dArray([
              { id: `row${topRowIndex}`, columns: columns },
              ...pixel2dArray,
            ]);
            // if (panelRef && panelRef.current) {
            //   console.log("inserted", panelRef);
            // }
            // const columnCount = rows[0].children.length;
            // console.log(columnCount);
            // const pixelsContainer = document.getElementById("pixelsContainer");
            // console.log(rows.length);
            // // const element = <h1>hi</h1>;
            // // ReactDOM.render(element, pixels);
            // const rowIndex = Number(rows[0].id.replace("row", "")) - 1;
            // console.log(rowIndex);
            // const rowElement = document.createElement("div");
            // rowElement.id = `row${rowIndex}`;
            // rowElement.style.display = "flex";
            // rowElement.className = "row";
            // if (panelRef && panelRef.current) {
            //   console.log("inserted", panelRef);
            //   panelRef.current.insertBefore(rowElement, rows[0]);
            // }
            // const columns: JSX.Element[] = [];
            // for (let i = 0; i < columnCount; i++) {
            //   console.log(i, "kkk");
            //   columns.push(
            //     <Pixel
            //       key={`row${rowIndex}column${i}`}
            //       id={`row${rowIndex}column${i}`}
            //       rowIndex={rowIndex}
            //       columnIndex={i}
            //     />
            //   );
            // }
            // const newRowAppended = document.getElementById(`row${rowIndex}`);
            // if (newRowAppended) {
            //   ReactDOM.render(
            //     // <div>hihih</div>,
            //     <Provider store={store()}>{columns}</Provider>,
            //     // document.getElementById(`row${rowIndex}`)
            //     newRowAppended
            //   );
            //   console.log("appended", newRowAppended);
            // }
            // console.log("renderERROR");
          }}
        >
          +
        </button>
        <button
          onMouseDown={() => {
            //user committed an action while looking through histories
          }}
          onClick={() => {
            // if (currentKeys.B_key - currentKeys.T_key > 1) {
            //   setFinalRows(
            //     finalRows.filter((i, index) => {
            //       return index !== 0;
            //     })
            //   );
            //   setCurrentKeys({ ...currentKeys, T_key: currentKeys.T_key + 1 });
            // }
          }}
        >
          -
        </button>
      </S.HeightControlContainer>
      <S.PixelsCanvasContainer>
        <S.WidthControlContainer location="left">
          <button onClick={() => {}}>+</button>
          <button onClick={() => {}}>-</button>
        </S.WidthControlContainer>
        <div id="pixelsContainer" ref={panelRef}>
          {pixel2dArray.map((row, rowIndex) => {
            return (
              <div key={row.id} id={row.id} className="row">
                {row.columns}
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
        <PixelBordersContainer initialData={initialData} />

        <S.WidthControlContainer location="right">
          <button
            onMouseDown={() => {
              //user committed an action while looking through histories
            }}
            onClick={() => {
              // const tempColumnIndex = currentKeys.R_key - 1;
              // setFinalRows(
              //   finalRows.map((X: PixelDTO[], index: number) => {
              //     const tempRow: PixelDTO[] = [
              //       ...X,
              //       {
              //         rowIndex: currentKeys.T_key + index,
              //         columnIndex: tempColumnIndex,
              //       },
              //     ];
              //     return tempRow;
              //   })
              // );
              // setCurrentKeys({ ...currentKeys, R_key: currentKeys.R_key + 1 });
            }}
          >
            +
          </button>
          <button
            onMouseDown={() => {
              //user committed an action while looking through histories
            }}
            onClick={() => {
              // if (currentKeys.R_key - currentKeys.L_key > 1) {
              //   console.log("working minus");
              //   setFinalRows(
              //     finalRows.map((X) => {
              //       return X.filter((Y, index) => {
              //         return index !== X.length - 1;
              //       });
              //     })
              //   );
              // }
              // setCurrentKeys({ ...currentKeys, R_key: currentKeys.R_key - 1 });
            }}
          >
            -
          </button>
        </S.WidthControlContainer>
      </S.PixelsCanvasContainer>
      <S.HeightControlContainer>
        <button
          onMouseDown={() => {
            //user committed an action while looking through histories
          }}
          onClick={() => {
            // const tempRow: PixelDTO[] = [];
            // for (let i = currentKeys.L_key; i <= currentKeys.R_key; i++) {
            //   tempRow.push({ rowIndex: currentKeys.B_key + 1, columnIndex: i });
            // }
            // setFinalRows((X: PixelDTO[][]) => {
            //   return [...X, tempRow];
            // });
            // setCurrentKeys({ ...currentKeys, B_key: currentKeys.B_key + 1 });
          }}
        >
          +
        </button>
        <button
          onMouseDown={() => {
            //user committed an action while looking through histories
          }}
          onClick={() => {
            // if (currentKeys.B_key - currentKeys.T_key > 1) {
            //   setFinalRows(
            //     finalRows.filter((i, index) => {
            //       return index !== finalRows.length - 1;
            //     })
            //   );
            //   setCurrentKeys({ ...currentKeys, B_key: currentKeys.B_key - 1 });
            // }
          }}
        >
          -
        </button>
      </S.HeightControlContainer>
    </S.Container>
  );
};

export default Panel;
