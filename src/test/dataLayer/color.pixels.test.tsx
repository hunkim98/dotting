import { fireEvent } from "@testing-library/react";

import { DefaultButtonHeight } from "../../components/Canvas/config";
import Editor from "../../components/Canvas/Editor";
import { FakeMouseEvent } from "../../utils/testUtils";

describe("test for extension interaction", () => {
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
   * 1. test colorPixels method for single item
   * 2. test colorPixels method for multiple items
   * 3. test colorPixels method that are out of current bounds
   * Assigned to: 권혁범
   * ⬇️
   */
  it("test color pixel for a single item", () => {
    expect(1).toBe(1);
  });

  it("test color pixel for multiple items", () => {
    expect(1).toBe(1);
  });

  it("test color pixel for an item that has a rowIndex smaller than topRowIndex", () => {
    expect(1).toBe(1);
  });

  it("test color pixel for an item that has a rowIndex bigger than bottomRowIndex", () => {
    expect(1).toBe(1);
  });

  it("test color pixel for an item that has a columnIndex smaller than leftColumnIndex", () => {
    expect(1).toBe(1);
  });

  it("test color pixel for an item that has a columnIndex bigger than rightColumnIndex", () => {
    expect(1).toBe(1);
  });
  /** ⬆️ */
});
