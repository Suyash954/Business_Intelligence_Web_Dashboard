import React from "react";
import { Link } from "react-router-dom";

export function UnauthorizedPage() {
  return (
    <div className="unauthorized-page">
      <h1>Access denied</h1>
      <p>You do not have permission to view this page.</p>
      <Link className="btn-primary" to="/">
        Go to Dashboard
      </Link>
    </div>
  );
}

