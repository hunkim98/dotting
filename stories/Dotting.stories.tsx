import React, { useRef } from "react";
import DottingComponent, {
  DottingProps,
  DottingRef,
} from "../src/components/Dotting";

//blog.harveydelaney.com/creating-your-own-react-component-library/

export default {
  title: "Components/Dotting",
  component: DottingComponent,
  argTypes: {
    width: { defaultValue: 300 },
    height: { defaultValue: 300 },
    ref: { control: { disable: true } },
  },
};

export const Dotting = (args: DottingProps) => {
  return <DottingComponent width={args.width} height={args.height} />;
};
