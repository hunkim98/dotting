import React from "react";
import {
  dataArrayElement,
  PanelKeys,
  PixelDTO,
  rowColumnColor,
} from "../../../../const/CommonDTO";
import { Pixel } from "../Pixel";
import * as S from "./styles";

interface Props {
  panelRef: any;
  setIsHistoryBranchCreated: React.Dispatch<React.SetStateAction<boolean>>;
  finalRows: PixelDTO[][];
  randomKey: number;
  currentKeys: PanelKeys;
  panelColor: dataArrayElement[];
}

const PixelsContainer: React.FC<Props> = ({
  panelRef,
  setIsHistoryBranchCreated,
  finalRows,
  randomKey,
  currentKeys,
  panelColor,
}) => {
  return (
    <div
      id="pixels"
      ref={panelRef}
      onMouseDown={() => {
        //user committed an action while looking through histories
        setIsHistoryBranchCreated(false);
      }}
    >
      {finalRows.map((X: PixelDTO[], Xindex: number) => {
        return (
          <S.Row key={randomKey + currentKeys.T_key + Xindex} className="row">
            {X.map((Y: PixelDTO, Yindex: number) => {
              const color = panelColor.find((item: rowColumnColor) => {
                return (
                  item.rowIndex === currentKeys.T_key + Xindex &&
                  item.columnIndex === currentKeys.L_key + Yindex
                );
              }); //this checks if the index already exists
              return (
                <Pixel
                  key={randomKey + currentKeys.L_key + Yindex}
                  rowIndex={currentKeys.T_key + Xindex}
                  columnIndex={currentKeys.L_key + Yindex}
                  dataColor={color?.color}
                />
              );
            })}
          </S.Row>
        );
      })}
    </div>
  );
};

export default PixelsContainer;
