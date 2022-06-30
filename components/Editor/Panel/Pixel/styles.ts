import styled from "styled-components";
import { PixelContainer } from "../pixelStyles";

//이것은 상속한다는 뜻이다
export const Container = styled(PixelContainer)`
  width: 18px;
  height: 18px;
  &:hover {
    cursor: pointer;
  }
`;
