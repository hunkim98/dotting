import { SetStateAction, useContext, useState } from "react";
import { changeBrushColor } from "../../../store/modules/brush";
import * as S from "./styles";
import Draggable, { DraggableData, DraggableEvent } from "react-draggable";
import { DraggableContext } from "../../../context/DraggableContext";
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

interface Props {}

const ColorWindow: React.FC<Props> = ({}) => {
  console.log("colorwindowcolorwindow");
  const dispatch = useDispatch();
  const brushColor = useSelector((state: RootState) => state.brush.colorString);
  const selectedGroup = useSelector(
    (state: RootState) => state.selectedGroup.group
  );
  const [tempColor, setTempColor] = useState(brushColor);
  const { position, setPosition } = useContext(DraggableContext);
  const [currentColor, setCurrentColor] = useState<string>(brushColor);
  const onControlledDrag = (e: DraggableEvent, position: DraggableData) => {
    const { x, y } = position;
    setPosition({ x, y });
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
