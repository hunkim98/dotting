import { useCallback, useContext, useState } from "react";
import { dataArrayElement } from "../../../../const/CommonDTO";
import { ColorContext } from "../../../../context/ColorContext";
import { DataContext } from "../../../../context/DataContext";
import { MouseDragContext } from "../../../../context/MouseDragContext";
import * as S from "./styles";
import * as PixelStyle from "../pixelStyles";
import useMouseEvent from "../../../../store/modules/mouseEventHook";

interface Props {
  rowIndex: number;
  columnIndex: number;
  dataColor?: string;
}

const Pixel: React.FC<Props> = ({ rowIndex, columnIndex, dataColor }) => {
  const { dataArray, setDataArray } = useContext(DataContext);
  const [colorString, setColorString] = useState<string | undefined>(dataColor);

  const [pixelColor, setPixelColor] = useState<string | undefined>(dataColor);
  const [oldColor, setOldColor] = useState(pixelColor);
  const [canChangeColor, setCanChangeColor] = useState(true);

  const { isLeftClicked } = useMouseEvent();

  // const { mouseDrag } = useContext(MouseDragContext);
  const { color } = useContext(ColorContext);

  const applyColor = () => {
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
      style={{ backgroundColor: pixelColor }}
    ></S.Container>
  );
};

export default Pixel;
