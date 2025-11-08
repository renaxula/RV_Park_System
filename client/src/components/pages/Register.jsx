
import { Card } from "../ui/Card";

export function Register() {
  return (
    <Card>
      <h2>Register Page</h2>
      <form>
        <label>
          Username:
          <input type="text" name="username" />
        </label>
        <br />
        <label>
          Password:
          <input type="password" name="password" />
        </label>
        <label>
          Confirm Password:
          <input type="password" name="confirmPassword" />
        </label>
        <label>
          Rank:
          <input type="text" name="rank" />
        </label>
        <br />
        <button type="submit">Register</button>
      </form>
    </Card>
  )
}