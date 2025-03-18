import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/login", {
        email,
        password,
      });

      console.log("Server response:", res.data);

      // Store the token, username, and email in localStorage
      setToken(res.data.token);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("username", res.data.user.username); // Store username
      localStorage.setItem("email", res.data.user.email); // Store email

      alert(`Welcome, ${res.data.user.username}! 🎉`);
      navigate("/");
    } catch (error) {
      alert("Invalid credentials");
      console.error("Login error:", error.response?.data || error.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn-login" type="submit">
            Login
          </button>
        </form>
        <p className="toggle-form">
          New User? register{" "}
          <a href="/register">
            here
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;