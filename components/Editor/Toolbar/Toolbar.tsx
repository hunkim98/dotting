import { Color, ColorChangeHandler } from "react-color";
import { ColorGroups } from "./ColorGroups";
import { ColorPicker } from "./ColorPicker";
import * as S from "./styles";

interface Props {}

const Toolbar: React.FC<Props> = ({ children }) => {
  return <S.Container>{children}</S.Container>;
};

export default Toolbar;
