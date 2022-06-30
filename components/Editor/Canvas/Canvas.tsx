import { useEffect } from "react";
import * as S from "./styles";

interface Props {}

const Canvas: React.FC<Props> = ({ children }) => {
  return <S.Container>{children}</S.Container>;
};

export default Canvas;
