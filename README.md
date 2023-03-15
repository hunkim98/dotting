![dotting_github](https://user-images.githubusercontent.com/57612141/225073544-94a2f8b4-187c-475f-a079-3b427efbdd02.png)

<br/>

<h2 align="center"> Dotting: Flexible Pixel Art Editor for React </h2>

<p align="center">Dotting is a <strong>Pixel art drawing component</strong> for React developers who want to implement a pixel canvas editor in their websites.</p>

<br/>






<br/>

<h3 align="center">Why Dotting?</h3>
<p align="center">1. Dotting works for both PC 💻 and moible 📱 environments.</p>
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

Step1. Install the package

```bash
$ yarn add dotting
```

Step2. Place `Dotting` component in your project

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

## Components

To use the canvas component, you should first use the `<Dotting/>` component. You must set the `width` and `height` to use it.

```jsx
<Dotting width={300} height={300}/>
```

<br/>

## Hooks

To manipulate the pixel grids programatically, you can use hooks. The provided hooks are `useBrush`, `useData`, `useDotting`, `useGrids`, `useHandlers`. Below is an example using the `useDotting` hook for clearing the pixels when button is clicked

```jsx
import { Dotting, DottingRef, useDotting } from "dotting"

export const Component = () => {
  const ref = useRef<DottingRef>();
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
