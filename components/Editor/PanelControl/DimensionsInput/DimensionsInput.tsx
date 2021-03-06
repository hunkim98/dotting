import { Dispatch, SetStateAction } from "react";
import { PanelKeys } from "../../../../const/CommonDTO";
import * as S from "./styles";

interface Props {
  defaultWidth: number;
  defaultHeight: number;
  setCanvasSize: Dispatch<SetStateAction<{ width: number; height: number }>>;
}
const DimensionsInput: React.FC<Props> = ({
  defaultWidth,
  defaultHeight,
  setCanvasSize,
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
              setCanvasSize((size) => {
                return { ...size, width: Number(e.target.value) };
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
              setCanvasSize((size) => {
                return { ...size, height: Number(e.target.value) };
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
