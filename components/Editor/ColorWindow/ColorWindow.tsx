import { SetStateAction, useContext, useState } from "react";
import { colorGroup } from "../../../const/CommonDTO";
import * as S from "./styles";
import Draggable, { DraggableData, DraggableEvent } from "react-draggable";
import { DraggableContext } from "../../../context/DraggableContext";
import { ChromePicker, ColorResult } from "react-color";
import { DataContext } from "../../../context/DataContext";
interface Props {
  selectedGroup: colorGroup | undefined;
  setOpenChangePanel: React.Dispatch<SetStateAction<boolean>>;
  initialColor: string;
}

const ColorWindow: React.FC<Props> = ({
  selectedGroup,
  setOpenChangePanel,
  initialColor,
}) => {
  const { setDataArray, setIsHistoryBranchCreated, history, historyIndex } =
    useContext(DataContext);
  const { position, setPosition } = useContext(DraggableContext);
  const [currentColor, setCurrentColor] = useState<string>(initialColor);
  const onControlledDrag = (e: DraggableEvent, position: DraggableData) => {
    const { x, y } = position;
    setPosition({ x, y });
  };
  const changeDataArray = (
    color: ColorResult,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    event.stopPropagation();
    const colorHexString = color.hex;
    setCurrentColor(colorHexString);
    console.log(color);
    if (selectedGroup) {
      console.log("changed color of dataArray");
      setDataArray((array) =>
        array.filter((element) => {
          if (element.name === selectedGroup.name) {
            element.color = colorHexString;
            return element;
          }
          return element;
        })
      );
      if (historyIndex < history.length) {
        setIsHistoryBranchCreated(false);
      }
    }
  };
  return (
    <Draggable position={position} onDrag={onControlledDrag}>
      <S.Container>
        <S.Exit
          onClick={() => {
            setOpenChangePanel(false);
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
          color={currentColor}
          onChange={changeDataArray}
          disableAlpha={true}
        />
      </S.Container>
    </Draggable>
  );
};

export default ColorWindow;
