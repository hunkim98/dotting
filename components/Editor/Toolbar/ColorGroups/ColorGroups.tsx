import { SetStateAction, useContext, useEffect, useState } from "react";
import { ColorChangeHandler } from "react-color";
import { useDispatch, useSelector } from "react-redux";
import {
  colorGroup,
  colorGroupElement,
  dataArrayElement,
} from "../../../../const/CommonDTO";
import { decodePixelId } from "../../../../const/PixelFunctions";
import { groupBy } from "../../../../functions/groupBy";
import { RootState } from "../../../../store/modules";
import { pixelDataElement } from "../../../../store/modules/pixelData";
import { setSelectedGroup } from "../../../../store/modules/selectedGroup";
import { ScrollerElement } from "../ScrollerElement";
import * as S from "./styles";

interface Props {}

const ColorGroups: React.FC<Props> = ({}) => {
  const pixelDataTriggered = useSelector(
    (state: RootState) => state.pixelData.pixelDataTriggered
  );
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number>();
  const [colorGroups, setColorGroups] = useState<colorGroup[]>([]);

  useEffect(() => {
    const tempPixelDataElements: pixelDataElement[] = [];
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
            tempPixelDataElements.push({
              rowIndex,
              columnIndex,
              color,
              name,
            });
          }
        }
        const colorGroupObject = groupBy(tempPixelDataElements, "name");
        const colorGroupNames = Object.keys(colorGroupObject);
        const colorGroup = colorGroupNames.map((element) => {
          const colorGroupElementsExcludeName: colorGroupElement[] = (
            colorGroupObject[element] as pixelDataElement[]
          ).map((pixelData) => {
            const { name, ...others } = pixelData;
            return others;
          });
          return {
            name: element,
            color: colorGroupElementsExcludeName[0].color,
            data: colorGroupElementsExcludeName,
          };
        });
        setColorGroups(colorGroup);
      }
    }
  }, [pixelDataTriggered]);

  return (
    <S.Container>
      {colorGroups.map((group, groupIndex) => {
        return (
          <ScrollerElement
            groups={colorGroups}
            key={groupIndex}
            index={groupIndex}
            selectedGroupIndex={selectedGroupIndex}
            setSelectedGroupIndex={setSelectedGroupIndex}
            data={group.data}
            name={colorGroups[groupIndex].name}
            color={group.color}
            count={group.data.length}
          />
        );
      })}
    </S.Container>
  );
};

export default ColorGroups;
