import React, { createContext, useState } from "react";

interface Props {
  children: JSX.Element | Array<JSX.Element>;
}

interface mouseDragElement {
  mouseDrag: boolean;
  enableMouseDragDraw: () => void;
  disableMouseDragDraw: () => void;
}
const MouseDragContext = createContext<mouseDragElement>({
  mouseDrag: false,
  enableMouseDragDraw: (): void => {},
  disableMouseDragDraw: (): void => {},
});

const MouseDragContextProvider = ({ children }: Props) => {
  const [mouseDrag, setMouseDrag] = useState<boolean>(false);
  const enableMouseDragDraw = (): void => {
    setMouseDrag(true);
  };
  const disableMouseDragDraw = (): void => {
    setMouseDrag(false);
  };

  return (
    <MouseDragContext.Provider
      value={{ mouseDrag, enableMouseDragDraw, disableMouseDragDraw }}
    >
      {children}
    </MouseDragContext.Provider>
  );
};

export { MouseDragContext, MouseDragContextProvider };
