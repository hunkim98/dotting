import Editor from "../../components/Canvas/Editor";

describe("test for drawing interaction", () => {
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

  /**
   * TODO:
   * 1. test if bressenhamindices work when mouse is moved around the canvas
   *    (hint: use FakeMouseEvent, refer to extension.test.tsx for example)
   * Assigned to: 방호찬
   * ⬇️
   */
  it("test if bressenhamindces work when mouse is moved along the canvas", () => {
    expect(1).toBe(1);
  });
  // You do not need to add additional tests!
  // Just make sure that the test above is working!
  /** ⬆️ */
});
