import { MakeReservation } from "./MakeReservation";
import { MapAndRules } from "./MapAndRules";
import styled from "styled-components";
import { Reports } from "../cards/Reports";

export function EmployeeDash(){
    return <>
            <Reports/>
        <Layout>
            <MakeReservation/>
        </Layout>
        <MapAndRules/>
    </>
}

const Layout = styled.div`
    display: flex;
    width: 100%;
    gap: 1.5rem;
    justify-content: space-between;
`;