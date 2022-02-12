import { useContext, useState } from "react";
import { dataArrayElement } from "../../../../const/CommonDTO";
import { ColorContext } from "../../../../context/ColorContext";
import { DataContext } from "../../../../context/DataContext";
import { MouseDragContext } from "../../../../context/MouseDragContext";
import * as S from "./styles";
import * as PixelStyle from "../pixelStyles";

interface Props {
  rowIndex: number;
  columnIndex: number;
  dataColor?: string;
}

const Pixel: React.FC<Props> = ({ rowIndex, columnIndex, dataColor }) => {
  const { dataArray, setDataArray } = useContext(DataContext);

  const [pixelColor, setPixelColor] = useState<string | undefined>(dataColor);
  const [oldColor, setOldColor] = useState(pixelColor);
  const [canChangeColor, setChangeColor] = useState(true);

  const { mouseDrag } = useContext(MouseDragContext);
  const { color } = useContext(ColorContext);

  function applyColor(): void {
    setPixelColor(color);
    setChangeColor(false);
    const existingPixel = dataArray.find((item: dataArrayElement) => {
      return item.rowIndex === rowIndex && item.columnIndex === columnIndex;
    }); //this checks if the index already exists
    if (existingPixel) {
      if (existingPixel.color !== color) {
        //save only when the color is not the previous one
        const newData = dataArray.map((item: dataArrayElement) => {
          if (item.rowIndex === rowIndex && item.columnIndex === columnIndex) {
            return {
              rowIndex: rowIndex,
              columnIndex: columnIndex,
              color: color,
              name: color,
            };
          } else {
            return item;
          }
        });
        setDataArray(newData);
      }
    } else {
      setDataArray([
        ...dataArray,
        { rowIndex, columnIndex, color, name: color },
      ]);
    }
  }
  function changeColorOnHover(): void {
    setOldColor(pixelColor);
    setPixelColor(color);
  }

  function reset(): void {
    if (canChangeColor) {
      setPixelColor(oldColor);
    }
    setChangeColor(true);
  }

  return (
    <PixelStyle.Container
      draggable="false"
      onMouseDown={applyColor}
      onMouseOver={mouseDrag ? applyColor : changeColorOnHover}
      onMouseLeave={reset}
      style={{ backgroundColor: pixelColor }}
    ></PixelStyle.Container>
  );
};

export default Pixel;
