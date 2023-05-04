import "@testing-library/jest-dom";
import "jest-canvas-mock";

beforeEach(() => {
  jest.clearAllMocks();
});

afterAll(() => jest.restoreAllMocks());
