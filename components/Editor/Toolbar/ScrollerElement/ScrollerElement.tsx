import { useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  colorGroup,
  colorGroupElement,
  dataArrayElement,
} from "../../../../const/CommonDTO";
import { modifyPixelById } from "../../../../const/PixelFunctions";
import { RootState } from "../../../../store/modules";
import { changeBrushColor } from "../../../../store/modules/brush";
import {
  pixelChangeActionType,
  pixelDataElement,
  update,
} from "../../../../store/modules/pixelData";
import {
  initializeSelectedGroup,
  setSelectedGroup,
} from "../../../../store/modules/selectedGroup";
import * as S from "./styles";
interface Props {
  groups: colorGroup[];
  data: colorGroupElement[];
  name: string;
  color: string | undefined;
  count: number;
  index: number;
  selectedGroupIndex: number | undefined;
  setSelectedGroupIndex: React.Dispatch<
    React.SetStateAction<number | undefined>
  >;
}

const ScrollerElement: React.FC<Props> = ({
  groups,
  index,
  selectedGroupIndex,
  setSelectedGroupIndex,
  data,
  name,
  color,
  count,
}) => {
  const dispatch = useDispatch();
  const selectedGroup = useSelector(
    (state: RootState) => state.selectedGroup.group
  );
  const [groupName, setGroupName] = useState<string>(groups[index].name);
  const onGroupClick = (groupElements: pixelDataElement[]) => {
    dispatch(setSelectedGroup({ data: groupElements }));
  };

  return (
    <S.Container
      onClick={() => {
        setSelectedGroupIndex(index);
        setGroupName(groups[index].name);
        dispatch(changeBrushColor({ brushColor: color! }));
        onGroupClick(
          data.map((element) => {
            return { ...element, name: name };
          })
        );
      }}
      selected={selectedGroup.length !== 0 && selectedGroupIndex === index}
    >
      <S.Color color={color} />
      {selectedGroup.length === 0 || selectedGroupIndex !== index ? (
        <S.Name>{groups[index].name}</S.Name>
      ) : (
        <S.Input
          value={groupName}
          onChange={(e) => {
            setGroupName(e.target.value);
          }}
        />
      )}
      <S.Button
        onClick={(e) => {
          e.stopPropagation();
          const beforeData: pixelDataElement[] = [];
          const afterData: pixelDataElement[] = [];
          selectedGroup.map((element) => {
            const { previousColor, previousName } = modifyPixelById({
              rowIndex: element.rowIndex,
              columnIndex: element.columnIndex,
              color: element.color,
              name: groupName,
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
              color: previousColor,
              name: groupName,
            });
          });
          dispatch(initializeSelectedGroup());
          dispatch(
            update({
              action: {
                type: pixelChangeActionType.PIXEL_CHANGE,
                before: beforeData,
                after: afterData,
              },
            })
          );
        }}
      >
        OK
      </S.Button>
      <S.Count>{count}</S.Count>
    </S.Container>
  );
};

export default ScrollerElement;
