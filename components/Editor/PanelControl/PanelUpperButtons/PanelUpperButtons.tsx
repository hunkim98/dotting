import { PanelButton } from "../PanelButton";
import * as S from "./styles";

interface Props {
  clickFunctions: (() => void)[];
}

const PanelUpperButtons: React.FC<Props> = ({ clickFunctions }) => {
  return (
    <>
      <PanelButton text={"Start Project"} clickFunction={clickFunctions[0]} />
    </>
  );
};

export default PanelUpperButtons;
