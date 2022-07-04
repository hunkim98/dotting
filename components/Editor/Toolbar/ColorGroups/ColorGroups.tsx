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
import rootReducer, { RootState } from "../../../../store/modules";
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
  const colorGroupRedux = useSelector(
    (state: RootState) => state.colorGroupSlice.data
  );

  const doc = useSelector((state: RootState) => state.docSlice.doc);
  const client = useSelector((state: RootState) => state.docSlice.client);

  // useEffect(() => {
  //   doc?.subscribe((event) => {
  //     if (event.value) {
  //       const tempPixelDataElements: pixelDataElement[] = [];
  //       const docRoot = doc.getRoot();
  //       const rowStartKey = Number(docRoot.laneKeys.rowStartKey);
  //       const rowLastKey = Number(docRoot.laneKeys.rowLastKey);
  //       const columnStartKey = Number(docRoot.laneKeys.columnStartKey);
  //       const columnLastKey = Number(docRoot.laneKeys.columnLastKey);
  //       for (let i = rowStartKey; i < rowLastKey + 1; i++) {
  //         for (let j = columnStartKey; j < columnLastKey + 1; j++) {
  //           const name = docRoot.dataArray[i][j].name;
  //           const color = docRoot.dataArray[i][j].color;
  //           console.log(rowStartKey, rowLastKey);
  //           if (name) {
  //             tempPixelDataElements.push({
  //               rowIndex: i,
  //               columnIndex: j,
  //               color: color,
  //               name: name,
  //             });
  //           }
  //         }
  //       }
  //       const colorGroupObject = groupBy(tempPixelDataElements, "name");
  //       const colorGroupNames = Object.keys(colorGroupObject);
  //       const colorGroup = colorGroupNames.map((element) => {
  //         const colorGroupElementsExcludeName: colorGroupElement[] = (
  //           colorGroupObject[element] as pixelDataElement[]
  //         ).map((pixelData) => {
  //           const { name, ...others } = pixelData;
  //           return others;
  //         });
  //         return {
  //           name: element,
  //           color: colorGroupElementsExcludeName[0].color,
  //           data: colorGroupElementsExcludeName,
  //         };
  //       });
  //       console.log(tempPixelDataElements);
  //       console.log(colorGroup);
  //       setColorGroups(colorGroup);
  //     }
  //   });
  // }, [doc, client]);

  // useEffect(() => {
  //   const tempPixelDataElements: pixelDataElement[] = [];
  //   const pixelRef = document.getElementById("pixelsContainer");
  //   if (pixelRef) {
  //     for (let i = 0; i < pixelRef.children.length; i++) {
  //       for (let j = 0; j < pixelRef.children[i].children.length; j++) {
  //         const pixelElement = pixelRef.children[i].children[j] as HTMLElement;
  //         const name = pixelElement.dataset.name;
  //         if (name) {
  //           const id = pixelElement.id;
  //           const color = pixelElement.style.backgroundColor;
  //           const { rowIndex, columnIndex } = decodePixelId(id);
  //           tempPixelDataElements.push({
  //             rowIndex,
  //             columnIndex,
  //             color,
  //             name,
  //           });
  //         }
  //       }
  //       const colorGroupObject = groupBy(tempPixelDataElements, "name");
  //       const colorGroupNames = Object.keys(colorGroupObject);
  //       const colorGroup = colorGroupNames.map((element) => {
  //         const colorGroupElementsExcludeName: colorGroupElement[] = (
  //           colorGroupObject[element] as pixelDataElement[]
  //         ).map((pixelData) => {
  //           const { name, ...others } = pixelData;
  //           return others;
  //         });
  //         return {
  //           name: element,
  //           color: colorGroupElementsExcludeName[0].color,
  //           data: colorGroupElementsExcludeName,
  //         };
  //       });
  //       setColorGroups(colorGroup);
  //     }
  //   }
  // }, [pixelDataTriggered]);

  if (!doc) {
    return null;
  }

  return (
    <S.Container>
      {Object.keys(colorGroupRedux).map((groupName, index) => {
        const elements = colorGroupRedux[groupName];
        return (
          <ScrollerElement
            groups={Object.keys(colorGroupRedux)}
            key={index}
            index={index}
            selectedGroupIndex={selectedGroupIndex}
            setSelectedGroupIndex={setSelectedGroupIndex}
            data={elements}
            name={groupName}
            color={elements[0].color}
            count={elements.length}
          />
        );
      })}
      {/* {colorGroups.map((group, groupIndex) => {
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
      })} */}
    </S.Container>
  );
};

export default ColorGroups;
