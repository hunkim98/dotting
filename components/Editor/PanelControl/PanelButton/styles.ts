import styled from "styled-components";

export const Button = styled.button`
  font-size: 1.25rem;
  background-color: $red;
  color: $white;
  padding: 1rem 3rem;
  border-radius: 0.25rem;
  text-transform: uppercase;
  border: 1px solid transparent;
  transition: background-color 0.2s ease-in-out;
  margin-bottom: 2rem;

  &:hover {
    cursor: pointer;
    background-color: transparent;
    border-color: $red;
  }
`;
