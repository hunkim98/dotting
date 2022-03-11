import { SetStateAction } from "react";
import { Pixel2dPixel, Pixel2dRow, Position } from "../Panel";
import { Pixel } from "../Pixel";
import * as S from "./styles";

interface Props {
  pixel2dArray: Pixel2dRow[];
  setPixel2dArray: React.Dispatch<SetStateAction<Pixel2dRow[]>>;
}

const SizeControl: React.FC<Props> = ({
  children,
  pixel2dArray,
  setPixel2dArray,
}) => {
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
  return (
    <>
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
      {children}
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
    </>
  );
};

export default SizeControl;
