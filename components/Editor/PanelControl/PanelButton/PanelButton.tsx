import * as S from "./styles";

interface Props {
  text: string;
  clickFunction: () => void;
}

const PanelButton: React.FC<Props> = ({ text, clickFunction }) => {
  return <S.Button onClick={clickFunction}>{text}</S.Button>;
};

export default PanelButton;
