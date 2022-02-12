import { createContext, useState, useEffect } from "react";
import { ColorResult } from "react-color";

interface Props {
  children: JSX.Element | Array<JSX.Element>;
}

interface colorElement {
  color: string;
  changeColor: (X: any) => void;
}

const ColorContext = createContext<colorElement>({
  color: "#f44336",
  changeColor: (X: string): void => {},
});

const ColorContextProvider = ({ children }: Props) => {
  const [color, setColor] = useState<string>("#f44336");
  const changeColor = (X: ColorResult | string) => {
    if (typeof X === "string") {
      setColor(X);
    } else {
      setColor(X.hex);
    }
  };
  return (
    <ColorContext.Provider value={{ color, changeColor }}>
      {children}
    </ColorContext.Provider>
  );
};

export { ColorContext, ColorContextProvider };
