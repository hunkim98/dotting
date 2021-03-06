import styled from "styled-components";

export const Container = styled.div<{
  // selectedGroup: colorGroup | undefined;
  selected: boolean;
}>`
  background-color: ${({ selected }) => selected && "#DCD87B"};
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 35px;
  padding-right: 10px;
  padding-left: 10px;
`;

export const Color = styled.div<{ color: string | undefined }>`
  background-color: ${({ color }) => color};
  width: 18px;
  height: 18px;
  /* width: 100%; */
  /* height: 100%; */
`;

export const Name = styled.div``;
export const Input = styled.input``;

export const Button = styled.button``;

export const Count = styled.div``;
