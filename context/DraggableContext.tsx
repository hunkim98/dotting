import { createContext, Dispatch, SetStateAction, useState } from "react";

interface Props {
  children: JSX.Element | Array<JSX.Element>;
}

interface position {
  x: number;
  y: number;
}

interface draggableElement {
  position: position;
  setPosition: Dispatch<SetStateAction<position>>;
}

const DraggableContext = createContext<draggableElement>(
  {} as draggableElement
);

const DraggableContextProvider = ({ children }: Props) => {
  const [position, setPosition] = useState<position>({ x: 200, y: 400 });
  return (
    <DraggableContext.Provider value={{ position, setPosition }}>
      {children}
    </DraggableContext.Provider>
  );
};

export { DraggableContext, DraggableContextProvider };
