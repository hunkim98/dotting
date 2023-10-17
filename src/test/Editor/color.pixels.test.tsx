import Editor from "../../components/Canvas/Editor";

describe("test for color pixel method in Editor", () => {
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

  it("test color pixel for a single item", () => {
    const rowIndex = 0;
    const columnIndex = 0;
    const color = "red";

    editor.colorPixels([{ rowIndex, columnIndex, color }]);

    const targetColor =
      editor.getLayersAsArray()[0].data[rowIndex][columnIndex].color;

    expect(targetColor).toBe(color);
  });

  it("test color pixel for multiple items", () => {
    const itemsToColor = [
      {
        rowIndex: 0,
        columnIndex: 0,
        color: "red",
      },
      {
        rowIndex: 1,
        columnIndex: 1,
        color: "black",
      },
    ];

    editor.colorPixels(itemsToColor);

    for (const item of itemsToColor) {
      const targetColor =
        editor.getLayersAsArray()[0].data[item.rowIndex][item.columnIndex]
          .color;
      expect(targetColor).toBe(item.color);
    }
  });

  it("test color pixel for an item that has a rowIndex smaller than topRowIndex", () => {
    const rowIndex = -5;
    const columnIndex = 0;
    const color = "red";

    editor.colorPixels([{ rowIndex, columnIndex, color }]);

    const targetColor =
      editor.getLayersAsArray()[0].data[editor.getRowCount() - 1][columnIndex]
        .color;
    expect(targetColor).toBe(color);
  });

  it("test color pixel for an item that has a rowIndex bigger than bottomRowIndex", () => {
    const rowIndex = editor.getRowCount() + 5;
    const columnIndex = 0;
    const color = "red";

    editor.colorPixels([{ rowIndex, columnIndex, color }]);

    const targetColor =
      editor.getLayersAsArray()[0].data[editor.getRowCount() - 1][columnIndex]
        .color;
    expect(targetColor).toBe(color);
  });

  it("test color pixel for an item that has a columnIndex smaller than leftColumnIndex", () => {
    const rowIndex = 0;
    const columnIndex = -5;
    const color = "red";

    editor.colorPixels([{ rowIndex, columnIndex, color }]);

    const targetColor =
      editor.getLayersAsArray()[0].data[rowIndex][editor.getColumnCount() - 1]
        .color;
    expect(targetColor).toBe(color);
  });

  it("test color pixel for an item that has a columnIndex bigger than rightColumnIndex", () => {
    const rowIndex = 0;
    const columnIndex = editor.getColumnCount() + 5;
    const color = "red";

    editor.colorPixels([{ rowIndex, columnIndex, color }]);

    const targetColor =
      editor.getLayersAsArray()[0].data[rowIndex][editor.getColumnCount() - 1]
        .color;
    expect(targetColor).toBe(color);
  });
});
