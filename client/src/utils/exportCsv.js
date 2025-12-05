/**
 * Converts an array of objects to CSV format and triggers a download
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 * @param {Array} columns - Array of { key, header } to define column order and headers
 */
export function exportToCsv(data, filename, columns) {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  // Build header row
  const headers = columns.map((col) => col.header);

  // Build data rows
  const rows = data.map((row) =>
    columns.map((col) => {
      const value = row[col.key];
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      const stringValue = value == null ? "" : String(value);
      if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n")
      ) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    })
  );

  // Combine headers and rows
  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
    "\n"
  );

  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}




