import { useContext, useState } from "react";
import { dataArrayElement } from "../../../../const/CommonDTO";
import { DataContext } from "../../../../context/DataContext";
import * as S from "./styles";
interface Props {
  name: string;
  color: string | undefined;
  count: number;
  setOpenChangePanel: React.Dispatch<React.SetStateAction<boolean>>;
  setOpenChangePanelKey: React.Dispatch<React.SetStateAction<string>>;
}

const ScrollerElement: React.FC<Props> = ({
  name,
  color,
  setOpenChangePanel,
  setOpenChangePanelKey,
  count,
}) => {
  const [groupName, setGroupName] = useState<string>(name);
  const {
    dataArray,
    setDataArray,
    history,
    historyIndex,
    setIsHistoryBranchCreated,
  } = useContext(DataContext);
  return (
    <S.Container>
      <S.Color
        color={color}
        onClick={() => {
          setOpenChangePanel(true);
          setOpenChangePanelKey(name);
        }}
      />
      <S.Name
        value={groupName}
        onChange={(e) => {
          setGroupName(e.target.value);
        }}
      />
      <S.Button
        onClick={(e) => {
          const temp = JSON.parse(JSON.stringify(dataArray));
          temp.map((X: dataArrayElement) => {
            if (X.name === name) {
              X.name = groupName;
            }
            return X;
          });
          setDataArray(temp);
          if (historyIndex < history.length) {
            setIsHistoryBranchCreated(false);
          }
        }}
      >
        OK
      </S.Button>
      <S.Count>{count}</S.Count>
    </S.Container>
  );
};

export default ScrollerElement;
