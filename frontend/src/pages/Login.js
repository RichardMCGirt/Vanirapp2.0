// src/pages/Login.js
import React, { useState } from "react";
import "./Login.css"; 
import { apiPost } from "../api/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    try {
      const res = await apiPost("/auth/login", { email, password });

      if (res.token) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("userName", res.user?.name || "");
        localStorage.setItem("userEmail", res.user?.email || "");

        window.location.href = "/jobs";
      } else {
        setError("Invalid login. Please check your credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid email or password.");
    }
  }

  return (
    <div className="login-container">

      {/* LEFT PANEL (background image) */}
      <div
        className="login-left"
        style={{ backgroundImage: `url("/vanirimg.png")` }}
      >
        <div className="welcome-title">Welcome to Admin Portal</div>
      </div>

      {/* RIGHT PANEL - form area */}
      <div className="login-right">
        <div className="login-box">
          <h2>LOGIN</h2>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleLogin}>

            <label>Email</label>
            <input
              type="text"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit">Login</button>
          </form>
        </div>
      </div>
    </div>
  );
}
