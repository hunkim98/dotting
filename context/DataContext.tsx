import React, { createContext, Dispatch, useEffect, useState } from "react";
import { PanelKeys, dataArrayElement } from "../const/CommonDTO";

interface Props {
  children: JSX.Element | Array<JSX.Element>;
}

interface dataElement {
  dataArray: Array<dataArrayElement>;
  setDataArray: Dispatch<React.SetStateAction<dataArrayElement[]>>;
  history: Array<History>;
  setHistory: Dispatch<React.SetStateAction<History[]>>;
  historyIndex: number;
  setHistoryIndex: Dispatch<React.SetStateAction<number>>;
  maximumHistoryCount: number;
  createNewBranchHistory: (
    colorHistoryInput: dataArrayElement[],
    keyHistoryInput: PanelKeys
  ) => void;
  addToHistory: (
    colorHistoryInput: dataArrayElement[],
    keyHistoryInput: PanelKeys
  ) => void;
  isHistoryBranchCreated: boolean;
  setIsHistoryBranchCreated: Dispatch<React.SetStateAction<boolean>>;
}

interface History {
  //this is for allowing ctrl z
  colorHistory: dataArrayElement[];
  keyHistory: PanelKeys;
}

const DataContext = createContext<dataElement>({} as dataElement);

const DataContextProvider = ({ children }: Props) => {
  const [dataArray, setDataArray] = useState<dataArrayElement[]>([]);
  const [history, setHistory] = useState<History[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [isHistoryBranchCreated, setIsHistoryBranchCreated] =
    useState<boolean>(false);
  const maximumHistoryCount = 40;

  useEffect(() => {
    console.log("current history", history);
    if (history.length > 0 && history.length <= maximumHistoryCount) {
      setHistoryIndex(history.length); //this counts the history data
    }
    if (history.length > maximumHistoryCount) {
      //we will limit the maximum history length to 20
      setHistory((prevState: History[]) =>
        prevState.filter((X, index) => {
          return index !== 0; //remove the first element in stack
        })
      );
    }
  }, [history]);

  const createNewBranchHistory = (
    colorHistoryInput: dataArrayElement[],
    keyHistoryInput: PanelKeys
  ) => {
    const tempHistory = history;
    const colorHistory = JSON.parse(JSON.stringify(colorHistoryInput));
    const keyHistory = JSON.parse(JSON.stringify(keyHistoryInput));
    tempHistory[historyIndex] = { colorHistory, keyHistory };
    //erase the later parts
    setHistory(
      tempHistory.filter((X, index) => {
        return index < historyIndex + 1;
      })
    );
  };

  const addToHistory = (
    colorHistoryInput: dataArrayElement[],
    keyHistoryInput: PanelKeys
  ) => {
    const colorHistory = JSON.parse(JSON.stringify(colorHistoryInput));
    const keyHistory = JSON.parse(JSON.stringify(keyHistoryInput));
    setHistory((X) => {
      //add to history
      return [
        ...X,
        {
          colorHistory,
          keyHistory,
        },
      ];
    });
  };

  return (
    <DataContext.Provider
      value={{
        dataArray,
        setDataArray,
        history,
        setHistory,
        historyIndex,
        setHistoryIndex,
        maximumHistoryCount,
        createNewBranchHistory,
        isHistoryBranchCreated,
        setIsHistoryBranchCreated,
        addToHistory,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export { DataContext, DataContextProvider };
