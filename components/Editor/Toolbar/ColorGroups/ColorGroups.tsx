import { SetStateAction, useContext, useEffect, useState } from "react";
import { ColorChangeHandler } from "react-color";
import { useSelector } from "react-redux";
import { colorGroup, dataArrayElement } from "../../../../const/CommonDTO";
import { decodePixelId } from "../../../../const/PixelFunctions";
import { ColorContext } from "../../../../context/ColorContext";
import { groupBy } from "../../../../functions/groupBy";
import { RootState } from "../../../../store/modules";
import { pixelDataElement } from "../../../../store/modules/pixelData";
import { ScrollerElement } from "../ScrollerElement";
import * as S from "./styles";

interface Props {
  dataArray: dataArrayElement[];
  selectedGroup: colorGroup | undefined;
  setSelectedGroup: React.Dispatch<SetStateAction<colorGroup | undefined>>;
  openChangePanel: boolean;
  setOpenChangePanel: React.Dispatch<SetStateAction<boolean>>;
  setOpenChangePanelKey: React.Dispatch<React.SetStateAction<string>>;
  changeColor: ColorChangeHandler | undefined;
}

const ColorGroups: React.FC<Props> = ({
  dataArray,
  selectedGroup,
  setSelectedGroup,
  openChangePanel,
  setOpenChangePanel,
  setOpenChangePanelKey,
}) => {
  const pixelDataTriggered = useSelector(
    (state: RootState) => state.pixelData.pixelDataTriggered
  );
  const [colorGroupElements, setColorGroupElements] = useState<
    pixelDataElement[]
  >([]);
  useEffect(() => {
    const tempColorGroupElements: pixelDataElement[] = [];
    const pixelRef = document.getElementById("pixelsContainer");
    if (pixelRef) {
      for (let i = 0; i < pixelRef.children.length; i++) {
        for (let j = 0; j < pixelRef.children[i].children.length; j++) {
          const pixelElement = pixelRef.children[i].children[j] as HTMLElement;
          const name = pixelElement.dataset.name;
          if (name) {
            const id = pixelElement.id;
            const color = pixelElement.style.backgroundColor;
            const { rowIndex, columnIndex } = decodePixelId(id);
            tempColorGroupElements.push({
              rowIndex,
              columnIndex,
              color,
              name,
            });
          }
        }
      }
    }
    setColorGroupElements(tempColorGroupElements);
  }, [pixelDataTriggered]);
  const { color, changeColor } = useContext(ColorContext);
  const groupOnClick = (
    index: number,
    name: string,
    color: string | undefined
  ) => {
    setSelectedGroup({
      index,
      name,
      color,
    });
    setOpenChangePanel(true);
    changeColor(color);
  };
  return (
    <S.Container>
      {Object.keys(groupBy(colorGroupElements, "name")).map(
        (keyName: string, i: number) => {
          const keyColor = colorGroupElements.find((X) => {
            return X.name === keyName;
          })?.color;
          return (
            <S.ScrollerContainer
              index={i}
              selectedGroup={selectedGroup}
              openChangePanel={openChangePanel}
              key={keyName}
              onClick={() => {
                groupOnClick(i, keyName, keyColor);
              }}
            >
              <ScrollerElement
                name={keyName}
                color={keyColor}
                count={groupBy(colorGroupElements, "name")[keyName].length}
                setOpenChangePanel={setOpenChangePanel}
                setOpenChangePanelKey={setOpenChangePanelKey}
              />
            </S.ScrollerContainer>
          );
        }
      )}
    </S.Container>
  );
};

export default ColorGroups;
