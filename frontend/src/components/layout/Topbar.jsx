import React from "react";
import { useFilters } from "../../context/FiltersContext.jsx";

export function Topbar() {
  const { filters, updateFilters, resetFilters } = useFilters();

  const onDateChange = (e) => {
    const { name, value } = e.target;
    updateFilters({ [name]: value || null });
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">Sales &amp; Growth Analytics</h1>
      </div>
      <div className="topbar-filters">
        <div className="filter-group">
          <label className="filter-label">From</label>
          <input
            type="date"
            name="dateFrom"
            value={filters.dateFrom || ""}
            onChange={onDateChange}
          />
        </div>
        <div className="filter-group">
          <label className="filter-label">To</label>
          <input
            type="date"
            name="dateTo"
            value={filters.dateTo || ""}
            onChange={onDateChange}
          />
        </div>
        <button className="btn-secondary small" onClick={resetFilters}>
          Reset
        </button>
      </div>
    </header>
  );
}

