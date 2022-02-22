import React, { useEffect, useState } from "react";
import {
  dataArrayElement,
  PanelKeys,
  PixelDTO,
  rowColumnColor,
} from "../../../../const/CommonDTO";
import { Pixel } from "../Pixel";
import * as S from "./styles";
import * as mouseEvent from "../../../../store/modules/mouseEvent";
import * as pixelDataRedux from "../../../../store/modules/pixelData";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../../store/modules";
import { pixelDataElement } from "../../../../store/modules/pixelData";

interface Props {
  panelRef: any;
  // setIsHistoryBranchCreated: React.Dispatch<React.SetStateAction<boolean>>;
  // finalRows: PixelDTO[][];
  // randomKey: number;
  // currentKeys: PanelKeys;
  // panelColor: dataArrayElement[];
}

const PixelsContainer: React.FC<Props> = ({
  panelRef,
  // setIsHistoryBranchCreated,
  // finalRows,
  // randomKey,
  // currentKeys,
  // panelColor,
}) => {
  const dispatch = useDispatch();
  const [pixelData, setPixelData] = useState<pixelDataElement[][]>([]);
  console.log("pixelContainer rendere");
  const record = useSelector((state: RootState) => state.pixelData.record);
  const [randomKey, setRandomKey] = useState<number>(Math.random());
  useEffect(() => {
    console.log("hiy");
    console.log(record);
    setPixelData(record);
    setRandomKey(Math.random());
  }, [record]);
  useEffect(() => {
    console.log("thithihihis", pixelData);
  }, [pixelData]);
  return (
    <div
      id="pixels"
      ref={panelRef}
      onMouseDown={() => {
        dispatch(mouseEvent.mouseClickOn());
      }}
      onMouseUp={() => {
        dispatch(mouseEvent.mouseClickOff());
        dispatch(pixelDataRedux.addToHistory());
      }}
      onMouseLeave={() => {
        dispatch(mouseEvent.mouseClickOff());
        dispatch(pixelDataRedux.addToHistory());
      }}
    >
      {pixelData.map((row, rowIndex) => {
        return (
          <S.Row key={rowIndex + randomKey} className="row">
            {row.map((column, columnIndex) => {
              return (
                <Pixel
                  key={columnIndex}
                  rowIndex={rowIndex}
                  columnIndex={columnIndex}
                  dataColor={pixelData[rowIndex][columnIndex].color}
                />
              );
            })}
          </S.Row>
          // <S.Row key={randomKey + currentKeys.T_key + Xindex} className="row">
          //   {X.map((Y: PixelDTO, Yindex: number) => {
          //     const color = panelColor.find((item: rowColumnColor) => {
          //       return (
          //         item.rowIndex === currentKeys.T_key + Xindex &&
          //         item.columnIndex === currentKeys.L_key + Yindex
          //       );
          //     }); //this checks if the index already exists
          //     return (
          //       <Pixel
          //         key={randomKey + currentKeys.L_key + Yindex}
          //         rowIndex={currentKeys.T_key + Xindex}
          //         columnIndex={currentKeys.L_key + Yindex}
          //         dataColor={color?.color}
          //       />
          //     );
          //   })}
          // </S.Row>
        );
      })}
    </div>
  );
};

export default PixelsContainer;
