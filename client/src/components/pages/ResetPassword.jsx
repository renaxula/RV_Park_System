export function ResetPassword() {
  return (
    <div>
      <h2>Reset Password</h2>
      <form>
        <label>
          Account Email or Username:
          <input type="text" name="account" />
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
        <button type="submit">Reset Password</button>
      </form>
    </div>
  );
}
