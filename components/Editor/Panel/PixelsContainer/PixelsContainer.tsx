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
import ReactDOM, { render } from "react-dom";
import { Pixel2dRow } from "../Panel";
import { SizeControlProps } from "../SizeControl/SizeControlProps";
import { modifyPixelById } from "../../../../const/PixelFunctions";

interface Props extends SizeControlProps {
  panelRef: React.RefObject<HTMLDivElement>;
  pixel2dArray: Pixel2dRow[];
}

const PixelsContainer: React.FC<Props> = ({
  panelRef,
  pixel2dArray,
  addRow,
  addColumn,
  deleteColumn,
  deleteRow,
}) => {
  const dispatch = useDispatch();

  console.log("pixelContainer rendered");

  const actionRecord = useSelector(
    (state: RootState) => state.pixelData.actionRecord
  );

  useEffect(() => {
    console.log("record changed");
    if (actionRecord) {
      console.log(actionRecord.type in pixelDataRedux.pixelChangeActionType);
      if (actionRecord.type in pixelDataRedux.pixelChangeActionType) {
        if (
          actionRecord.type ===
          pixelDataRedux.pixelChangeActionType.PIXEL_CHANGE
        ) {
          const data = actionRecord.before;
          for (let i = 0; i < data.length; i++) {
            modifyPixelById({
              rowIndex: data[i].rowIndex,
              columnIndex: data[i].columnIndex,
              color: data[i].color,
              name: data[i].name,
            });
          }
          // modifyPixelById();
        }
      }
    }
    // if(typeof actionRecord === pixelDataRedux.laneChangeActionType)
  }, [actionRecord]);

  return (
    <div id="pixelsContainer" ref={panelRef}>
      {pixel2dArray.map((row) => {
        return (
          <div
            key={`row${row.rowIndex}`}
            id={`row${row.rowIndex}`}
            className="row"
          >
            {row.columns.map((element) => {
              return element.pixel;
            })}
          </div>
        );
      })}
    </div>
  );
};

export default PixelsContainer;
