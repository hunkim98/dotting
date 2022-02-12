import { PanelButton } from "../PanelButton";
import * as S from "./styles";

interface Props {
  buttonText: string;
  clickFunctions: (() => void)[];
}

const PanelUpperButtons: React.FC<Props> = ({ buttonText, clickFunctions }) => {
  return (
    <>
      <PanelButton text={buttonText} clickFunction={clickFunctions[0]} />
    </>
  );
};

export default PanelUpperButtons;
