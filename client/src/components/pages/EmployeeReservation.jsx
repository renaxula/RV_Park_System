export function EmployeeReservation() {
  return (
    <div>
      <h2>Employee: Make / Edit Reservation</h2>
      <form>
        <label>
          Customer Email or ID:
          <input type="text" name="customer" />
        </label>
        <br />
        <label>
          Start Date:
          <input type="date" name="startDate" />
        </label>
        <label>
          End Date:
          <input type="date" name="endDate" />
        </label>
        <br />
        <label>
          Site Preference (optional):
          <input type="text" name="site" />
        </label>
        <br />
        <button type="submit">Create / Update Reservation</button>
      </form>
    </div>
  );
}
