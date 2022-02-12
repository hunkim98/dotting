import styled from "styled-components";

export const OptionContainer = styled.div`
  display: flex;
  margin-bottom: 3rem;
  justify-content: center;
`;

export const Option = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const OptionInput = styled.input`
  height: 5rem;
  width: 5rem;
  font-size: 2rem;
  text-align: center;
  background-color: $black;
  color: $white;
  border: 1px solid $grey;
  border-radius: 0.25rem;
  margin: 0 1rem 0.5rem 1rem;
  padding-left: 1rem;

  &:focus {
    outline: none !important;
    border-color: $red;
    box-shadow: 0 0 0.5rem $grey;
  }
`;
