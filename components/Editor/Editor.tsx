import * as S from "./styles";

interface Props {}

const Editor: React.FC<Props> = ({ children }) => {
  console.log("Editor rendered");
  return <S.Container>{children}</S.Container>;
};

export default Editor;
