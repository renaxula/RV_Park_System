import { Card } from "../ui/Card"
import { useAuth } from "../router/AuthContext";
import styled from "styled-components";

export function UserInfo(){
    const { user } = useAuth();
    return <UserCard>
        <Layout>
            <ProfileIcon/>
            <Info>
                <h2>
                    {user?.username ?? ''}
                </h2>
                <Buttons>
                    <StyledButton emphasize={true}>Logout</StyledButton>
                    <StyledButton>Change Password</StyledButton>
                </Buttons>
            </Info>
        </Layout>
    </UserCard>
}

const UserCard = styled(Card)`
    width: fit-content;
`;

const Layout = styled.div`
    display: flex;
    gap: 1rem;
`;

const Info = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
`;

const Buttons = styled.div`
    display: flex;
    gap: 1rem;
`;


const ProfileIcon = () => (
  <>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="75"
      height="75"
      fill="currentColor"
      className="bi bi-person-square"
      viewBox="0 0 16 16"
    >
      <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
      <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm12 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1v-1c0-1-1-4-6-4s-6 3-6 4v1a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z"/>
    </svg>
  </>
);


const StyledButton = styled.button`
  background: ${(p) => (p.emphasize ? "#045de9 " : "#fff")};
  color: ${(p) => (p.emphasize ? "white" : "#045de9")};
  border: ${(p) => (p.emphasize ? "none" : "1px solid #045de9")};
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