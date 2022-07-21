import React, { useEffect, useState } from "react";
import {
  dataArrayElement,
  PanelKeys,
  PixelDTO,
  rowColumnColor,
} from "../../../../const/CommonDTO";
import { Pixel } from "../Pixel";
import * as S from "./styles";
import * as localHistoryRedux from "../../../../store/modules/localHistory";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../../store/modules";
import {
  laneChangeActionType,
  pixelChangeActionType,
  pixelDataElement,
} from "../../../../store/modules/pixelData";
import ReactDOM, { render } from "react-dom";
import { Pixel2dRow, Position } from "../Panel";
import { SizeControlProps } from "../SizeControl/SizeControlProps";
import { modifyPixelById } from "../../../../const/PixelFunctions";
import { Client, Document } from "yorkie-js-sdk";
import {
  appendToGroup,
  applyChangeToGroup,
  removeFromGroup,
} from "../../../../store/modules/colorGroupSlice";
import {
  addColumnToDoc,
  addRowToDoc,
  deleteColumnFromDoc,
  deleteRowFromDoc,
} from "../../../../utils/doc.size.control";

interface Props extends SizeControlProps {
  panelRef: React.RefObject<HTMLDivElement>;
  pixel2dArray: Pixel2dRow[];
  client: Client;
  doc: Document<any>;
}

const PixelsContainer: React.FC<Props> = ({
  panelRef,
  pixel2dArray,
  addRow,
  addColumn,
  deleteColumn,
  deleteRow,
  doc,
  client,
}) => {
  const dispatch = useDispatch();

  console.log("pixelContainer rendered");

  const actionRecord = useSelector(
    (state: RootState) => state.localHistorySlice.actionRecord
  );

  useEffect(() => {
    console.log("record changed");
    //actionRecord is local history
    if (actionRecord) {
      if (actionRecord.isPolluted) {
        alert(
          "Somebody has overriden your past actions. Cannot perform undo/redo"
        );
        dispatch(localHistoryRedux.initialize());
      } else {
        if (actionRecord.type in pixelChangeActionType) {
          for (let i = 0; i < actionRecord.target.length; i++) {
            const { rowIndex, columnIndex, color, name } =
              actionRecord.target[i];
            modifyPixelById({
              rowIndex,
              columnIndex,
              color,
              name,
            });
            dispatch(applyChangeToGroup({ data: [actionRecord.target[i]] }));
            // if (name) {
            //   dispatch(
            //     appendToGroup({
            //       key: name,
            //       data: [{ rowIndex, columnIndex, color, name }],
            //     })
            //   );
            // } else {
            //   dispatch(removeFromGroup({ rowIndex, columnIndex }));
            // }
            doc?.update((root) => {
              root.dataArray[rowIndex][columnIndex].color = color;
              root.dataArray[rowIndex][columnIndex].name = name;
            });
          }
        } else if (actionRecord.type in laneChangeActionType) {
          console.log("lane change", actionRecord.type);
          const laneKey = actionRecord.affectedLaneKey!;
          switch (actionRecord.type) {
            case laneChangeActionType.REMOVE_TOP_LANE:
              dispatch(removeFromGroup({ rowIndex: laneKey }));
              deleteRow({
                position: Position.TOP,
                rowIndex: laneKey,
              });
              deleteRowFromDoc({
                doc,
                laneIndex: laneKey,
                position: Position.TOP,
              });

              break;
            case laneChangeActionType.ADD_TOP_LANE:
              dispatch(applyChangeToGroup({ data: actionRecord.target }));
              addRow({
                position: Position.TOP,
                rowIndex: laneKey,
                data: actionRecord.target,
              });
              addRowToDoc({
                doc,
                laneIndex: laneKey,
                position: Position.TOP,
                data: actionRecord.target,
              });

              break;
            case laneChangeActionType.REMOVE_LEFT_LANE:
              dispatch(removeFromGroup({ columnIndex: laneKey }));
              deleteColumn({ position: Position.LEFT, columnIndex: laneKey });
              deleteColumnFromDoc({
                doc,
                laneIndex: laneKey,
                position: Position.LEFT,
              });
              break;
            case laneChangeActionType.ADD_LEFT_LANE:
              dispatch(applyChangeToGroup({ data: actionRecord.target }));
              addColumn({
                position: Position.LEFT,
                columnIndex: laneKey,
                data: actionRecord.target,
              });
              addColumnToDoc({
                doc,
                position: Position.LEFT,
                laneIndex: laneKey,
                data: actionRecord.target,
              });
              break;
            case laneChangeActionType.REMOVE_BOTTOM_LANE:
              dispatch(removeFromGroup({ rowIndex: laneKey }));
              deleteRow({ position: Position.BOTTOM, rowIndex: laneKey });
              deleteColumnFromDoc({
                doc,
                position: Position.BOTTOM,
                laneIndex: laneKey,
              });
              break;
            case laneChangeActionType.ADD_BOTTOM_LANE:
              dispatch(applyChangeToGroup({ data: actionRecord.target }));
              addRow({
                position: Position.BOTTOM,
                rowIndex: laneKey,
                data: actionRecord.target,
              });
              addRowToDoc({
                doc,
                position: Position.BOTTOM,
                laneIndex: laneKey,
                data: actionRecord.target,
              });
              break;
            case laneChangeActionType.REMOVE_RIGHT_LANE:
              dispatch(removeFromGroup({ columnIndex: laneKey }));
              deleteColumn({ position: Position.RIGHT, columnIndex: laneKey });
              deleteColumnFromDoc({
                doc,
                position: Position.RIGHT,
                laneIndex: laneKey,
              });
              break;
            case laneChangeActionType.ADD_RIGHT_LANE:
              dispatch(applyChangeToGroup({ data: actionRecord.target }));
              addColumn({
                position: Position.RIGHT,
                columnIndex: laneKey,
                data: actionRecord.target,
              });
              addColumnToDoc({
                doc,
                position: Position.RIGHT,
                laneIndex: laneKey,
                data: actionRecord.target,
              });
              break;
          }
        }
      }
    }
    // if(typeof actionRecord === pixelDataRedux.laneChangeActionType)
  }, [actionRecord, doc]);

  return (
    <>
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
    </>
  );
};

export default PixelsContainer;
