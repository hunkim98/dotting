import React from "react";

import {
  generateComponentControl,
  generateComponentControlForEnum,
} from "./utils/componentControl";
import { KeysEnum, StoriesComponentItem } from "./utils/types";
import {
  DefaultGridSquareLength,
  DefaultMaxScale,
  DefaultMinScale,
  DefaultPixelColor,
} from "../src/components/Canvas/config";
import { BrushTool } from "../src/components/Canvas/types";
import DottingComponent, { DottingProps } from "../src/components/Dotting";

//blog.harveydelaney.com/creating-your-own-react-component-library/

const DottingComponentArgTypes: KeysEnum<
  DottingProps,
  StoriesComponentItem<unknown>
> = {
  width: generateComponentControl<DottingProps["width"]>({
    description:
      "The width of the canvas. When you assign a string to width, it should be a valid CSS length value such as `100%`.",
    defaultValue: 300,
    disable: false,
  }),
  height: generateComponentControl<DottingProps["height"]>({
    description:
      "The height of the canvas. When you assign a string to height, it should be a valid CSS length value such as `100%`.",
    defaultValue: 300,
    disable: false,
  }),
  style: generateComponentControl<DottingProps["style"]>({
    description: "The style object for the canvas",
    disable: true,
  }),
  gridStrokeColor: generateComponentControl<DottingProps["gridStrokeColor"]>({
    description: "The stroke color of the grid",
    disable: false,
  }),
  gridStrokeWidth: generateComponentControl<DottingProps["gridStrokeWidth"]>({
    defaultValue: 1,
    description: "The stroke width of the grid",
    disable: false,
  }),
  isGridVisible: generateComponentControl<DottingProps["isGridVisible"]>({
    defaultValue: true,
    description: "If set to `true` the grid lines will be visible",
    disable: false,
  }),
  // TODO: backgroundMode "checkerboard" does not work for now due to the changes in interactionlayer
  //       We must first tackle with `renderCanvasMask` to make backgroundMode to be set by users
  // backgroundMode: generateComponentControl<DottingProps["backgroundMode"]>({
  //   defaultValue: "checkerboard",
  //   description: "The background mode of the canvas.",
  //   disable: false,
  // }),
  backgroundColor: generateComponentControl<DottingProps["backgroundColor"]>({
    defaultValue: "#c9c9c9",
    description: "The background color of the canvas.",
    disable: false,
  }),
  initLayers: generateComponentControl<DottingProps["initLayers"]>({
    description:
      "The initial layers that you want to draw on the canvas.\
     If nothing is passed, there will be 1 default layer, and its id will be 'layer1'",
    disable: true,
  }),
  isPanZoomable: generateComponentControl<DottingProps["isPanZoomable"]>({
    description: "If set to `true` the canvas will be pan and zoomable",
    defaultValue: true,
    disable: false,
  }),
  isGridFixed: generateComponentControl<DottingProps["isGridFixed"]>({
    defaultValue: false,
    description: "If set to `true` the grid will not be extendable",
    disable: false,
  }),

  // ref: generateComponentControl<DottingProps["ref"]>({
  //   description:
  //     "The ref object that you would like to connect to the Dotting Canvas.\
  //     You must pass the `DottingRef` object as props if you would like to use hooks",
  //   disable: true,
  // }),
  brushTool: generateComponentControlForEnum<DottingProps["brushTool"]>({
    defaultValue: BrushTool.DOT,
    description: "The brush tool is for changing the brush tool",
    enumProp: BrushTool,
    disable: false,
  }),
  brushColor: generateComponentControl<DottingProps["brushColor"]>({
    defaultValue: "#FF0000",
    description:
      "The brush color for drawing the grid.\
      You can make a `useState` for tracking brushColor \
      You can also use `useBrush` hook to change the brush color later.",
    disable: false,
  }),
  indicatorData: generateComponentControl<DottingProps["indicatorData"]>({
    description: "The indicator data that you want to draw on the canvas.",
    disable: true,
  }),
  isInteractionApplicable: generateComponentControl<
    DottingProps["isInteractionApplicable"]
  >({
    defaultValue: true,
    description:
      "If set to `true` the interaction will be applicable.\
    If set to `false` the interaction will be disabled",
    disable: false,
  }),
  isDrawingEnabled: generateComponentControl<DottingProps["isDrawingEnabled"]>({
    defaultValue: true,
    description:
      "If set to `true` the drawing will be enabled.\
      If set to `false` the drawing will be disabled",
    disable: false,
  }),
  gridSquareLength: generateComponentControl<DottingProps["gridSquareLength"]>({
    defaultValue: DefaultGridSquareLength,
    description: "The length of the grid square.",
    disable: false,
  }),
  defaultPixelColor: generateComponentControl<
    DottingProps["defaultPixelColor"]
  >({
    defaultValue: DefaultPixelColor,
    description: "The default pixel color.",
    disable: false,
  }),
  minScale: generateComponentControl<DottingProps["minScale"]>({
    defaultValue: DefaultMinScale,
    description: "The minimum scale of the canvas.",
    disable: false,
  }),
  maxScale: generateComponentControl<DottingProps["maxScale"]>({
    defaultValue: DefaultMaxScale,
    description: "The maximum scale of the canvas.",
    disable: false,
  }),
  initAutoScale: generateComponentControl<DottingProps["initAutoScale"]>({
    defaultValue: false,
    description:
      "Wheter to initially auto scale the canvas to fit the grids inside the canvas",
    disable: false,
  }),
};

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
  argTypes: DottingComponentArgTypes,
};

export const Dotting = (args: DottingProps) => {
  return (
    <DottingComponent
      width={args.width}
      height={args.height}
      style={undefined}
      gridStrokeColor={args.gridStrokeColor}
      gridStrokeWidth={args.gridStrokeWidth}
      isGridVisible={args.isGridVisible}
      // backgroundMode={args.backgroundMode}
      backgroundColor={args.backgroundColor}
      isPanZoomable={args.isPanZoomable}
      isGridFixed={args.isGridFixed}
      brushColor={args.brushColor}
      brushTool={args.brushTool}
      indicatorData={[]}
      isInteractionApplicable={args.isInteractionApplicable}
      isDrawingEnabled={args.isDrawingEnabled}
      gridSquareLength={args.gridSquareLength}
      defaultPixelColor={args.defaultPixelColor}
      minScale={args.minScale}
      maxScale={args.maxScale}
      initAutoScale={args.initAutoScale}
    />
  );
};
