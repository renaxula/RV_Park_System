import { Card } from "../ui/Card";

export function ChangePassword() {
  return (
    <Card>
      <h2>Change Your Password</h2>
      <form>
        <label>
          Current Password:
          <input type="password" name="currentPassword" />
        </label>
        <br />
        <label>
          New Password:
          <input type="password" name="newPassword" />
        </label>
        <br />
        <label>
          Confirm New Password:
          <input type="password" name="confirmPassword" />
        </label>
        <br />
        <button type="submit">Change Password</button>
      </form>
    </Card>
  );
}
