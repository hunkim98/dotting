import { createContext, useState, useEffect } from "react";

interface Props {
  children: JSX.Element | Array<JSX.Element>;
}

interface rowControlElement {
  topRowKey: number;
  bottomRowKey: number;
  setTopRowKey: (X: number) => void | number;
  setBottomRowKey: (X: number) => void | number;
  // This is for initialization

  deleteTopRow: boolean;
  deleteBottomRow: boolean;
  setDeleteTopRow: (X: boolean) => void;
  setDeleteBottomRow: (X: boolean) => void;

  increaseTopRow: boolean;
  increaseBottomRow: boolean;
  setIncreaseTopRow: (X: boolean) => void;
  setIncreaseBottomRow: (X: boolean) => void;
}

const RowControlContext = createContext<rowControlElement>({
  topRowKey: 0,
  bottomRowKey: 0,
  setTopRowKey: (X: number): void | number => {},
  setBottomRowKey: (X: number): void | number => {},

  deleteTopRow: false,
  deleteBottomRow: false,
  setDeleteTopRow: (X: boolean): void => {},
  setDeleteBottomRow: (X: boolean): void => {},

  increaseTopRow: false,
  increaseBottomRow: false,
  setIncreaseTopRow: (X: boolean): void => {},
  setIncreaseBottomRow: (X: boolean): void => {},
});

const RowControlContextProvider = ({ children }: Props) => {
  const [topRowKey, setTopRowKey] = useState<number>(0);
  const [bottomRowKey, setBottomRowKey] = useState<number>(0);
  const [deleteTopRow, setDeleteTopRow] = useState<boolean>(false);
  const [deleteBottomRow, setDeleteBottomRow] = useState<boolean>(false);
  const [increaseTopRow, setIncreaseTopRow] = useState<boolean>(false);
  const [increaseBottomRow, setIncreaseBottomRow] = useState<boolean>(false);

  return (
    <RowControlContext.Provider
      value={{
        topRowKey,
        bottomRowKey,
        setTopRowKey,
        setBottomRowKey,
        //
        deleteTopRow,
        deleteBottomRow,
        setDeleteBottomRow,
        setDeleteTopRow,
        //
        increaseTopRow,
        increaseBottomRow,
        setIncreaseBottomRow,
        setIncreaseTopRow,
      }}
    >
      {children}
    </RowControlContext.Provider>
  );
};

export { RowControlContext, RowControlContextProvider };
