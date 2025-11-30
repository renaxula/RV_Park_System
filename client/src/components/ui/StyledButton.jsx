import styled from "styled-components";

export const StyledButton = styled.button`
  background: ${({$emphasize}) => ($emphasize ? "#4077d1ff " : "#fff")};
  color: ${({$emphasize}) => ($emphasize ? "white" : "#4077d1ff")};
  border: ${({$emphasize}) => ($emphasize ? "none" : "1px solid #4077d1ff")};
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(3, 102, 214, 0.18);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 26px rgba(3, 102, 214, 0.22);
  }

  &:active {
    transform: translateY(0);
    opacity: 0.97;
  }

  &:focus {
    outline: 2px solid rgba(59,130,246,0.24);
    outline-offset: 2px;
  }
`;