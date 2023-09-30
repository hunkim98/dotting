import { CreateEmptySquareData } from "../../../stories/utils/dataCreator";
import Editor from "../../components/Canvas/Editor";
import {
  InvalidDataDimensionsError,
  InvalidDataIndicesError,
  LayerNotFoundError,
  UnspecifiedLayerIdError,
} from "../../utils/error";

describe("test set data", () => {
  let editor: Editor;
  let canvasElement: HTMLCanvasElement;
  beforeEach(() => {
    const divElement = document.createElement("div");
    const interactionCanvas = divElement.appendChild(
      document.createElement("canvas"),
    );
    const gridCanvas = divElement.appendChild(document.createElement("canvas"));
    const dataCanvas = divElement.appendChild(document.createElement("canvas"));
    const backgroundCanvas = divElement.appendChild(
      document.createElement("canvas"),
    );
    const mockEditor = new Editor({
      gridCanvas,
      interactionCanvas,
      dataCanvas,
      backgroundCanvas,
    });
    divElement.tabIndex = 1;
    divElement.onmousedown = () => {
      divElement.focus();
    };
    divElement.addEventListener("keydown", (e: any) => {
      editor.onKeyDown(e);
    });

    mockEditor.setSize(800, 800);
    editor = mockEditor;
    // initialize the canvas with select tool selecting all the pixels
    canvasElement = editor.getCanvasElement();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("set data with correct data", () => {
    editor.setData(CreateEmptySquareData(15));
    expect(editor.getRowCount()).toBe(15);
    expect(editor.getColumnCount()).toBe(15);
  });

  it("set data when there are multiple layers", () => {
    const newLayers = [
      {
        id: "layer1",
        data: CreateEmptySquareData(15),
      },
      {
        id: "layer2",
        data: CreateEmptySquareData(15),
      },
    ];
    editor.setLayers(newLayers);
    try {
      editor.setData(CreateEmptySquareData(15));
    } catch (error) {
      expect(error).toBeInstanceOf(UnspecifiedLayerIdError);
    }
  });

  it("set data with wrong dimensions when there are other layers already", () => {
    const newLayers = [
      {
        id: "layer1",
        data: CreateEmptySquareData(15),
      },
      {
        id: "layer2",
        data: CreateEmptySquareData(15),
      },
    ];
    editor.setLayers(newLayers);
    try {
      editor.setData(CreateEmptySquareData(16), "layer2");
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidDataDimensionsError);
    }
  });

  it("set data with non existent layer id", () => {
    const newLayers = [
      {
        id: "layer1",
        data: CreateEmptySquareData(15),
      },
      {
        id: "layer2",
        data: CreateEmptySquareData(15),
      },
    ];
    editor.setLayers(newLayers);
    try {
      editor.setData(CreateEmptySquareData(15), "layer3");
    } catch (error) {
      expect(error).toBeInstanceOf(LayerNotFoundError);
    }
  });

  it("set data with wrong indices", () => {
    const newLayers = [
      {
        id: "layer1",
        data: [
          [
            {
              color: "red",
              rowIndex: 0,
              columnIndex: 0,
            },
            {
              color: "red",
              rowIndex: 0,
              columnIndex: 1,
            },
            {
              color: "red",
              rowIndex: 0,
              columnIndex: 2,
            },
          ],
          [
            {
              color: "red",
              rowIndex: 0,
              columnIndex: 0,
            },
            {
              color: "red",
              rowIndex: 0,
              columnIndex: 1,
            },
            {
              color: "red",
              rowIndex: 0,
              columnIndex: 2,
            },
          ],
        ],
      },
      {
        id: "layer2",
        data: [
          [
            {
              color: "red",
              rowIndex: 0,
              columnIndex: 0,
            },
            {
              color: "red",
              rowIndex: 0,
              columnIndex: 1,
            },
            {
              color: "red",
              rowIndex: 0,
              columnIndex: 2,
            },
          ],
          [
            {
              color: "red",
              rowIndex: 1,
              columnIndex: 0,
            },
            {
              color: "red",
              rowIndex: 1,
              columnIndex: 1,
            },
            {
              color: "red",
              rowIndex: 1,
              columnIndex: 2,
            },
          ],
        ],
      },
    ];
    editor.setLayers(newLayers);
    try {
      editor.setData(
        [
          [
            {
              color: "red",
              rowIndex: 1,
              columnIndex: 0,
            },
            {
              color: "red",
              rowIndex: 1,
              columnIndex: 1,
            },
            {
              color: "red",
              rowIndex: 1,
              columnIndex: 2,
            },
          ],
          [
            {
              color: "red",
              rowIndex: 2,
              columnIndex: 0,
            },
            {
              color: "red",
              rowIndex: 2,
              columnIndex: 1,
            },
            {
              color: "red",
              rowIndex: 2,
              columnIndex: 2,
            },
          ],
        ],
        "layer2",
      );
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidDataIndicesError);
    }
  });
});
