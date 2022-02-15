import styled from "styled-components";

export const Container = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const BrushContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-right: 30px;
`;

export const BrushColor = styled.div<{ color: string }>`
  background-color: ${({ color }) => color};
  border-width: 3;
  border-radius: 10px;
  border-color: rgb(0, 0, 0);
  border-style: solid;
  width: 100px;
  height: 100px;
`;

export const ToolName = styled.div``;
