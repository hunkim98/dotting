![dotting_github](https://user-images.githubusercontent.com/57612141/225073544-94a2f8b4-187c-475f-a079-3b427efbdd02.png)

<div align="center">

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=hunkim98_dotting&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=hunkim98_dotting)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=hunkim98_dotting&metric=coverage)](https://sonarcloud.io/summary/new_code?id=hunkim98_dotting)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=hunkim98_dotting&metric=bugs)](https://sonarcloud.io/summary/new_code?id=hunkim98_dotting)

</div>

<br/>

<h2 align="center"> Dotting: Flexible Pixel Art Editor for React </h2>

<p align="center">Dotting is a <strong>Pixel art drawing component</strong> for React developers who want to implement a pixel canvas editor in their websites.</p>

<br/>

<br/>

<h3 align="center">Why Dotting?</h3>
<p align="center">1. Dotting works for both PC 💻 and mobile 📱 environments.</p>
<p align="center">2. You can freely pan & zoom around the using your mouse🖱 or your fingers👌.</p>
<p align="center">3. You can extend your canvas grid to any size⬆️⬅️⬇️➡️.</p>

<p align="center">
<img src="https://user-images.githubusercontent.com/57612141/225075775-78281b37-864b-407d-947b-fdafcc544fa5.gif"/>
</p>

</br>

<p align="center">
  <a href="https://hunkim98.github.io/dotting">
    Documentation
  </a>
</p>

</br>

## Quick Start

**Step1. Install the package**

```bash
$ yarn add dotting
```

**Step2. Place `Dotting` component in your project**

```jsx
import { Dotting } from "dotting";

const Clear = () => {
  return (
    <div>
      <Dotting width={300} height={300} />
    </div>
  );
};
```

<br/>

## Component Props

When creating a `Dotting` component there are multiple props prepared for easily customizing the canvas. Especially, you can set the brush you would like to use through the `brushTool` prop. The `width` and `height` props should be initialized with your own values.

If you would like to use the hooks for further customizing the component, you must use the `ref` prop ans assign a `refObject` created with `useRef<DottingRef>`. An example of how to use hooks by setting a `refObject` is shown below.

| Name                    | Description                                                                                                                                                                 | type                  |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| **width\***             | The width of the canvas. When you assign a string to width, it should be a valid CSS length value such as 100%.                                                             | `string` or `number`  |
| **height\***            | The height of the canvas. When you assign a string to height, it should be a valid CSS length value such as 100%.                                                           | `string` or `number`  |
| style                   | The style object for the canvas                                                                                                                                             | `React.CSSProperties` |
| gridStrokeColor         | The stroke color of the grid                                                                                                                                                | `string`              |
| gridStrokeWidth         | The stroke width of the grid                                                                                                                                                | `number`              |
| isGridVisible           | If set to true the grid lines will be visible                                                                                                                               | `boolean`             |
| backgroundColor         | The background color of the canvas.                                                                                                                                         | `string`              |
| initLayers              | The initial layers that you want to draw on the canvas. If nothing is passed, there will be 1 default layer, and its id will be 'layer1'                                    | `LayerProps[]`        |
| isPanZoomable           | If set to true the canvas will be pan and zoomable                                                                                                                          | `boolean`             |
| isGridFixed             | If set to true the grid will not be extendable                                                                                                                              | `boolean`             |
| brushTool               | The brush tool is for changing the brush tool                                                                                                                               | `BrushTool`           |
| brushColor              | The brush color for drawing the grid. You can make a `useState` for tracking brushColor You can also use `useBrush` hook to change the brush color with `changeBrushColor`. | `string`              |
| indicatorData           | The indicator data that you want to draw on the canvas                                                                                                                      | `PixelModifyItem[]`   |
| isInteractionApplicable | If set to true the interaction will be applicable. If set to false the interaction will be disabled                                                                         | `boolean`             |
| isDrawingEnabled        | If set to true the drawing will be enabled. If set to false the drawing will be disabled                                                                                    | `boolean`             |
| gridSquareLength        | The length of the grid square. The default is 20.                                                                                                                           | `number`              |
| defaultPixelColor       | The default pixel color.                                                                                                                                                    | `string`              |
| minScale                | The minimum scale of the canvas.color.                                                                                                                                      | `number`              |
| maxScale                | The maximum scale of the canvas.color.                                                                                                                                      | `number`              |
| initAutoScale           | Wheter to initially auto scale the canvas to fit the grids inside the canvas                                                                                                | `boolean`             |
| resizeUnit              | The unit of reszie amount during extension                                                                                                                                  | `number`              |
| maxColumnCount          | The max column count of the canvas. It is undefined by default. The value should be at least 3                                                                              | `number`              |
| minColumnCount          | The max column count of the canvas. It is 2 by default. The value should be at least 2                                                                                      | `number`              |
| maxRowCount             | The max row count of the canvas. It is undefined by default. The value should be at least 3                                                                                 | `number`              |
| minRowCount             | The min column count of the canvas. It is 2 by default. The value should be at least 2                                                                                      | `number`              |
| **ref**                 | This is a ref object that must be used if you plan to use hooks for manipulating the canvas through code                                                                    | `Ref<DottingRef>`     |

<br/>

## Basic Types

There are some types that you should take notice of when using hooks or setting props for Dotting. In this section, I only cover the types that are related to `Dotting` props. For further details on specific types used in hooks, please check the [documentation](https://hunkim98.github.io/dotting/?path=/story/hooks-setup--page)

| Name              | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | type                                                                                                                               |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `LayerProps`      | This contains the necessary props for creating a layer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `{ id: string; data: Array<Array<PixelModifyItem>>;}`                                                                              |
| `PixelModifyItem` | This is an item that contains the information for one pixel square. In a default canvas, the top left pixel square's rowIndex and columnIndex are both 0. The pixel square just below it has a rowIndex of 1 and a columnIndex of 0, white the pixel square just next to it has a rowIndex of 0 and a columnIndex of 1                                                                                                                                                                                                                    | `{ rowIndex: number; columnIndex: number; color: string;}`                                                                         |
| `BrushTool`       | This is an `enum` containing all the tools usable in the canvas. Currently we support `NONE`, `Pen (Dot) Tool`, `Eraser Tool`,`Paint Tool`, `Select Tool`. The `NONE` allows users to only pan the canvas. `Pen (Dot) Tool` allows users to draw pixels. `Eraser Tool` allows users to erase pixels. `Paint Tool` allows users to paint a region. `Select Tool` allows users to select a certain area and move the selected region or resize the region. Tools other than `NONE` and `Select Tool` basically allows for resizing the grid | `BrushTool.NONE` , `BrushTool.DOT`, `BrushTool.ERASER`, `BrushTool.PAINT_BUCKET`,`BrushTool.SELECT`                                |
| `DottingRef`      | This is a ref object which you contains all the callbacks for manipulating the canvas through programming. You are free to use the callbacks directly from the ref ojbect or you can use hooks for convenience                                                                                                                                                                                                                                                                                                                            | [Check the file](https://github.com/hunkim98/dotting/blob/e917863158c8106c2bca805925d11d40c76a9608/src/components/Dotting.tsx#L60) |

<br/>

## Don't forget setting the width and height!

To use the canvas component, you should first use the `<Dotting/>` component. You must set the `width` and `height` to use it.

```jsx
<Dotting width={300} height={300} />
```

<br/>

## Want to manipulate the canvas? Use hooks!

To manipulate the pixel grids programatically, you can use hooks. The provided hooks are `useBrush`, `useData`, `useDotting`, `useGrids`, `useHandlers`. For using the hooks, you must create a ref object with React's `useRef` and input the resulting ref object as a prop in the `Dotting` component and also pass it as a parameter to the hooks. Below is an example using the `useDotting` hook for clearing the pixels when button is clicked

```tsx
import { Dotting, DottingRef, useDotting } from "dotting";

export const Component = () => {
  const ref = useRef<DottingRef>(null);
  const { clear } = useDotting(ref);
  return (
    <div>
      <Dotting ref={ref} width={300} height={300} />
      <button onClick={clear}>Clear Canvas</button>
    </div>
  );
};
```

For more details on how to use hooks, please check the [documentation](https://hunkim98.github.io/dotting/?path=/story/hooks-setup--page)

<br/>

## For contributing

Dotting welcomes contributors! If you are interested, contact me through [twitter](https://twitter.com/hunkim98)!

<br/>

## Contributors ✨

Thanks goes to these incredible people!!

<a href="https://github.com/hunkim98/dotting/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=hunkim98/dotting" />
</a>
