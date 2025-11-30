import { useState, useEffect} from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Card } from "../ui/Card";
import { useAuth } from "../router/AuthContext";
import styled from "styled-components";
import { StyledButton } from "../ui/StyledButton";
import { MapAndRules } from "../pages/MapAndRules"

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
        navigate('/customer-dash');
      }else if(user.role === 'employee'){
        navigate('/employee-dash')
      }
    }
    return () => {
      setError(null);
    }
  }, [user]);

  if (isAuthenticated) {
    return <LoginCard><p>You are already signed in.</p></LoginCard>;
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


  return (<>
    <LoginCard>
      <Title>Login</Title>
      <Form onSubmit={handleSubmit}>
        <Fields>
        <Label>
          Username
          <Input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </Label>
        <Label>
          Password
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Label>
        </Fields>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <LoginButtonContainer>
          <StyledButton type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Login"}
          </StyledButton>
        </LoginButtonContainer>
        <p>No account? <StyledLink to="/register">Register</StyledLink></p>
      </Form>
    </LoginCard>
    <MapAndRules/>
  </>);
}


const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Title = styled.h2`
  margin: 0 0 4px 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #0f172a;
`;


const Label = styled.label`
  font-size: 0.875rem;
  color: #475569;
  font-weight: 600;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #fff;
  color: #0f172a;
  font-size: 0.95rem;
  transition: box-shadow 160ms ease, border-color 160ms ease;
  box-shadow: 0 1px 0 rgba(2,6,23,0.02);

  &:focus {
    outline: none;
    border-color: rgba(59,130,246,0.9);
    box-shadow: 0 6px 18px rgba(59,130,246,0.08);
  }
`;


const LoginCard = styled(Card)`
  width: 40%;
  p {
    text-align: center;
  }
`;

const Fields = styled.div`
  display: flex;
  gap: 1rem;
`;

const StyledLink = styled(Link)`
  color: #4077d1ff;
`;

const LoginButtonContainer = styled.div`
  margin: auto;
  width: 100%;
  text-align: center;
`;