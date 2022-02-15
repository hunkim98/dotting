import { ChromePicker, Color, ColorChangeHandler } from "react-color";
import * as S from "./styles";

interface Props {
  brushColor: string;
  color: Color | undefined;
  changeColor: ColorChangeHandler | undefined;
}

const ColorPicker: React.FC<Props> = ({ brushColor, color, changeColor }) => {
  return (
    <S.Container>
      <S.BrushContainer>
        <S.ToolName>Brush</S.ToolName>
        <S.BrushColor color={brushColor}></S.BrushColor>
      </S.BrushContainer>
      <ChromePicker
        styles={{
          default: {
            picker: {
              boxShadow: "rgba(0,0,0,0) 0px 0px 0px",
              backgroundColor: "#cecece",
            }, //this removes the shadow
          },
        }}
        color={color}
        onChange={changeColor}
        disableAlpha={true}
      />
    </S.Container>
  );
};

export default ColorPicker;
