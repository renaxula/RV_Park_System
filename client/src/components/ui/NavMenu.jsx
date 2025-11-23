import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { routesConfig } from "../router/routesConfig";
import { useAuth } from "../router/AuthContext";

export function NavMenu() {
  const [open, setOpen] = useState(true);
  const { user, isAuthenticated, hasRole, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1547) setOpen(true);
      else setOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth <= 1547) setOpen(false);
  }, [location.pathname]);

  const handleNavClick = () => {
    if (window.innerWidth <= 1547) setOpen(false);
  };

  const navItems = routesConfig.filter((route) => {
    if (!route.showInNav) return false;
    if (route.requiredRole === null) return true;
    return hasRole(route.requiredRole);
  });

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <NavMenuStyled isOpen={open}>
      <TopRow>
        <StyledButton
          className={`burger ${open ? "open" : ""}`}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </StyledButton>
        <UserInfo>
          {isAuthenticated ? (
            <>
              <span>Signed in as {user.username} ({user.role})</span>
              <button type="button" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={handleNavClick}>Login</Link>
              <Link to="/register" onClick={handleNavClick}>Register</Link>
            </>
          )}
        </UserInfo>
      </TopRow>

      {open && (
        <ul>
          {navItems.map((item) => (
            <Item key={item.path} $active={location.pathname === item.path}>
              <Link
                to={item.path}
                onClick={handleNavClick}
                aria-current={location.pathname === item.path ? "page" : undefined}
              >
                {item.label}
              </Link>
            </Item>
          ))}
        </ul>
      )}
    </NavMenuStyled>
  );
}

const NavMenuStyled = styled.nav`
  margin-top: 1rem;
  display: inline-flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: stretch;
  background-color: #fff;
  padding: ${(p) => (p.isOpen ? "1rem" : "0.75rem")};
  box-sizing: border-box;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px rgba(0.1, 0.1, 0.1, 0.4);
  width: ${(p) => (p.isOpen ? "100%" : "auto")};

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  @media (min-width: 1547px) {
    width: auto;
    ul {
      flex-wrap: nowrap;
    }
  }
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  justify-content: space-between;
`;

const StyledButton = styled.button`
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 30px;
  height: 30px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  box-sizing: border-box;
  z-index: 3;

  span {
    width: 30px;
    height: 3px;
    background: #000;
    border-radius: 2px;
    transition: all 0.3s linear;
    position: relative;
    transform-origin: 1px;
  }

  &.open span:nth-child(1) {
    transform: rotate(45deg);
  }

  &.open span:nth-child(2) {
    opacity: 0;
  }

  &.open span:nth-child(3) {
    transform: rotate(-45deg);
  }

  @media (max-width: 1547px) {
    display: flex;
  }
`;

const Item = styled.li`
  padding: 6px 8px;
  text-decoration: none;
  background-color: ${(p) => (p.$active ? "#e2e8f0" : "#f6f6f6")};
  border-radius: 2rem;
  margin: 0 0.25rem;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: rgba(231, 244, 225, 1);
  }

  a {
    color: #000;
    font-weight: 600;
    text-decoration: none;
    display: block;
    padding: 6px 10px;
  }

  @media (max-width: 1547px) {
    width: 100%;
    a {
      width: 100%;
    }
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;

  button {
    border: 1px solid #d4d4d8;
    background: #f8fafc;
    border-radius: 8px;
    padding: 6px 10px;
    cursor: pointer;
  }

  a {
    color: #000;
    font-weight: 600;
    text-decoration: none;
  }
`;
