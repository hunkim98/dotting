import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Client, Document } from "yorkie-js-sdk";
import { pixelDataElement } from "./pixelData";

export type DottingDoc = {
  dataArray: pixelDataElement[][];
};

export interface DocState {
  client?: Client;
  doc?: Document<any>;
}

type ActivateClientResult = { client: Client; doc: Document<DottingDoc> };
type AttachDocArgs = { doc: Document<DottingDoc>; client: Client };
type AttachDocResult = { doc: Document<DottingDoc>; client: Client };

const INITIAL_ROW_COUNT = 32;
const INITIAL_COLUMN_COUNT = 32;

const initialState: DocState = {};

export const activateClient = createAsyncThunk<
  ActivateClientResult,
  undefined,
  { rejectValue: string }
>("doc/activate", async (_: undefined, thunkApi) => {
  try {
    const yorkie = await import("yorkie-js-sdk");
    const client = new yorkie.Client(`http://localhost:8080`);

    await client.activate();
    const doc = new yorkie.Document<DottingDoc>(`dotting`);
    await client.attach(doc);
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
      }
    });
    return { client, doc };
  } catch (err) {
    return thunkApi.rejectWithValue("error in activating client");
  }
});

export const attachDoc = createAsyncThunk<
  AttachDocResult,
  AttachDocArgs,
  { rejectValue: string }
>("doc/attach", async ({ client, doc }, thunkApi) => {
  try {
    await client.attach(doc);
    doc.update((root: any) => {
      // if (!root.dataArray) {
      //   const tempDataArray: pixelDataElement[][] = [];
      //   for (let i = 0; i < INITIAL_ROW_COUNT; i++) {
      //     const tempRow: pixelDataElement[] = [];
      //     for (let j = 0; j < INITIAL_COLUMN_COUNT; j++) {
      //       tempRow.push({
      //         name: undefined,
      //         color: undefined,
      //         rowIndex: i,
      //         columnIndex: j,
      //       });
      //     }
      //     tempDataArray.push(tempRow);
      //   }
      //   root.dataArray = tempDataArray;
      // }
    });
    await client.sync();
    return { doc, client };
  } catch (err) {
    return thunkApi.rejectWithValue("error in attaching document");
  }
});

const docSlice = createSlice({
  name: "docSlice",
  initialState,
  reducers: {
    setReduxDoc(state, action: PayloadAction<Document<any>>) {
      state.doc = action.payload;
    },
    setReduxClient(state, action: PayloadAction<any>) {
      state.client = action.payload;
    },
  },
});

const { reducer, actions } = docSlice;
export const { setReduxDoc, setReduxClient } = actions;
export default reducer;
