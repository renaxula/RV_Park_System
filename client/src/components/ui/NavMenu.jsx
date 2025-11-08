// ...existing code...
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

export function NavMenu() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1547) setOpen(true);
      else setOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNavClick = () => {
    if (window.innerWidth <= 1547) setOpen(false);
  };

  return (
    <NavMenuStyled isOpen={open}>
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

      {open && (
        <ul>
          <Item>
            <Link to="/" onClick={handleNavClick}>Home</Link>
          </Item>
          <Item>
            <Link to="/admin" onClick={handleNavClick}>Admin</Link>
          </Item>
          <Item>
            <Link to="/available-spots" onClick={handleNavClick}>Available Spots</Link>
          </Item>
          <Item>
            <Link to="/make-reservation" onClick={handleNavClick}>Make Reservation</Link>
          </Item>
          <Item>
            <Link to="/employee-reservation" onClick={handleNavClick}>Employee Reservation</Link>
          </Item>
          <Item>
            <Link to="/view-reservations" onClick={handleNavClick}>View Reservations</Link>
          </Item>
          <Item>
            <Link to="/change-rates" onClick={handleNavClick}>Change Rates</Link>
          </Item>
          <Item>
            <Link to="/change-password" onClick={handleNavClick}>Change Password</Link>
          </Item>
          <Item>
            <Link to="/reset-password" onClick={handleNavClick}>Reset Password</Link>
          </Item>
          <Item>
            <Link to="/register" onClick={handleNavClick}>Register</Link>
          </Item>
          <Item>
            <Link to="/elevate-demote" onClick={handleNavClick}>Elevate/Demote</Link>
          </Item>
          <Item>
            <Link to="/map-and-rules" onClick={handleNavClick}>Map & Rules</Link>
          </Item>
          <Item>
            <Link to="/occupied-report" onClick={handleNavClick}>Occupied Report</Link>
          </Item>
          <Item>
            <Link to="/open-report" onClick={handleNavClick}>Open Report</Link>
          </Item>
        </ul>
      )}
    </NavMenuStyled>
  );
}
const NavMenuStyled = styled.nav`
  /* base */
  margin-top: 1rem;
  display: inline-flex; /* shrink to content by default */
  align-items: flex-start;
  background-color: #fff;
  padding: ${(p) =>
    p.isOpen ? "1rem" : "0.75rem"}; /* small padding when closed */
  box-sizing: border-box;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px rgba(0.1, 0.1, 0.1, 0.4);
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    align-items: flex-start;
  }

  ul > li {
    padding: 1rem;
  }

  /* small screens: collapse sliding panel */
  @media (max-width: 1547px) {
    width: ${(p) =>
      p.isOpen ? "100%" : "auto"}; /* full width when open, auto when closed */
    justify-content: ${(p) => (p.isOpen ? "flex-start" : "center")};

    ul {
      flex-direction: column;
      width: 100%;
      overflow: hidden;
      max-height: ${(p) => (p.isOpen ? "1000px" : "0")};
      opacity: ${(p) => (p.isOpen ? "1" : "0")};
      padding: 0;
      margin-top: 0;
      background: transparent;
    }

    a {
      display: block;
      padding: 8px 12px;
    }
  }

  /* desktop: always show items inline */
  @media (min-width: 1547px) {
    width: auto;
    ul {
      flex-direction: row;
      opacity: 1;
      max-height: none;
    }
  }
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
  z-index: 3; /* ensure it's above the nav background */

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
    display: flex; /* show burger on small screens */
  }
`;

const Item = styled.li`
  padding: 6px 8px;
  @media (min-width: 1547px) {
    padding: 6px 10px;
  }
  text-decoration: none;
  a {
    color: #000;
    font-weight: 600;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`;
