import { SetStateAction } from "react";
import { useDispatch } from "react-redux";
import { Pixel2dPixel, Pixel2dRow, Position } from "../Panel";
import { Pixel } from "../Pixel";
import { SizeControlProps } from "./SizeControlProps";
import * as S from "./styles";
import * as pixelDataRedux from "../../../../store/modules/pixelData";

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

  const addRowAndUpdateRedux = ({
    position,
  }: {
    position: Position.TOP | Position.BOTTOM;
  }) => {
    addRow({ position: position, data: [] });
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
  };

  const addColumnAndUpdateRedux = ({
    position,
  }: {
    position: Position.LEFT | Position.RIGHT;
  }) => {
    addColumn({ position: position, data: [] });
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
  };

  const deleteRowAndUpdateRedux = ({
    position,
  }: {
    position: Position.TOP | Position.BOTTOM;
  }) => {
    const arrayIndex = Position.TOP ? 0 : pixel2dArray.length - 1;
    const rowIndexToDelete = pixel2dArray[arrayIndex].rowIndex;
    const rowDivToDelete = document.getElementById(`row${rowIndexToDelete}`);
    const beforeData: pixelDataRedux.pixelDataElement[] = [];
    const rowColumnsToDelete = pixel2dArray[arrayIndex].columns;
    if (rowDivToDelete) {
      for (let i = 0; i < rowColumnsToDelete.length; i++) {
        const columnElement: HTMLElement = rowDivToDelete.children[
          i
        ] as HTMLElement;
        beforeData.push({
          rowIndex: rowIndexToDelete,
          columnIndex: rowColumnsToDelete[i].columnIndex,
          name: columnElement.dataset.name,
          color: columnElement.style.backgroundColor,
        });
      }
    }
    deleteRow({ position: position }); //this setstates pixel2dArray, must happen after the above
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
    const arrayIndex =
      position === Position.LEFT ? 0 : pixel2dArray[0].columns.length - 1;
    const rowElements = document.getElementsByClassName("row");
    const columnIndexToDelete = pixel2dArray[0].columns[arrayIndex].columnIndex;
    const columnElements: HTMLElement[] = [];
    const beforeData: pixelDataRedux.pixelDataElement[] = [];
    if (rowElements) {
      for (let i = 0; i < rowElements.length; i++) {
        const columnElement = rowElements[i].children[
          arrayIndex
        ] as HTMLElement;
        beforeData.push({
          rowIndex: pixel2dArray[i].rowIndex,
          columnIndex: columnIndexToDelete,
          name: columnElement.dataset.name,
          color: columnElement.style.backgroundColor,
        });
        columnElements.push(rowElements[i].children[arrayIndex] as HTMLElement);
      }
    }
    deleteColumn({ position: position });
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
