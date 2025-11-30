import CurrentOccupied from "../reports/CurrentOccupied";
import { Card } from "../ui/Card";
import styled from "styled-components";

export function OccupiedSitesReport({date}) {
  return (
    <Card>
      <h2>Occupied Sites Report</h2>
      <Table>
        <thead>
          <tr>
            <Th>Last Name</Th>
            <Th>Site</Th>
            <Th>Nights Left</Th>
            <Th>Notes</Th>
          </tr>
        </thead>
        <tbody>
          <CurrentOccupied date={date} />
        </tbody>
      </Table>
    </Card>
  );
}




const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  font-size: 0.95rem;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 10px;
  border-bottom: 2px solid #ddd;
  background: #f8f9fa;
  font-weight: 600;
`;
