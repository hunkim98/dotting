import * as S from "./styles";
import * as PixelStyle from "../pixelStyles";

interface Props {}

const PixelBorder: React.FC<Props> = ({}) => {
  return (
    <PixelStyle.PixelContainer
      className="pixel"
      style={{ boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.1) inset" }}
    ></PixelStyle.PixelContainer>
  );
};

export default PixelBorder;
