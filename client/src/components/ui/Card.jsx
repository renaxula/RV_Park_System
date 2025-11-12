import styled from "styled-components";

export const Card = styled.div`
  background: rgba(255, 255, 255, 1);
  color: #000;
  padding: 1.5rem;
  border-radius: 6px;
  filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.5));
  margin-top: 2rem;
  width: 100%;

  @media (max-width: 768px) {
    width: 100%;
  }
`;
