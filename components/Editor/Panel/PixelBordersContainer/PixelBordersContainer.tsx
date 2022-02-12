import { PanelKeys, PixelDTO } from "../../../../const/CommonDTO";
import { PixelBorder } from "../PixelBorder";
import * as S from "./styles";
interface Props {
  finalRows: PixelDTO[][];
  randomKey: number;
  currentKeys: PanelKeys;
}

const PixelBordersContainer: React.FC<Props> = ({
  finalRows,
  randomKey,
  currentKeys,
}) => {
  return (
    <S.Container>
      {finalRows.map((X: PixelDTO[], Xindex: number) => {
        return (
          <S.Row key={randomKey + currentKeys.T_key + Xindex}>
            {X.map((Y: PixelDTO, Yindex: number) => {
              return (
                <PixelBorder key={randomKey + currentKeys.L_key + Yindex} />
              );
            })}
          </S.Row>
        );
      })}
    </S.Container>
  );
};

export default PixelBordersContainer;
