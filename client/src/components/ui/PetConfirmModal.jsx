import styled from "styled-components";
import { StyledButton } from "./StyledButton";

export function PetConfirmModal({ onConfirm, onClose, isAgreed, onAgreeChange }) {
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <h2>Pet Policy Confirmation</h2>

        <PolicyList>
          <li>Animal waste will be picked up and properly disposed of immediately.</li>
          <li>Pets will remain on a leash in control of the owner unless in the designated dog park area.</li>
          <li>When using the dog park, the pet owner must be present at all times.</li>
          <li>Dogs will not be chained outdoors or left unattended.</li>
          <li>In consideration of other guests, nuisance pet behavior will not be permitted.</li>
          <li>2 pet maximum.</li>
          <li>Dogs with breed lineage of Pit bulls, Staffordshire Terriers, Rottweilers, Chow Chows, Doberman Pinschers, wolf hybrids are restricted.</li>
        </PolicyList>

        <CheckboxContainer>
          <input
            type="checkbox"
            id="petPolicy"
            name="petPolicy"
            checked={isAgreed}
            onChange={(e) => onAgreeChange(e.target.checked)}
          />
          <label htmlFor="petPolicy">I have read and agree to the pet policy.</label>
        </CheckboxContainer>

        <ButtonGroup>
          <StyledButton onClick={onClose}>Cancel</StyledButton>
          {isAgreed ? <StyledButton $emphasize onClick={onConfirm} disabled={!isAgreed}>
            Confirm Reservation
          </StyledButton> : <DisabledButton disabled>
            Confirm Reservation
          </DisabledButton>}
        </ButtonGroup>
      </ModalContent>
    </ModalOverlay>
  );
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  color: black;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
`;

const PolicyList = styled.ul`
  margin: 16px 0;
  padding-left: 20px;
  list-style: disc;
  color: #475569;
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px 0;

  input[type="checkbox"] {
    cursor: pointer;
  }

  label {
    cursor: pointer;
    margin: 0;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
`;

const DisabledButton = styled(StyledButton)`
  background-color: #cbd5e1;
  cursor: not-allowed;
`;