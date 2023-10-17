import { CreateEmptySquareData } from "../../../stories/utils/dataCreator";
import Editor from "../../components/Canvas/Editor";
import {
  DuplicateLayerIdError,
  InvalidDataDimensionsError,
  InvalidDataIndicesError,
  InvalidSquareDataError,
} from "../../utils/error";

describe("test set layers", () => {
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
      width: 800,
      height: 800,
    });
    divElement.tabIndex = 1;
    divElement.onmousedown = () => {
      divElement.focus();
    };
    divElement.addEventListener("keydown", (e: any) => {
      editor.onKeyDown(e);
    });

    editor = mockEditor;
    // initialize the canvas with select tool selecting all the pixels
    canvasElement = editor.getCanvasElement();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("set layers with correct configuration", () => {
    const newLayers = [
      {
        id: "layer1",
        data: CreateEmptySquareData(15),
      },
      {
        id: "layer2",
        data: CreateEmptySquareData(15),
      },
      {
        id: "layer3",
        data: CreateEmptySquareData(15),
      },
    ];
    editor.setLayers(newLayers);
    const layers = editor.getLayersAsArray();
    expect(layers.length).toEqual(3);
    expect(layers[0].id).toEqual("layer1");
    expect(layers[0].data.length).toEqual(15);
    expect(layers[0].data[0].length).toEqual(15);
    expect(layers[1].id).toEqual("layer2");
    expect(layers[1].data.length).toEqual(15);
    expect(layers[1].data[0].length).toEqual(15);
    expect(layers[2].id).toEqual("layer3");
    expect(layers[2].data.length).toEqual(15);
    expect(layers[2].data[0].length).toEqual(15);
  });

  it("set layers with duplicate id", () => {
    const newLayers = [
      {
        id: "layer1",
        data: CreateEmptySquareData(15),
      },
      {
        id: "layer1",
        data: CreateEmptySquareData(15),
      },
      {
        id: "layer3",
        data: CreateEmptySquareData(15),
      },
    ];
    try {
      editor.setLayers(newLayers);
    } catch (error) {
      expect(error).toBeInstanceOf(DuplicateLayerIdError);
    }
  });

  it("set layers with different data dimensions", () => {
    const newLayers = [
      {
        id: "layer1",
        data: CreateEmptySquareData(15),
      },
      {
        id: "layer2",
        data: CreateEmptySquareData(20),
      },
      {
        id: "layer3",
        data: CreateEmptySquareData(15),
      },
    ];
    try {
      editor.setLayers(newLayers);
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidDataDimensionsError);
    }
  });

  it("set layers with wrong indices", () => {
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
      },
    ];
    try {
      editor.setLayers(newLayers);
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidDataIndicesError);
    }
  });

  it("set layers with wrong square data", () => {
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
      },
    ];
    try {
      editor.setLayers(newLayers);
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidSquareDataError);
    }
  });
});
