import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { PanelKeys, PixelDTO } from "../../../../const/CommonDTO";
import { RootState } from "../../../../store/modules";
import { pixelDataElement } from "../../../../store/modules/pixelData";
import { PixelBorder } from "../PixelBorder";
import * as S from "./styles";
interface Props {
  initialData: pixelDataElement[][];
}

const PixelBordersContainer: React.FC<Props> = ({ initialData }) => {
  const record = useSelector((state: RootState) => state.pixelData.record);
  const [pixelData, setPixelData] = useState<pixelDataElement[][]>([]);
  useEffect(() => {
    setPixelData(record);
  }, [record]);
  return (
    <S.Container>
      {initialData.map((row, rowIndex) => {
        return (
          <S.Row key={rowIndex}>
            {row.map((column, columnIndex) => {
              return <PixelBorder key={columnIndex} />;
            })}
          </S.Row>
        );
      })}
    </S.Container>
  );
};

export default PixelBordersContainer;
