import { Client, Document } from "yorkie-js-sdk";
import { Position } from "../components/Editor/Panel/Panel";
import { pixelDataElement } from "../store/modules/pixelData";

export type ModifyDocLaneParams = {
  doc: Document<any> | undefined;
  laneIndex: number;
  position: Position;
  data?: pixelDataElement[];
};

export const addRowToDoc = ({
  doc,
  laneIndex,
  position,
  data,
}: ModifyDocLaneParams) => {
  doc?.update((root) => {
    if (position === Position.TOP) {
      root.laneKeys.rowStartKey--;
    } else {
      root.laneKeys.rowLastKey++;
    }
    root.dataArray[laneIndex] = {};
    let arrayIndex = 0;
    for (
      let i = root.laneKeys.columnStartKey;
      i < root.laneKeys.columnLastKey + 1;
      i++
    ) {
      root.dataArray[laneIndex][i] = {};
      root.dataArray[laneIndex][i].name = data
        ? data[arrayIndex].name
        : undefined;
      root.dataArray[laneIndex][i].color = data
        ? data[arrayIndex].color
        : undefined;
      arrayIndex++;
    }
  });
};

export const addColumnToDoc = ({
  doc,
  laneIndex,
  position,
  data,
}: ModifyDocLaneParams) => {
  doc?.update((root) => {
    if (position === Position.LEFT) {
      root.laneKeys.columnStartKey--;
    } else {
      root.laneKeys.columnLastKey++;
    }
    const rowStartKey = root.laneKeys.rowStartKey;
    const rowLastKey = root.laneKeys.rowLastKey;
    let arrayIndex = 0;
    for (let i = rowStartKey; i < rowLastKey + 1; i++) {
      root.dataArray[i][laneIndex] = {};
      root.dataArray[i][laneIndex].name = data
        ? data[arrayIndex].name
        : undefined;
      root.dataArray[i][laneIndex].color = data
        ? data[arrayIndex].color
        : undefined;
      arrayIndex++;
    }
  });
};

export const deleteRowFromDoc = ({
  doc,
  laneIndex,
  position,
  data,
}: ModifyDocLaneParams) => {
  doc?.update((root) => {
    if (position === Position.TOP) {
      root.laneKeys.rowStartKey++;
    } else {
      root.laneKeys.rowLastKey--;
    }
    const columnStartKey = root.laneKeys.columnStartKey;
    const columnLastkey = root.laneKeys.columnLastKey;
    for (let i = columnStartKey; i < columnLastkey + 1; i++) {
      root.dataArray[laneIndex][i].color = undefined;
      root.dataArray[laneIndex][i].name = undefined;
    }
  });
};

export const deleteColumnFromDoc = ({
  doc,
  laneIndex,
  position,
  data,
}: ModifyDocLaneParams) => {
  //doc update
  doc?.update((root) => {
    if (position === Position.LEFT) {
      root.laneKeys.columnStartKey++;
    } else {
      root.laneKeys.columnLastKey--;
    }
    const rowStartKey = root.laneKeys.rowStartKey;
    const rowLastKey = root.laneKeys.rowLastKey;
    for (let i = rowStartKey; i < rowLastKey + 1; i++) {
      delete root.dataArray[i][laneIndex];
    }
  });
};
