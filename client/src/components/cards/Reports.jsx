import { OccupiedSitesReport } from "../pages/OccupiedSitesReport";
import { OpenSitesReport } from "../pages/OpenSitesReport";
import styled from "styled-components";
import { Card } from "../ui/Card";
import { useState } from "react";

export function Reports() {
  const [date, setDate] = useState(new Date());

    const incrementDate = () => {
        setDate(prev => {
            const d = new Date(prev);
            d.setDate(d.getDate() + 1);
            return d;
        });
    };

    const decrementDate = () => {
        setDate(prev => {
            const d = new Date(prev);
            d.setDate(d.getDate() - 1);
            return d;
        });
    };


  return (
    <>
      <DateCard>
        <ArrowLeft onClick={decrementDate}/>
        <h2>{date.toISOString().split("T")[0]}</h2>
        <ArrowRight onClick={incrementDate}/>
      </DateCard>
      <Layout>
        <OccupiedSitesReport date={date.toISOString().split("T")[0]}/>
        <OpenSitesReport date={date.toISOString().split("T")[0]}/>
      </Layout>
    </>
  );
}

const Layout = styled.div`
  display: flex;
  gap: 1rem;
  width: 100%;
`;

const DateCard = styled(Card)`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2rem;
`;

const ArrowLeft = (props) => (
  <ArrowContainer {...props}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="#4077d1ff"
      className="bi bi-arrow-left"
      viewBox="0 0 16 16"
    >
      <path
        fillRule="evenodd"
        d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8"
      />
    </svg>
  </ArrowContainer>
);

const ArrowRight = (props) => (
  <ArrowContainer {...props}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="#4077d1ff"
      className="bi bi-arrow-right"
      viewBox="0 0 16 16"
    >
      <path
        fillRule="evenodd"
        d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"
      />
    </svg>
  </ArrowContainer>
);

const ArrowContainer = styled.div`
  border: 2px solid #4077d1ff;
  max-width: 100%;
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
