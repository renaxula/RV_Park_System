// ...existing code...
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

// ...existing code...
export function NavMenu() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    // keep menu visible on wide screens, collapsed on small screens
    const handleResize = () => {
      if (window.innerWidth > 768) setOpen(true);
      else setOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/admin">Admin</Link>
          </li>
          <li>
            <Link to="/available-spots">Available Spots</Link>
          </li>
          <li>
            <Link to="/make-reservation">Make Reservation</Link>
          </li>
          <li>
            <Link to="/employee-reservation">Employee Reservation</Link>
          </li>
          <li>
            <Link to="/view-reservations">View Reservations</Link>
          </li>
          <li>
            <Link to="/change-rates">Change Rates</Link>
          </li>
          <li>
            <Link to="/change-password">Change Password</Link>
          </li>
          <li>
            <Link to="/reset-password">Reset Password</Link>
          </li>
          <li>
            <Link to="/register">Register</Link>
          </li>
          <li>
            <Link to="/elevate-demote">Elevate/Demote</Link>
          </li>
          <li>
            <Link to="/map-and-rules">Map & Rules</Link>
          </li>
          <li>
            <Link to="/occupied-report">Occupied Report</Link>
          </li>
          <li>
            <Link to="/open-report">Open Report</Link>
          </li>
        </ul>
      )}
    </NavMenuStyled>
  );
}
const NavMenuStyled = styled.nav`
  /* base */
  display: inline-flex; /* shrink to content by default */
  align-items: flex-start;
  background-color: #fff;
  padding: ${p => (p.isOpen ? "1rem" : "0.75rem")}; /* small padding when closed */
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

  /* small screens: collapse sliding panel */
  @media (max-width: 768px) {
    width: ${p => (p.isOpen ? "100%" : "auto")}; /* full width when open, auto when closed */
    justify-content: ${p => (p.isOpen ? "flex-start" : "center")};

    ul {
      flex-direction: column;
      width: 100%;
      overflow: hidden;
      max-height: ${p => (p.isOpen ? "1000px" : "0")};
      opacity: ${p => (p.isOpen ? "1" : "0")};
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
  @media (min-width: 769px) {
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

  @media (max-width: 768px) {
    display: flex; /* show burger on small screens */
  }
`;
