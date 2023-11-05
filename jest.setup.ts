import "@testing-library/jest-dom";
import "jest-canvas-mock";

class Worker {
  url: string;
  onmessage: (msg: any) => void;
  constructor(stringUrl) {
    this.url = stringUrl;
    this.onmessage = () => {
      return;
    };
  }

  postMessage(msg) {
    this.onmessage(msg);
  }
}

beforeEach(() => {
  jest.clearAllMocks();
  window.URL.createObjectURL = jest.fn();
  window.URL.revokeObjectURL = jest.fn();
  window.Worker = Worker as any;
  window.OffscreenCanvas = jest
    .fn()
    .mockImplementation((width: number, height: number) => {
      return {
        height,
        width,
        oncontextlost: jest.fn(),
        oncontextrestored: jest.fn(),
        getContext: jest.fn().mockImplementation(() => {
          return {
            restore: jest.fn(),
            save: jest.fn(),
            fillStyle: "",
            fillRect: jest.fn(),
          };
        }),
        convertToBlob: jest.fn(),
        transferToImageBitmap: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      } as unknown as OffscreenCanvas;
    });
  window.HTMLCanvasElement.prototype.transferControlToOffscreen = jest.fn();
});

afterAll(() => jest.restoreAllMocks());
