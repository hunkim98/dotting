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
import { Pixel2dRow, Position } from "../Panel";
import { SizeControlProps } from "../SizeControl/SizeControlProps";
import { modifyPixelById } from "../../../../const/PixelFunctions";
import {
  activateClient,
  attachDoc,
  // createDocument,
  DottingDoc,
  // setClient,
  // setDoc,
} from "../../../../store/modules/docSlice";
import { Client, Document } from "yorkie-js-sdk";

interface Props extends SizeControlProps {
  panelRef: React.RefObject<HTMLDivElement>;
  pixel2dArray: Pixel2dRow[];
}

const INITIAL_ROW_COUNT = 32;
const INITIAL_COLUMN_COUNT = 32;

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
  const [doc, setDoc] = useState<Document<any>>();
  const [client, setClient] = useState<Client>();

  // useEffect(() => {
  //   dispatch(activateClient());
  // }, []);

  // useEffect(() => {
  //   dispatch(createDocument("first"));
  // });

  // useEffect(() => {
  //   async function attachDocAsync() {
  //     if (!client || !doc) {
  //       return;
  //     }
  //     await dispatch(attachDoc({ client, doc }));
  //   }
  //   attachDocAsync();
  // }, [client, doc]);

  useEffect(() => {
    const activate = async () => {
      const yorkie = await import("yorkie-js-sdk");
      const client = new yorkie.Client("http://localhost:8080");
      await client.activate();
      setClient(client);
      // dispatch(setClient(client));

      const doc = new yorkie.Document<any>("dotting");
      await client.attach(doc);
      setDoc(doc);
      // dispatch(setDoc(doc));

      doc.update((root: any) => {
        if (!root.dataArray) {
          const tempDataArray: pixelDataElement[][] = [];
          for (let i = 0; i < INITIAL_ROW_COUNT; i++) {
            const tempRow: pixelDataElement[] = [];
            for (let j = 0; j < INITIAL_COLUMN_COUNT; j++) {
              tempRow.push({
                name: undefined,
                color: undefined,
                rowIndex: i,
                columnIndex: j,
              });
            }
            tempDataArray.push(tempRow);
          }
          root.dataArray = tempDataArray;
          root.dataObjects = {};
          root.number = 0;
          root.oneDimension = [1];
        }
      });

      doc.subscribe((event) => {
        if (event.type === "local-change") {
          console.log("local evetn", event);
        } else if (event.type === "remote-change") {
          for (const changeInfo of event.value) {
            console.log(changeInfo.change);
            for (const path of changeInfo.paths) {
              if (path.startsWith(`$.dataArray`)) {
                //dataArray is change
                console.log(path);
              }
            }
          }
        }
      });
    };
    activate();
  }, []);

  useEffect(() => {
    console.log("record changed");
    if (actionRecord) {
      const data =
        actionRecord.action === "undo"
          ? actionRecord.before
          : actionRecord.after;
      if (actionRecord.type in pixelDataRedux.pixelChangeActionType) {
        switch (actionRecord.type) {
          case pixelDataRedux.pixelChangeActionType.PIXEL_CHANGE:
            console.log(data);
            for (let i = 0; i < data.length; i++) {
              modifyPixelById({
                rowIndex: data[i].rowIndex,
                columnIndex: data[i].columnIndex,
                color: data[i].color,
                name: data[i].name,
              });
            }
            break;
        }
      } else if (actionRecord.type in pixelDataRedux.laneChangeActionType) {
        switch (actionRecord.type) {
          case pixelDataRedux.laneChangeActionType.REMOVE_TOP_LANE:
            addRow({ position: Position.TOP, data: data });
            break;
          case pixelDataRedux.laneChangeActionType.REMOVE_BOTTOM_LANE:
            addRow({ position: Position.BOTTOM, data: data });
            break;
          case pixelDataRedux.laneChangeActionType.REMOVE_LEFT_LANE:
            addColumn({ position: Position.LEFT, data: data });
            break;
          case pixelDataRedux.laneChangeActionType.REMOVE_RIGHT_LANE:
            addColumn({ position: Position.RIGHT, data: data });
            break;
          case pixelDataRedux.laneChangeActionType.ADD_TOP_LANE:
            deleteRow({ position: Position.TOP });
            break;
          case pixelDataRedux.laneChangeActionType.ADD_BOTTOM_LANE:
            deleteRow({ position: Position.BOTTOM });
            break;
          case pixelDataRedux.laneChangeActionType.ADD_LEFT_LANE:
            deleteColumn({ position: Position.LEFT });
            break;
          case pixelDataRedux.laneChangeActionType.ADD_RIGHT_LANE:
            deleteColumn({ position: Position.RIGHT });
            break;
        }
      }
    }
    // if(typeof actionRecord === pixelDataRedux.laneChangeActionType)
  }, [actionRecord]);

  if (!doc || !client) {
    return null;
  }

  return (
    <>
      <button
        onClick={(e) => {
          console.log(doc.getRoot().dataArray);
          doc.update((root) => {
            let tempArray = [...root.dataArray];
            tempArray[0][0] = {
              name: String(Math.random()),
              color: "#000000",
              rowIndex: 0,
              columnIndex: Math.random(),
            };
            root.dataArray = tempArray;
          });
        }}
      >
        doc array update
      </button>
      <button
        onClick={(e) => {
          doc.update((root) => {
            root.dataObjects = {
              name: String(Math.random()),
              color: "#000000",
              rowIndex: 0,
              columnIndex: 0,
            };
            console.log(root.dataArray[0][0].columnIndex);
          });
        }}
      >
        doc array 2
      </button>
      <button
        onClick={(e) => {
          doc.update((root) => {
            root.number = Math.random();
          });
        }}
      >
        other update
      </button>
      <button
        onClick={(e) => {
          doc.update((root) => {
            root.oneDimension[0] = 2;
          });
        }}
      >
        one dimension
      </button>
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
