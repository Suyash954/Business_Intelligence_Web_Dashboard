import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">Sales &amp; Growth</div>
        {user && <div className="user-role">{user.role}</div>}
      </div>
      <nav className="sidebar-nav">
        <NavLink end to="/" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
          Executive Overview
        </NavLink>
        <NavLink
          to="/sales-performance"
          className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
        >
          Sales Performance
        </NavLink>
        <NavLink
          to="/growth-forecast"
          className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
        >
          Growth &amp; Forecast
        </NavLink>
        <NavLink
          to="/details"
          className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
        >
          Detailed Analysis
        </NavLink>
      </nav>
      <div className="sidebar-footer">
        <button className="btn-secondary" onClick={logout}>
          Logout
        </button>
      </div>
    </aside>
  );
}

