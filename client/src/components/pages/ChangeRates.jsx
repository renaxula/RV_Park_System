import { useState, useEffect } from "react";
import { Card } from "../ui/Card";
import styled from "styled-components";

const API_BASE =
  import.meta?.env?.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:3000";

export function SiteRates() {
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
      const res = await fetch(`${API_BASE}/admin/site-types`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch site types");
      const data = await res.json();
      setSiteTypes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRateChange = async (siteTypeId, newRate) => {
    setUpdatingId(siteTypeId);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE}/admin/site-types/${siteTypeId}/rate`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate: parseFloat(newRate) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update rate");

      setMessage(`Rate updated for ${data.name} to $${newRate}`);
      // Update local state
      setSiteTypes(siteTypes.map(s =>
        s.siteTypeId === siteTypeId ? { ...s, rate: parseFloat(newRate) } : s
      ));
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
              <td>${site.rate.toFixed(2)}</td>
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
