import { useState, useEffect } from "react";
import { Card } from "../ui/Card";
import styled from "styled-components";

export function ChangeRates() {
  const [siteTypes, setSiteTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchSiteTypes();
  }, []);

  const fetchSiteTypes = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/admin/site-types", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch site types");
      const data = await res.json();
      console.log(data);

      // Convert rate strings to numbers
      const numericData = data.map((s) => ({
      siteTypeId: s.siteTypeId || s.sitetypeid,
      name: s.name,
      rate: Number(s.rate || 0),
    }));
    setSiteTypes(numericData);
      setSiteTypes(numericData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

const handleRateChange = async (siteTypeId, newRate) => {

  // Convert to number and validate
  const parsedRate = parseFloat(newRate);
  if (isNaN(parsedRate) || parsedRate < 0) return;

  console.log("TEST:"+siteTypeId);
  setUpdatingId(siteTypeId);
  setError(null);
  setMessage(null);

  try {
    const res = await fetch(
      `http://localhost:3000/admin/change-site-rate`,
      {
        method: "POST", // changed from PUT to POST
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sitetype: siteTypeId, // send the siteTypeId as sitetype
          rate: parsedRate,
        }),
      }
    );

    const data = await res.json();

    // Handle errors from backend
    if (!res.ok) throw new Error(data.error || "Could not update rate");

    // Success message
    setMessage(`Rate updated for ${data.sitetype} to $${parsedRate.toFixed(2)}`);

    // Update local state so the table shows the new rate
    setSiteTypes(
      siteTypes.map((s) =>
        s.siteTypeId === siteTypeId ? { ...s, rate: parsedRate } : s
      )
    );
  } catch (err) {
    setError(err.message);
  } finally {
    setUpdatingId(null);
  }
};


  if (loading) return <Card><p>Loading site types...</p></Card>;

  return (
    <Card>
      <h2>Manage Site Rates</h2>
      <p>Update the rates for each site type below.</p>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {message && <SuccessMessage>{message}</SuccessMessage>}

      <SiteTable>
        <thead>
          <tr>
            <th>Site Type</th>
            <th>Current Rate ($)</th>
            <th>Update Rate</th>
          </tr>
        </thead>
        <tbody>
          {siteTypes.map((site) => (
            <tr key={site.siteTypeId}>
              <td>{site.name}</td>
              <td>${(site.rate || 0).toFixed(2)}</td>
              <td>
                <RateInput
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={site.rate}
                  onBlur={(e) => handleRateChange(site.siteTypeId, e.target.value)}
                  disabled={updatingId === site.siteTypeId}
                />
                {updatingId === site.siteTypeId && <span> Updating...</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </SiteTable>
    </Card>
  );
}


const SiteTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;

  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #dee2e6;
  }

  th {
    background-color: #f8f9fa;
    font-weight: 600;
  }

  tr:hover {
    background-color: #f8f9fa;
  }
`;

const RateInput = styled.input`
  padding: 0.375rem 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  width: 100px;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.p`
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
`;

const SuccessMessage = styled.p`
  color: #155724;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
`;
