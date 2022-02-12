import { PanelButton } from "../PanelButton";

interface Props {
  clickFunctions: (() => void)[];
  hideDrawingPanel: boolean;
}

const PanelBelowButtons: React.FC<Props> = ({
  clickFunctions,
  hideDrawingPanel,
}) => {
  return (
    <>
      {!hideDrawingPanel && (
        <PanelButton text={"Export as PNG"} clickFunction={clickFunctions[0]} />
      )}
      <PanelButton text={"Save"} clickFunction={clickFunctions[1]} />
      <PanelButton text={"Bring Sample"} clickFunction={clickFunctions[2]} />
    </>
  );
};

export default PanelBelowButtons;
