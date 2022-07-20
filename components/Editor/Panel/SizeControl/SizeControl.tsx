import { SetStateAction } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Pixel2dPixel, Pixel2dRow, Position } from "../Panel";
import { Pixel } from "../Pixel";
import { SizeControlProps } from "./SizeControlProps";
import * as S from "./styles";
import * as localHistoryRedux from "../../../../store/modules/localHistory";
import { RootState } from "../../../../store/modules";
import { decodePixelId } from "../../../../const/PixelFunctions";
import { removeFromGroup } from "../../../../store/modules/colorGroupSlice";
import {
  laneChangeActionType,
  pixelDataElement,
} from "../../../../store/modules/pixelData";
import {
  addColumnToDoc,
  addRowToDoc,
  deleteColumnFromDoc,
  deleteRowFromDoc,
} from "../../../../utils/doc.size.control";

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
    console.log(doc?.getRoot().laneKeys.rowStartKey, newRowIndex);
    const isNewRowValid =
      position === Position.TOP
        ? doc?.getRoot().laneKeys.rowStartKey > newRowIndex
        : doc?.getRoot().laneKeys.rowLastKey < newRowIndex;
    // console.log(doc?.getRoot().laneKeys.rowLastKey, newRowIndex);

    if (isNewRowValid) {
      //docUpdate
      addRowToDoc({ doc, laneIndex: newRowIndex, position });
      //change Panel
      addRow({ rowIndex: newRowIndex, position: position, data: [] });
      dispatch(
        localHistoryRedux.update({
          action: {
            type:
              position === Position.TOP
                ? laneChangeActionType.ADD_TOP_LANE
                : laneChangeActionType.ADD_BOTTOM_LANE,
            before: [],
            after: [],
            affectedLaneKey: newRowIndex,
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
      addColumnToDoc({ doc, laneIndex: newColumnIndex, position });
      //change applied locally to Panel.tsx
      addColumn({ columnIndex: newColumnIndex, position: position, data: [] });
      dispatch(
        localHistoryRedux.update({
          action: {
            type:
              position === Position.LEFT
                ? laneChangeActionType.ADD_LEFT_LANE
                : laneChangeActionType.ADD_RIGHT_LANE,
            before: [],
            after: [],
            affectedLaneKey: newColumnIndex,
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

    const beforeData: pixelDataElement[] = [];
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
    deleteRowFromDoc({ doc, laneIndex: rowIndexToDelete, position });

    //change applied to Panel.tsx
    dispatch(removeFromGroup({ rowIndex: rowIndexToDelete }));
    deleteRow({ rowIndex: rowIndexToDelete, position: position }); //this setstates pixel2dArray, must happen after the above
    dispatch(
      localHistoryRedux.update({
        action: {
          type:
            position === Position.TOP
              ? laneChangeActionType.REMOVE_TOP_LANE
              : laneChangeActionType.REMOVE_BOTTOM_LANE,
          before: beforeData,
          after: [],
          affectedLaneKey: rowIndexToDelete,
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

    const beforeData: pixelDataElement[] = [];
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
    deleteColumnFromDoc({ doc, laneIndex: columnIndexToDelete, position });

    //locally change Panel.tsx
    dispatch(removeFromGroup({ columnIndex: columnIndexToDelete }));
    deleteColumn({ columnIndex: columnIndexToDelete, position: position });
    dispatch(
      localHistoryRedux.update({
        action: {
          type:
            position === Position.LEFT
              ? laneChangeActionType.REMOVE_LEFT_LANE
              : laneChangeActionType.REMOVE_RIGHT_LANE,
          before: beforeData,
          after: [],
          affectedLaneKey: columnIndexToDelete,
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
