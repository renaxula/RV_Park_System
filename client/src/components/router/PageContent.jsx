import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import styled from "styled-components";
import bg from "../../assets/background.png";
import { routesConfig } from "./routesConfig";
import { Card } from "../ui/Card";
import { useAuth } from "./AuthContext";
import { UserInfo } from "../cards/UserInfo";

export function PageContent() {
  const { isAuthenticated } = useAuth();
  return (
    <Page>
      <Content>
        <Title>
          <header>
            <h2>FamCamp</h2>
            <h5>At Hill Airforce Base</h5>
          </header>
          {isAuthenticated && <UserInfo />}
        </Title>
        <Layout>
          <Routes>
            {routesConfig.map(({ path, Component, requiredRole }) => {
              return (
                <Route
                  key={path}
                  path={path}
                  element={
                    <ProtectedRoute requiredRole={requiredRole}>
                      <Component />
                    </ProtectedRoute>
                  }
                />
              );
            })}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </Content>
    </Page>
  );
}

function ProtectedRoute({ requiredRole, children }) {
  const location = useLocation();
  const { loading, isAuthenticated, hasRole } = useAuth();

  if (loading) {
    return (
      <Card>
        <p>Checking session...</p>
      </Card>
    );
  }

  if (requiredRole === null) {
    return children;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasRole(requiredRole)) {
    return <Restricted requiredRole={requiredRole} />;
  }

  return children;
}

function Restricted({ requiredRole }) {
  const { user } = useAuth();
  return (
    <Card>
      <h2>Access Restricted</h2>
      <p>
        The current role is <strong>{user?.role ?? "unknown"}</strong>. This
        page requires
        <strong> {requiredRole}</strong> access.
      </p>
      <p>You are signed in but do not have permission to view this page.</p>
    </Card>
  );
}

function NotFound() {
  return (
    <Card>
      <h2>Page Not Found</h2>
      <p>We could not find what you were looking for. Try another page.</p>
    </Card>
  );
}

const Page = styled.div`
  position: relative;
  width: 100%;
  min-height: 100vh;
  margin: 0;
  background-image: url(${bg});
  background-size: cover;
  background-position: right;
  padding: 0; /* background touches edges */
  color: #fff;
  > * {
    position: relative;
    z-index: 1;
  }
`;

const Content = styled.div`
  padding: 24px;
`;

const Layout = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
`;

const Title = styled.div`
  header {
    font-size: 2rem;
    text-align: left;
    color: black;
    margin-right: auto;
  }

  display: flex;
  justify-content: space-between;
  align-items: center;
`;
