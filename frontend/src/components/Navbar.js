import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem("token");
    navigate("/");
  }

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/jobs">Jobs</Link>
        <Link to="/subcontractors">Subcontractors</Link>
        <Link to="/communities">Communities</Link>
        <Link to="/constructionmanagers">Construction Managers</Link>
        <Link to="/materials">Materials</Link>
        <Link to="/dashboard/workloads">Dashboard</Link>
      </div>

      <div className="nav-right">
        <button onClick={logout} className="logout-btn">
          Logout
        </button>
      </div>
    </nav>
  );
}
