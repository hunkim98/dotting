import { useState } from "react";
import {
  ChromePicker,
  Color,
  ColorChangeHandler,
  ColorResult,
} from "react-color";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../../store/modules";
import * as brush from "../../../../store/modules/brush";
import * as S from "./styles";

interface Props {}

const ColorPicker: React.FC<Props> = ({}) => {
  const brushColor = useSelector((state: RootState) => state.brush.colorString);
  const [tempColor, setTempColor] = useState(brushColor);
  const dispatch = useDispatch();
  const changeColor = (colorResult: ColorResult | string) => {
    if (typeof colorResult === "string") {
      setTempColor(colorResult);
    } else {
      setTempColor(colorResult.hex);
    }
  };

  const updateReduxBrushColor = (colorResult: ColorResult | string) => {
    if (typeof colorResult === "string") {
      dispatch(brush.changeBrushColor({ brushColor: colorResult }));
      setTempColor(colorResult);
    } else {
      dispatch(brush.changeBrushColor({ brushColor: colorResult.hex }));
      setTempColor(colorResult.hex);
    }
  };

  return (
    <S.Container>
      <S.BrushContainer>
        <S.ToolName>Brush</S.ToolName>
        <S.BrushColor color={brushColor}></S.BrushColor>
      </S.BrushContainer>
      <ChromePicker
        onChangeComplete={updateReduxBrushColor}
        styles={{
          default: {
            picker: {
              boxShadow: "rgba(0,0,0,0) 0px 0px 0px",
              backgroundColor: "#cecece",
            }, //this removes the shadow
          },
        }}
        color={tempColor}
        onChange={changeColor}
        disableAlpha={true}
      />
    </S.Container>
  );
};

export default ColorPicker;
