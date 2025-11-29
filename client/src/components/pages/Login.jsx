import { useState, useEffect} from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Card } from "../ui/Card";
import { useAuth } from "../router/AuthContext";

export function Login() {
  const { login, setError, error, isAuthenticated, user } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";


  useEffect(() => {
    if(user !== null){
      if(user.role === 'customer'){
        console.log('Navigating'); 
        navigate('/customer-dash');
      }
    }
  }, [user]);

  if (isAuthenticated) {
    return <Card><p>You are already signed in.</p></Card>;
  }



  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login({ username, password });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <Card>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Login"}
        </button>
      </form>
      <p>No account? <Link to="/register">Register</Link></p>
    </Card>
  );
}
