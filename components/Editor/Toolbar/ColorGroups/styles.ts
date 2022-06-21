import styled from "styled-components";
import { colorGroup } from "../../../../const/CommonDTO";

export const Container = styled.div`
  margin-top: 25px;
  flex: 1 1 auto; //this is very important
  overflow-y: auto;
  height: 0px;
  width: 100%;
  border: 1px solid black;
  overflow: visible; //this is for showing element outside
`;

export const ScrollerContainer = styled.div<{
  index: number;
  // selectedGroup: colorGroup | undefined;
  openChangePanel: boolean;
}>``;

// `
//   background-color: ${({ selectedGroup, openChangePanel, index }) =>
//     selectedGroup?.index === index && openChangePanel && "#DCD87B"};
// `;
