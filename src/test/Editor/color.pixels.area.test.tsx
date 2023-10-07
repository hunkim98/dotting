import Editor from "../../components/Canvas/Editor";

describe("test for color pixels area", () => {
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

  /**
   * TODO:
   * 1. test colorPixelsArea method
   * 2. test if colorPixelsArea method is called correctly when mouse is down in canvas
   *    (hint: use FakeMouseEvent, refer to extension.test.tsx for example)
   * Assigned to: 조유진
   * ⬇️
   */
  it("test color pixels area function", () => {
    expect(1).toBe(1);
  });
  // add more tests below...
  // Remind to test for all cases in if-else statements
  /** ⬆️ */
});
