import { Card } from "../ui/Card";
import { useAuth } from "../router/AuthContext";
import styled from "styled-components";
import { StyledButton } from "../ui/StyledButton";
import { Link } from "react-router-dom";

export function UserInfo() {
  const { user, logout, homePage } = useAuth();
  const isStaff = user?.role === 'employee' || user?.role === 'admin';
  
  return (
    <UserCard>
      <Layout>
        <ProfileIcon />
        <Info>
          <h2>{user?.username ?? ""}</h2>
          <Buttons>
            <Link to={homePage}>
              <HomeIcon />
            </Link>
            <StyledButton $emphasize={true} onClick={logout}>
              Logout
            </StyledButton>
            <Link to="/change-password">
              <StyledButton>Change Password</StyledButton>
            </Link>
            {isStaff && (
              <Link to="/all-reservations">
                <StyledButton>All Reservations</StyledButton>
              </Link>
            )}
          </Buttons>
        </Info>
      </Layout>
    </UserCard>
  );
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
      <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0" />
      <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm12 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1v-1c0-1-1-4-6-4s-6 3-6 4v1a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z" />
    </svg>
  </>
);

const HomeIcon = (hover) => (
  <HomeContainer>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="25"
      height="25"
      fill="#4077d1ff"
      className="bi bi-house-door-fill"
      viewBox="0 0 16 16"
    >
      <path d="M6.5 14.5v-3.505c0-.245.25-.495.5-.495h2c.25 0 .5.25.5.5v3.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5" />
    </svg>
  </HomeContainer>
);

const HomeContainer = styled.div`
  border: 2px solid #4077d1ff;
  width: 100%;
  border-radius: 0.5rem;
  display: flex;
  padding: 0.2rem;
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
    outline: 2px solid rgba(59, 130, 246, 0.24);
    outline-offset: 2px;
  }
`;
