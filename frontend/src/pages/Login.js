import React, { useState } from "react";
import "./Login.css";
import { apiPost } from "../api/api.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    const res = await apiPost("/auth/login", { email, password });

    if (res.token) {
      localStorage.setItem("token", res.token);
      window.location.href = "/jobs";
    } else {
      alert("Invalid login");
    }
  }

  return (
    <div className="login-container">
      <div
        className="login-left"
        style={{ backgroundImage: `url("/vanirimg.png")` }}
      ></div>

      <div className="login-right">
        <div className="login-box">
          <h2>LOGIN</h2>

          <form onSubmit={handleLogin}>
            <label>Username/Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@vanir.com"
              required
            />

            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••"
              required
            />

            <div className="remember-row">
              <input type="checkbox" />
              <span>Remember me</span>
            </div>

            <a href="#" className="forgot-link">
              Forgot Password?
            </a>

            <button type="submit" className="login-btn">
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
