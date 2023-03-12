import { render } from "@testing-library/react";
import React from "react";
import Dotting, { DottingProps } from "./Dotting";

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
});
