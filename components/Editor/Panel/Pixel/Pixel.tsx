import { useCallback, useContext, useEffect, useState } from "react";
import { dataArrayElement } from "../../../../const/CommonDTO";
import { ColorContext } from "../../../../context/ColorContext";
import { DataContext } from "../../../../context/DataContext";
import * as mouseEvent from "../../../../store/modules/mouseEvent";
import * as S from "./styles";
import { connect, Provider, useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../../store/modules";
import * as pixelDataRedux from "../../../../store/modules/pixelData";
import { modifyPixelById } from "../../../../const/PixelFunctions";
import React, { MouseEvent } from "react";
import { store } from "../../../../store/configureStore";
import ReactDOM from "react-dom";

type OwnProps = {
  id: string;
  rowIndex: number;
  columnIndex: number;
  dataColor?: string;
};

type Props = OwnProps; //OwnProps & OtherProps

const Pixel: React.FC<Props> = ({ rowIndex, columnIndex, dataColor, id }) => {
  const isLeftClicked = useSelector(
    (state: RootState) => state.mouseEvent.isLeftClicked
  );
  const dispatch = useDispatch();
  const [pixelColor, setPixelColor] = useState<string | undefined>(dataColor);
  const [oldColor, setOldColor] = useState(pixelColor);

  // const { data } = useSelector((state: RootState) => state.pixelData);

  const { color } = useContext(ColorContext);

  const applyColor =
    // useCallback(
    () => {
      console.log(rowIndex, columnIndex);
      modifyPixelById(rowIndex, columnIndex, color, color);
      // dispatch(
      //   pixelDataRedux.update({
      //     rowIndex: rowIndex,
      //     columnIndex: columnIndex,
      //     color,
      //   })
      // );
    };
  const onMouseDownHandler: React.MouseEventHandler<HTMLDivElement> = (
    event: MouseEvent
  ) => {
    if (event.buttons === 1) {
      applyColor();
      dispatch(mouseEvent.mouseClickOn());
    }
  };

  const onMouseOverHandler: React.MouseEventHandler<HTMLDivElement> = (
    event: MouseEvent
  ) => {
    if (event.buttons === 1) {
      applyColor();
    } else {
      changeColorOnHover();
    }
  };

  const onMouseLeaveHandler: React.MouseEventHandler<HTMLDivElement> = (
    event: MouseEvent
  ) => {
    reset();
  };
  // , [rowIndex, columnIndex, color]);

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

  const changeColorOnHover = () => {
    setOldColor(pixelColor);
    setPixelColor(color);
  };

  const reset = useCallback(() => {
    setPixelColor(oldColor);
    // if (canChangeColor) {
    //   setPixelColor(oldColor);
    // }
    // setCanChangeColor(true);
  }, [oldColor]);

  return (
    <S.Container
      id={id}
      className="pixel"
      color={pixelColor}
      draggable="false"
      onMouseDown={onMouseDownHandler}
      onMouseOver={onMouseOverHandler}
      onMouseLeave={onMouseLeaveHandler}
      onMouseUp={() => {
        dispatch(mouseEvent.mouseClickOff());
      }}
      onPointerDown={(e) => {
        if (e.pressure > 0) {
        }
      }}
      // onPointerOver={}
      // onPointerLeave={}
      // style={{ backgroundColor: data[rowIndex][columnIndex].color }}
    ></S.Container>
  );
};

// function mapStateToProps(state: RootState) {
//   return {
//     isLeftClicked: state.mouseEvent.isLeftClicked,
//   };
// }

export default Pixel;
