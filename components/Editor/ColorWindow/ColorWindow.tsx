import { SetStateAction, useContext, useState } from "react";
import { changeBrushColor } from "../../../store/modules/brush";
import * as S from "./styles";
import Draggable, { DraggableData, DraggableEvent } from "react-draggable";
import { ChromePicker, ColorResult } from "react-color";
import { RootState } from "../../../store/modules";
import { useDispatch, useSelector } from "react-redux";
import { initializeSelectedGroup } from "../../../store/modules/selectedGroup";
import { modifyPixelById } from "../../../const/PixelFunctions";
import {
  pixelChangeActionType,
  pixelDataElement,
  update,
} from "../../../store/modules/pixelData";
import { setColorWindowPosition } from "../../../store/modules/draggableWindow";
import { changeGroupColor } from "../../../store/modules/colorGroupSlice";

interface Props {}

const ColorWindow: React.FC<Props> = ({}) => {
  const dispatch = useDispatch();
  const brushColor = useSelector((state: RootState) => state.brush.colorString);
  const selectedGroup = useSelector(
    (state: RootState) => state.selectedGroup.group
  );
  const selectedGroupName = useSelector(
    (state: RootState) => state.selectedGroup.groupName
  );
  const doc = useSelector((state: RootState) => state.docSlice.doc);
  const position = useSelector(
    (state: RootState) => state.draggableWindow.position
  );
  const onControlledDrag = (e: DraggableEvent, newPosition: DraggableData) => {
    const { x, y } = newPosition;
    dispatch(setColorWindowPosition({ x, y }));
  };

  const changeSelectedGroupColor = (
    color: ColorResult,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    event.stopPropagation();

    // const colorHexString = color.hex;
    const beforeData: pixelDataElement[] = [];
    const afterData: pixelDataElement[] = [];
    selectedGroup.map((element) => {
      const { previousColor, previousName } = modifyPixelById({
        rowIndex: element.rowIndex,
        columnIndex: element.columnIndex,
        color: color.hex,
        name: element.name,
      });
      doc?.update((root) => {
        root.dataArray[element.rowIndex][element.columnIndex].color = color.hex;
        root.dataArray[element.rowIndex][element.columnIndex].name =
          selectedGroupName;
      });
      beforeData.push({
        rowIndex: element.rowIndex,
        columnIndex: element.columnIndex,
        color: previousColor,
        name: previousName,
      });
      afterData.push({
        rowIndex: element.rowIndex,
        columnIndex: element.columnIndex,
        color: color.hex,
        name: element.name,
      });
    });
    if (selectedGroupName) {
      dispatch(changeGroupColor({ key: selectedGroupName, color: color.hex }));
    }
    dispatch(changeBrushColor({ brushColor: color.hex }));
    dispatch(
      update({
        action: {
          type: pixelChangeActionType.PIXEL_CHANGE,
          before: beforeData,
          after: afterData,
        },
      })
    );
  };

  return (
    <>
      {selectedGroup.length !== 0 && (
        <Draggable position={position} onDrag={onControlledDrag}>
          <S.Container>
            <S.Exit
              onClick={() => {
                dispatch(initializeSelectedGroup());
              }}
            >
              X
            </S.Exit>
            <S.Title>Change Color</S.Title>
            <ChromePicker
              styles={{
                default: {
                  picker: {
                    boxShadow: "rgba(0,0,0,0) 0px 0px 0px",
                    backgroundColor: "#cecece",
                  }, //this removes the shadow
                },
              }}
              color={brushColor}
              onChange={changeSelectedGroupColor}
              disableAlpha={true}
            />
          </S.Container>
        </Draggable>
      )}
    </>
  );
};

export default ColorWindow;
