import { MakeReservation } from "./MakeReservation";
import { ViewReservations } from "./ViewReservations";
import styled from "styled-components";

export function CustomerDash(){
    return <Layout>
        <MakeReservation/>
        <ViewReservations/>
    </Layout>
}

const Layout = styled.div`
    display: flex;
    width: 100%;
    gap: 1.5rem;
    justify-content: space-between;
`;