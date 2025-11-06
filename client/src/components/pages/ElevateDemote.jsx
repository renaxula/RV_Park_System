export function ElevateDemote() {
  return (
    <div>
      <h2>Elevate / Demote Accounts</h2>
      <form>
        <label>
          Account Email or Username:
          <input type="text" name="account" />
        </label>
        <br />
        <label>
          New Role:
          <select name="role">
            <option value="customer">Customer</option>
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <br />
        <button type="submit">Change Role</button>
      </form>
    </div>
  );
}
