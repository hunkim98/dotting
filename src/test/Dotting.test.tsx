import "@testing-library/jest-dom";
import { act, render } from "@testing-library/react";
import React from "react";

import Dotting, { DottingProps, DottingRef } from "../components/Dotting";

describe("Dotting Component", () => {
  let props: DottingProps;

  beforeEach(() => {
    props = {
      width: 300,
      height: 300,
    };
  });

  const renderDotting = () => render(<Dotting {...props} />);

  it("should render Dotting component", () => {
    const { container } = renderDotting();
    const canvas = container.getElementsByTagName("canvas")[0];
    expect(canvas).toBeInTheDocument();
  });

  it("exposes brush alpha through the public ref and brush change event", () => {
    const ref = React.createRef<DottingRef>();
    const listener = jest.fn();
    render(<Dotting {...props} ref={ref} />);

    act(() => {
      ref.current?.addBrushChangeListener(listener);
      ref.current?.changeBrushAlpha(0.4);
    });

    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ brushAlpha: 0.4 }),
    );
  });
});
