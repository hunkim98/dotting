import styled from "styled-components";

export const HeightControlContainer = styled.div<{
  location: "top" | "bottom";
}>`
  position: absolute;
  top: ${({ location }) => location === "top" && "-40px"};
  bottom: ${({ location }) => location === "bottom" && "-40px"};
  display: flex;
`;

export const HeightControlButton = styled.div`
  margin-top: 20px;
  margin-bottom: 20px;
  width: 25px;
  height: 25px;
`;

export const PixelsCanvasContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  margin: 60px;
`;

export const WidthControlContainer = styled.div<{
  location: "left" | "right";
}>`
  position: absolute;
  left: ${({ location }) => location === "left" && "-40px"};
  right: ${({ location }) => location === "right" && "-40px"};
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;
