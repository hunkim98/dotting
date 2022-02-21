import { useCallback, useContext, useState } from "react";
import { dataArrayElement } from "../../../../const/CommonDTO";
import { ColorContext } from "../../../../context/ColorContext";
import { DataContext } from "../../../../context/DataContext";
import * as S from "./styles";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../../store/modules";
import * as pixelDataApi from "../../../../store/modules/pixelData";

interface Props {
  rowIndex: number;
  columnIndex: number;
  dataColor?: string;
}

const Pixel: React.FC<Props> = ({ rowIndex, columnIndex, dataColor }) => {
  const dispatch = useDispatch();
  const dispatch2 = useDispatch<{ type: "UNDO" }>();
  const [colorString, setColorString] = useState<string | undefined>(dataColor);

  const [pixelColor, setPixelColor] = useState<string | undefined>(dataColor);
  const [oldColor, setOldColor] = useState(pixelColor);
  const [canChangeColor, setCanChangeColor] = useState(true);

  const { isLeftClicked } = useSelector((state: RootState) => state.mouseEvent);
  // const { data } = useSelector((state: RootState) => state.pixelData);

  const { color } = useContext(ColorContext);

  const applyColor = () => {
    dispatch(
      pixelDataApi.update({
        rowIndex: rowIndex,
        columnIndex: columnIndex,
        color,
      })
    );

    setColorString(color);
  };

  // const applyColor = useCallback(() => {
  //   setPixelColor(color);
  //   setCanChangeColor(false);
  //   const existingPixel = dataArray.find((item: dataArrayElement) => {
  //     return item.rowIndex === rowIndex && item.columnIndex === columnIndex;
  //   }); //this checks if the index already exists
  //   if (existingPixel) {
  //     if (existingPixel.color !== color) {
  //       //save only when the color is not the previous one
  //       const newData = dataArray.map((item: dataArrayElement) => {
  //         if (item.rowIndex === rowIndex && item.columnIndex === columnIndex) {
  //           return {
  //             rowIndex: rowIndex,
  //             columnIndex: columnIndex,
  //             color: color,
  //             name: color,
  //           };
  //         } else {
  //           return item;
  //         }
  //       });
  //       setDataArray(newData);
  //     }
  //   } else {
  //     setDataArray([
  //       ...dataArray,
  //       { rowIndex, columnIndex, color, name: color },
  //     ]);
  //   }
  // }, [dataArray, color, rowIndex, columnIndex]);

  const changeColorOnHover = useCallback(() => {
    setOldColor(pixelColor);
    setPixelColor(color);
  }, [pixelColor, color]);

  const reset = useCallback(() => {
    if (canChangeColor) {
      setPixelColor(oldColor);
    }
    setCanChangeColor(true);
  }, [oldColor, canChangeColor]);

  return (
    <S.Container
      color={colorString}
      draggable="false"
      onMouseDown={applyColor}
      onMouseOver={isLeftClicked ? applyColor : changeColorOnHover}
      onMouseLeave={reset}
      // style={{ backgroundColor: data[rowIndex][columnIndex].color }}
    ></S.Container>
  );
};

export default Pixel;
