import styled from "styled-components";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80px;
  width: 100%;
`;

export const Title = styled.div`
  display: flex;
  font-size: 40px;
`;

export const Tabs = styled.div`
  display: flex;
  flex-direction: row;
`;

export const Tab = styled.div`
  font-size: 25px;
  padding-left: 20px;
  padding-right: 20px;
  cursor: pointer;
  /* background-color: black; */
`;
