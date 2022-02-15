import { SetStateAction, useContext } from "react";
import { ColorChangeHandler } from "react-color";
import { colorGroup, dataArrayElement } from "../../../../const/CommonDTO";
import { ColorContext } from "../../../../context/ColorContext";
import { groupBy } from "../../../../functions/groupBy";
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
      {Object.keys(groupBy(dataArray, "name")).map(
        (keyName: string, i: number) => {
          const keyColor = dataArray.find((X) => {
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
                count={groupBy(dataArray, "name")[keyName].length}
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
