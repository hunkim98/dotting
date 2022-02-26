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

interface Props {
  resetKeys: PanelKeys;
  panelRef: HTMLDivElement;
  setResetKeys: React.Dispatch<React.SetStateAction<PanelKeys>>;
  currentKeys: PanelKeys;
  setCurrentKeys: React.Dispatch<React.SetStateAction<PanelKeys>>;
  colorArray: dataArrayElement[];
  setColorArray: React.Dispatch<React.SetStateAction<dataArrayElement[]>>;
}

const Panel: React.FC<Props> = ({
  panelRef,
  resetKeys,
  setResetKeys,
  currentKeys,
  setCurrentKeys,
  colorArray,
  setColorArray,
}) => {
  const dispatch = useDispatch();
  const [finalRows, setFinalRows] = useState<PixelDTO[][]>([]); //this is a 2d array
  const [randomKey, setRandomKey] = useState<number>(Math.random());
  const [panelColor, setPanelColor] = useState<dataArrayElement[]>([]);
  console.log("panel renderd");

  const {
    dataArray,
    setDataArray,
    history,
    setHistory,
    historyIndex,
    setHistoryIndex,
    createNewBranchHistory,
    setIsHistoryBranchCreated,
    isHistoryBranchCreated,
    addToHistory,
  } = useContext(DataContext);
  //*** remember that map function does not rerender when the index is the same ***

  useEffect(() => {
    //this is always called at first
    const tempFinalRows: PixelDTO[][] = [];

    setPanelColor(colorArray);
    setDataArray(colorArray); //we must initialize data array with the given colorArray
    for (let j = resetKeys.T_key; j <= resetKeys.B_key; j++) {
      const tempRow: PixelDTO[] = [];
      for (let i = resetKeys.L_key; i <= resetKeys.R_key; i++) {
        tempRow.push({ rowIndex: j, columnIndex: i });
      }
      tempFinalRows.push(tempRow);
    }
    setFinalRows(tempFinalRows);

    setCurrentKeys({
      L_key: resetKeys.L_key,
      R_key: resetKeys.R_key,
      T_key: resetKeys.T_key,
      B_key: resetKeys.B_key,
    });
  }, [resetKeys]);

  useEffect(() => {
    // setRandomKey(Math.random()); //this allows pixel remapping
    setPanelColor(dataArray);
    if (historyIndex === history.length) {
      if (history.length === 0) {
        //initialize
        setHistory([{ colorHistory: dataArray, keyHistory: currentKeys }]);
      } else if (history.length > 0) {
        if (
          JSON.stringify(dataArray) !==
            JSON.stringify(history[history.length - 1].colorHistory) ||
          JSON.stringify(currentKeys) !==
            JSON.stringify(history[history.length - 1].keyHistory)
        ) {
          console.log("history set");
          //do not save duplicate histories with the same values
          addToHistory(dataArray, currentKeys);
        }
      }
    }
  }, [dataArray]);

  useEffect(() => {
    if (!isHistoryBranchCreated) {
      console.log("user created new history");
      createNewBranchHistory(dataArray, currentKeys);
    }
  }, [isHistoryBranchCreated]);

  useEffect(() => {
    setRandomKey(Math.random()); //to rerender mapped JSX components we needto change the keys
    console.log("currentKeys changed");
    const existingRowIndex = range(currentKeys.T_key, currentKeys.B_key);
    const existingColumnIndex = range(currentKeys.L_key, currentKeys.R_key);
    setDataArray(
      //because the currentkey change also changes data array, we can set history in useEffect dataArray
      dataArray.filter(
        (i) =>
          existingRowIndex.includes(i.rowIndex) &&
          existingColumnIndex.includes(i.columnIndex)
      )
    ); // this deletes data of pixels that are out of boundary
  }, [currentKeys]);

  useEffect(() => {
    //this is for going back to previous history
    if (historyIndex < history.length && historyIndex > 0) {
      setColorArray(
        JSON.parse(JSON.stringify(history[historyIndex - 1].colorHistory))
      );
      setResetKeys(
        JSON.parse(JSON.stringify(history[historyIndex - 1].keyHistory))
      );
    }
  }, [historyIndex]);
  return (
    <S.Container>
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
            const pixels = document.getElementsByClassName("pixel");
            const pixelsContainer = document.getElementById("pixelsContainer");
            console.log(rows.length);
            const columnLength = pixels.length / rows.length;
            // const element = <h1>hi</h1>;
            // ReactDOM.render(element, pixels);
            const rowIndex = Math.random();
            const rowElement = document.createElement("div");
            rowElement.id = `row${rowIndex}`;
            rowElement.style.display = "flex";
            pixelsContainer?.insertBefore(rowElement, rows[0]);
            console.log("hey");
            console.log(columnLength);
            const columns: JSX.Element[] = [];
            for (let i = 0; i < columnLength; i++) {
              columns.push(
                <Pixel
                  key={`row${rowIndex}columns${i}`}
                  id={`row${rowIndex}columns${i}`}
                  rowIndex={rowIndex}
                  columnIndex={i}
                />
              );
            }
            ReactDOM.render(
              <Provider store={store()}>{columns}</Provider>,
              document.getElementById(`row${rowIndex}`)
            );

            console.log("renderERROR");

            // panelRef.insertBefore(element, rows[0]);
          }}
        >
          +
        </button>
        <button
          onMouseDown={() => {
            //user committed an action while looking through histories
            setIsHistoryBranchCreated(false);
          }}
          onClick={() => {
            if (currentKeys.B_key - currentKeys.T_key > 1) {
              setFinalRows(
                finalRows.filter((i, index) => {
                  return index !== 0;
                })
              );
              setCurrentKeys({ ...currentKeys, T_key: currentKeys.T_key + 1 });
            }
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
        <PixelsContainer
          panelRef={panelRef}
          // setIsHistoryBranchCreated={setIsHistoryBranchCreated}
          // finalRows={finalRows}
          // randomKey={randomKey}
          // currentKeys={currentKeys}
          // panelColor={panelColor}
        />
        <PixelBordersContainer />

        <S.WidthControlContainer location="right">
          <button
            onMouseDown={() => {
              //user committed an action while looking through histories
              setIsHistoryBranchCreated(false);
            }}
            onClick={() => {
              const tempColumnIndex = currentKeys.R_key - 1;
              setFinalRows(
                finalRows.map((X: PixelDTO[], index: number) => {
                  const tempRow: PixelDTO[] = [
                    ...X,
                    {
                      rowIndex: currentKeys.T_key + index,
                      columnIndex: tempColumnIndex,
                    },
                  ];
                  return tempRow;
                })
              );
              setCurrentKeys({ ...currentKeys, R_key: currentKeys.R_key + 1 });
            }}
          >
            +
          </button>
          <button
            onMouseDown={() => {
              //user committed an action while looking through histories
              setIsHistoryBranchCreated(false);
            }}
            onClick={() => {
              if (currentKeys.R_key - currentKeys.L_key > 1) {
                console.log("working minus");
                setFinalRows(
                  finalRows.map((X) => {
                    return X.filter((Y, index) => {
                      return index !== X.length - 1;
                    });
                  })
                );
              }
              setCurrentKeys({ ...currentKeys, R_key: currentKeys.R_key - 1 });
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
            setIsHistoryBranchCreated(false);
          }}
          onClick={() => {
            const tempRow: PixelDTO[] = [];
            for (let i = currentKeys.L_key; i <= currentKeys.R_key; i++) {
              tempRow.push({ rowIndex: currentKeys.B_key + 1, columnIndex: i });
            }
            setFinalRows((X: PixelDTO[][]) => {
              return [...X, tempRow];
            });
            setCurrentKeys({ ...currentKeys, B_key: currentKeys.B_key + 1 });
          }}
        >
          +
        </button>
        <button
          onMouseDown={() => {
            //user committed an action while looking through histories
            setIsHistoryBranchCreated(false);
          }}
          onClick={() => {
            if (currentKeys.B_key - currentKeys.T_key > 1) {
              setFinalRows(
                finalRows.filter((i, index) => {
                  return index !== finalRows.length - 1;
                })
              );
              setCurrentKeys({ ...currentKeys, B_key: currentKeys.B_key - 1 });
            }
          }}
        >
          -
        </button>
      </S.HeightControlContainer>
    </S.Container>
  );
};

export default Panel;
