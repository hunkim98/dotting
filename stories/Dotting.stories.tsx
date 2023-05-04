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
  parameters: {
    docs: {
      description: {
        component: `A component that allows you to draw pixels on canvas.\
         You must set the width and height of the canvas if you want to use it.\
         You can also set the initial data of the canvas.\
         You can also set the initial brush color if you want to.\
          The canvas is pan and zoomable by default.\
            The canvas grids are visible by default.\
           You can also set the initial indicator data of the canvas.`,
      },
    },
  },
  argTypes: {
    width: {
      description:
        "The width of the canvas. When you assign a string to width, it should be a valid CSS length value such as `100%`.",
      defaultValue: 300,
    },
    height: {
      description:
        "The height of the canvas. When you assign a string to height, it should be a valid CSS length value such as `100%`.",
      defaultValue: 300,
    },
    ref: {
      description:
        "The ref object that you would like to connect to the Dotting Canvas.\
     You must pass the `DottingRef` object as props if you would like to use hooks",
      control: { disable: true },
    },
    initData: {
      description: "The initial data that you want to draw on the canvas",
      control: { disable: true },
    },
    isPanZoomable: {
      description: "If set to `true` the canvas will be pan and zoomable",
      defaultValue: true,
      table: {
        defaultValue: { summary: true },
      },
    },
    isGridVisible: {
      defaultValue: true,
      description: "If set to `true` the grid lines will be visible",
      table: {
        defaultValue: { summary: true },
      },
    },
    isGridFixed: {
      defaultValue: false,
      description: "If set to `true` the grid will not be extendable",
      table: {
        defaultValue: {
          summary: false,
        },
      },
    },
    initBrushColor: {
      defaultValue: "#FF0000",
      control: {
        disable: true,
      },
      description:
        "The initial brush color for drawing the grid.\
        You can use `useBrush` hook to change the brush color later.",
      table: {
        type: {
          summary: "string",
        },
        defaultValue: { summary: "#FF0000" },
      },
    },
    initIndicatorData: {
      defaultValue: [],
      control: {
        disable: true,
      },
      description:
        "The initial indicator data for the canvas. You can change the indicator data later with `useDotting` hook.",
      table: {
        defaultValue: { summary: "[]" },
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
      isGridVisible={args.isGridVisible}
      isGridFixed={args.isGridFixed}
    />
  );
};
