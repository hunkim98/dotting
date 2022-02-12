import styled from "styled-components";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-left: 40px;
  margin-right: 40px;
`;

export const HeightControlContainer = styled.div`
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
