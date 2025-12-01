import { useState, useEffect } from "react";
import useApiReports from "./useApiReports";

const CurrentOccupied = (props) => {
  const [rows, setRows] = useState([]);
  const { isLoading, error, sendRequest: fetchSites } = useApiReports();

  let filter = "";
  if (props.filter && props.filter !== "") {
    filter = `?date=${props.filter}`;
    console.log(filter);
  }

  useEffect(() => {
    async function loadAvailability() {
      fetchSites(
        { url: `http://localhost:3000/api/occupied${filter}` },
        setRows
      );
      // //add '?date=YYYY-MM-DD' to get day other than today
      // //example: ...occupied?date=2025-11-14
    }

    loadAvailability();
    console.log("api Loaded");
  }, [filter]);

  console.log(rows);
  return (
    <>
      {rows.length == 0 ? (
        <tr>
          <td>No Occupied Sites </td>
        </tr>
      ) : (
        rows.map((row) => (
          <tr key={row.siteid}>
            <td>{row.lastname}</td>
            <td>{row.siteid}</td>
            <td>{row.daysleft}</td>
            <td>{row.notes}</td>
          </tr>
        ))
      )}
    </>
  );
};




export default CurrentOccupied;
