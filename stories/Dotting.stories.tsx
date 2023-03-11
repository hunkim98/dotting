import React, { useRef } from "react";
import { DottingData } from "../src/components/Canvas/types";
import DottingComponent, {
  DottingProps,
  DottingRef,
} from "../src/components/Dotting";

//blog.harveydelaney.com/creating-your-own-react-component-library/

export default {
  title: "Components/Dotting",
  component: DottingComponent,
  argTypes: {
    width: {
      defaultValue: 300,
    },
    height: {
      defaultValue: 300,
    },
    ref: { control: { disable: true } },
    initData: { control: { disable: true } },
    isPanZoomable: {
      defaultValue: true,
      table: {
        defaultValue: { summary: true },
      },
    },
    isGridFixed: {
      defaultValue: false,
      table: {
        defaultValue: { summary: false },
      },
    },
    initBrushColor: {
      defaultValue: "#FF0000",
      control: {
        disable: true,
      },
      table: {
        defaultValue: { summary: "#FF0000" },
      },
    },
  },
};

export const Dotting = (args: DottingProps) => {
  return (
    <DottingComponent
      width={args.width}
      height={args.height}
      isPanZoomable={args.isPanZoomable}
      isGridFixed={args.isGridFixed}
    />
  );
};
