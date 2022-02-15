import * as S from "./styles";

interface Props {}

const Editor: React.FC<Props> = ({ children }) => {
  return <S.Container>{children}</S.Container>;
};

export default Editor;
