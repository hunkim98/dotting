import { SetStateAction } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Pixel2dPixel, Pixel2dRow, Position } from "../Panel";
import { Pixel } from "../Pixel";
import { SizeControlProps } from "./SizeControlProps";
import * as S from "./styles";
import * as pixelDataRedux from "../../../../store/modules/pixelData";
import { RootState } from "../../../../store/modules";
import { decodePixelId } from "../../../../const/PixelFunctions";

interface Props extends SizeControlProps {
  pixel2dArray: Pixel2dRow[];
}

const SizeControl: React.FC<Props> = ({
  children,
  addRow,
  addColumn,
  deleteRow,
  deleteColumn,
  pixel2dArray,
}) => {
  const dispatch = useDispatch();
  const doc = useSelector((state: RootState) => state.docSlice.doc);

  const addRowAndUpdateRedux = ({
    position,
  }: {
    position: Position.TOP | Position.BOTTOM;
  }) => {
    // dom control for local change
    const rowElements = document.getElementsByClassName("row");
    const rowToAppendFrom =
      position === Position.TOP
        ? rowElements[0]
        : rowElements[rowElements.length - 1];
    const rowIndexToAppendFrom = Number(rowToAppendFrom.id.replace("row", "")); // ex: row0
    const newRowIndex =
      position === Position.TOP
        ? rowIndexToAppendFrom - 1
        : rowIndexToAppendFrom + 1;

    //doc update
    const isNewRowValid =
      position === Position.TOP
        ? doc?.getRoot().laneKeys.rowStartKey > newRowIndex
        : doc?.getRoot().laneKeys.rowLastKey < newRowIndex;
    // console.log(doc?.getRoot().laneKeys.rowLastKey, newRowIndex);

    if (isNewRowValid) {
      //docUpdate
      doc?.update((root) => {
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

      //change Panel
      addRow({ rowIndex: newRowIndex, position: position, data: [] });
      dispatch(
        pixelDataRedux.update({
          action: {
            type:
              position === Position.TOP
                ? pixelDataRedux.laneChangeActionType.ADD_TOP_LANE
                : pixelDataRedux.laneChangeActionType.ADD_BOTTOM_LANE,
            before: [],
            after: [],
          },
        })
      );
    }
  };

  const addColumnAndUpdateRedux = ({
    position,
  }: {
    position: Position.LEFT | Position.RIGHT;
  }) => {
    //dom
    const rowElements = document.getElementsByClassName("row");
    const columns = rowElements[0].children;
    const columnToAppendFrom =
      position === Position.LEFT ? columns[0] : columns[columns.length - 1];
    const { columnIndex } = decodePixelId(columnToAppendFrom.id);
    const newColumnIndex =
      position === Position.LEFT ? columnIndex - 1 : columnIndex + 1;

    const isNewColumnValid =
      position === Position.LEFT
        ? doc?.getRoot().laneKeys.columnStartKey > newColumnIndex
        : doc?.getRoot().laneKeys.columnLastKey < newColumnIndex;
    console.log(doc?.getRoot().laneKeys.columnLastKey, newColumnIndex);

    //doc update
    if (isNewColumnValid) {
      doc?.update((root) => {
        const rowStartKey = root.laneKeys.rowStartKey;
        const rowLastKey = root.laneKeys.rowLastKey;
        for (let i = rowStartKey; i < rowLastKey + 1; i++) {
          root.dataArray[i][newColumnIndex] = {};
          root.dataArray[i][newColumnIndex].name = undefined;
          root.dataArray[i][newColumnIndex].color = undefined;
        }
        if (position === Position.LEFT) {
          root.laneKeys.columnStartKey--;
        } else {
          root.laneKeys.columnLastKey++;
        }
      });

      //change applied locally to Panel.tsx
      addColumn({ columnIndex: newColumnIndex, position: position, data: [] });
      dispatch(
        pixelDataRedux.update({
          action: {
            type:
              position === Position.LEFT
                ? pixelDataRedux.laneChangeActionType.ADD_LEFT_LANE
                : pixelDataRedux.laneChangeActionType.ADD_RIGHT_LANE,
            before: [],
            after: [],
          },
        })
      );
    }
  };

  const deleteRowAndUpdateRedux = ({
    position,
  }: {
    position: Position.TOP | Position.BOTTOM;
  }) => {
    // dom control for local change
    const rowElements = document.getElementsByClassName("row");
    const rowToDelete =
      position === Position.TOP
        ? rowElements[0]
        : rowElements[rowElements.length - 1];
    const rowIndexToDelete = Number(rowToDelete.id.replace("row", "")); // ex: row0

    const beforeData: pixelDataRedux.pixelDataElement[] = [];
    if (rowToDelete) {
      for (let i = 0; i < rowToDelete.children.length; i++) {
        const columnElement: HTMLElement = rowToDelete.children[
          i
        ] as HTMLElement;
        const { columnIndex } = decodePixelId(columnElement.id);
        beforeData.push({
          rowIndex: rowIndexToDelete,
          columnIndex: columnIndex,
          name: columnElement.dataset.name,
          color: columnElement.style.backgroundColor,
        });
      }
    }

    //doc update
    doc?.update((root) => {
      const columnStartKey = root.laneKeys.columnStartKey;
      const columnLastkey = root.laneKeys.columnLastKey;
      for (let i = columnStartKey; i < columnLastkey + 1; i++) {
        root.dataArray[rowIndexToDelete][i].color = undefined;
        root.dataArray[rowIndexToDelete][i].name = undefined;
      }
      if (position === Position.TOP) {
        root.laneKeys.rowStartKey++;
      } else {
        root.laneKeys.rowLastKey--;
      }
    });

    //change applied to Panel.tsx
    deleteRow({ rowIndex: rowIndexToDelete, position: position }); //this setstates pixel2dArray, must happen after the above
    dispatch(
      pixelDataRedux.update({
        action: {
          type:
            position === Position.TOP
              ? pixelDataRedux.laneChangeActionType.REMOVE_TOP_LANE
              : pixelDataRedux.laneChangeActionType.REMOVE_BOTTOM_LANE,
          before: beforeData,
          after: [],
        },
      })
    );
  };

  const deleteColumnAndUpdateRedux = ({
    position,
  }: {
    position: Position.LEFT | Position.RIGHT;
  }) => {
    //dom
    const rowElements = document.getElementsByClassName("row");
    const columns = rowElements[0].children;
    const columnRelativeIndex = Position.LEFT ? 0 : columns.length - 1;
    const columnToDelete = columns[columnRelativeIndex];
    const { columnIndex } = decodePixelId(columnToDelete.id);
    const columnIndexToDelete = columnIndex;

    const beforeData: pixelDataRedux.pixelDataElement[] = [];
    if (rowElements) {
      for (let i = 0; i < rowElements.length; i++) {
        const columnElement = rowElements[i].children[
          columnRelativeIndex
        ] as HTMLElement;
        const rowIndex = Number(rowElements[i].id.replace("row", ""));
        beforeData.push({
          rowIndex: rowIndex,
          columnIndex: columnIndexToDelete,
          name: columnElement.dataset.name,
          color: columnElement.style.backgroundColor,
        });
      }
    }

    //doc update
    doc?.update((root) => {
      for (const row of Array.from(rowElements)) {
        const rowIndex = Number(row.id.replace("row", ""));
        delete root.dataArray[rowIndex][columnIndex];
      }
      if (position === Position.LEFT) {
        root.laneKeys.columnStartKey++;
      } else {
        root.laneKeys.columnLastKey--;
      }
    });

    //locally change Panel.tsx
    deleteColumn({ columnIndex: columnIndexToDelete, position: position });
    dispatch(
      pixelDataRedux.update({
        action: {
          type:
            position === Position.LEFT
              ? pixelDataRedux.laneChangeActionType.REMOVE_LEFT_LANE
              : pixelDataRedux.laneChangeActionType.REMOVE_RIGHT_LANE,
          before: beforeData,
          after: [],
        },
      })
    );
  };

  return (
    <>
      <S.HeightControlContainer location="top">
        <button
          onClick={() => {
            addRowAndUpdateRedux({ position: Position.TOP });
          }}
        >
          +
        </button>
        <button
          onClick={() => {
            deleteRowAndUpdateRedux({ position: Position.TOP });
          }}
        >
          -
        </button>
      </S.HeightControlContainer>

      <S.WidthControlContainer location="left">
        <button
          onClick={() => {
            addColumnAndUpdateRedux({ position: Position.LEFT });
          }}
        >
          +
        </button>
        <button
          onClick={() => {
            deleteColumnAndUpdateRedux({ position: Position.LEFT });
          }}
        >
          -
        </button>
      </S.WidthControlContainer>
      {children}
      <S.WidthControlContainer location="right">
        <button
          onClick={() => {
            addColumnAndUpdateRedux({ position: Position.RIGHT });
          }}
        >
          +
        </button>
        <button
          onClick={() => {
            deleteColumnAndUpdateRedux({ position: Position.RIGHT });
          }}
        >
          -
        </button>
      </S.WidthControlContainer>
      <S.HeightControlContainer location="bottom">
        <button
          onClick={() => {
            addRowAndUpdateRedux({ position: Position.BOTTOM });
          }}
        >
          +
        </button>
        <button
          onClick={() => {
            deleteRowAndUpdateRedux({ position: Position.BOTTOM });
          }}
        >
          -
        </button>
      </S.HeightControlContainer>
    </>
  );
};

export default SizeControl;
