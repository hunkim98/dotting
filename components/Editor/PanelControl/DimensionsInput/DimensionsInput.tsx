import { Dispatch, SetStateAction } from "react";
import { PanelKeys } from "../../../../const/CommonDTO";
import * as S from "./styles";

interface Props {
  defaultWidth: number;
  defaultHeight: number;
  resetKeys: PanelKeys;
  setResetKeys: Dispatch<SetStateAction<PanelKeys>>;
}
const DimensionsInput: React.FC<Props> = ({
  defaultWidth,
  defaultHeight,
  resetKeys,
  setResetKeys,
}) => {
  return (
    <>
      <h2>Enter Panel Dimensions</h2>
      <S.OptionContainer>
        <S.Option>
          <S.OptionInput
            type="number"
            defaultValue={defaultWidth}
            onChange={(e) => {
              setResetKeys({
                ...resetKeys,
                R_key: Number(e.target.value) - 1,
              });
            }}
          />
          <span>Width</span>
        </S.Option>
        <S.Option>
          <S.OptionInput
            type="number"
            defaultValue={defaultHeight}
            onChange={(e) => {
              setResetKeys({
                ...resetKeys,
                B_key: Number(e.target.value) - 1,
              });
            }}
          />
          <span>Height</span>
        </S.Option>
      </S.OptionContainer>
    </>
  );
};

export default DimensionsInput;
