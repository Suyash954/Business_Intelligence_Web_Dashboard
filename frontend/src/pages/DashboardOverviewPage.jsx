import React, { useEffect, useState } from "react";
import { PowerBIEmbedContainer } from "../powerbi/PowerBIEmbedContainer.jsx";
import { useFilters } from "../context/FiltersContext.jsx";

// Simple dummy dataset for the Executive Overview demo layout.
const dummyExecutiveData = [
  { month: "Jan 2025", date: "2025-01-15", sales: 120000, profit: 36000 },
  { month: "Feb 2025", date: "2025-02-15", sales: 135000, profit: 40500 },
  { month: "Mar 2025", date: "2025-03-15", sales: 150000, profit: 43500 },
  { month: "Apr 2025", date: "2025-04-15", sales: 145000, profit: 42000 },
  { month: "May 2025", date: "2025-05-15", sales: 160000, profit: 48000 },
  { month: "Jun 2025", date: "2025-06-15", sales: 170000, profit: 51000 }
];

const dummyByRegion = [
  { region: "North", sales: 140000 },
  { region: "South", sales: 110000 },
  { region: "East", sales: 90000 },
  { region: "West", sales: 75000 }
];

const dummyByChannel = [
  { channel: "Retail", sales: 180000 },
  { channel: "E-Commerce", sales: 140000 },
  { channel: "Distributor", sales: 95000 }
];

function DemoExecutiveOverview() {
  const { filters } = useFilters();
  const { dateFrom, dateTo } = filters;
  const [windowSize, setWindowSize] = useState(6); // last N months

  let series = dummyExecutiveData;

  if (dateFrom || dateTo) {
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;

    series = dummyExecutiveData.filter((point) => {
      const d = new Date(point.date);
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      return true;
    });
  } else {
    series = dummyExecutiveData.slice(-windowSize);
  }

  if (!series.length) {
    return (
      <div className="alert info">
        No dummy data in the selected date range. Clear the date filter or pick a wider range.
      </div>
    );
  }
  const totalSales = series.reduce((sum, x) => sum + x.sales, 0);
  const totalProfit = series.reduce((sum, x) => sum + x.profit, 0);
  const marginPct = totalSales ? (totalProfit / totalSales) * 100 : 0;

  const last = series[series.length - 1];
  const prev = series[series.length - 2];
  const momGrowthPct =
    last && prev && prev.sales ? ((last.sales - prev.sales) / prev.sales) * 100 : 0;

  const maxSales = Math.max(...series.map((x) => x.sales));

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Sales</div>
          <div className="kpi-value">
            {totalSales.toLocaleString("en-US", { style: "currency", currency: "USD" })}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Profit</div>
          <div className="kpi-value">
            {totalProfit.toLocaleString("en-US", { style: "currency", currency: "USD" })}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Profit Margin</div>
          <div className="kpi-value">{marginPct.toFixed(1)}%</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">MoM Growth</div>
          <div className={`kpi-value ${momGrowthPct >= 0 ? "positive" : "negative"}`}>
            {momGrowthPct >= 0 ? "+" : ""}
            {momGrowthPct.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="demo-filters-row">
        <span className="demo-filters-label">Time window:</span>
        <button
          className={windowSize === 3 ? "btn-secondary small active" : "btn-secondary small"}
          onClick={() => setWindowSize(3)}
        >
          Last 3 months
        </button>
        <button
          className={windowSize === 6 ? "btn-secondary small active" : "btn-secondary small"}
          onClick={() => setWindowSize(6)}
        >
          Last 6 months
        </button>
      </div>

      <div className="demo-charts-grid">
        <div className="demo-card">
          <div className="demo-card-title">Sales Trend (dummy)</div>
          <div className="demo-bar-chart">
            {series.map((point) => {
              const heightPct = maxSales ? (point.sales / maxSales) * 100 : 0;
              return (
                <div key={point.month} className="demo-bar-wrapper">
                  <div className="demo-bar" style={{ height: `${heightPct}%` }} />
                  <div className="demo-bar-label">{point.month.split(" ")[0]}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="demo-card">
          <div className="demo-card-title">Sales by Region (dummy)</div>
          <div className="demo-bar-horizontal">
            {dummyByRegion.map((item) => {
              const widthPct = Math.max(...dummyByRegion.map((r) => r.sales))
                ? (item.sales / Math.max(...dummyByRegion.map((r) => r.sales))) * 100
                : 0;
              return (
                <div key={item.region} className="demo-bar-row">
                  <div className="demo-bar-row-label">{item.region}</div>
                  <div className="demo-bar-row-track">
                    <div className="demo-bar-row-fill" style={{ width: `${widthPct}%` }} />
                  </div>
                  <div className="demo-bar-row-value">
                    {item.sales.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="demo-card">
          <div className="demo-card-title">Sales by Channel (dummy)</div>
          <div className="demo-pill-list">
            {dummyByChannel.map((item) => (
              <div key={item.channel} className="demo-pill">
                <div className="demo-pill-label">{item.channel}</div>
                <div className="demo-pill-value">
                  {item.sales.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export function DashboardOverviewPage() {
  const [config, setConfig] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setError("");
        setInfo("");
        const authUserRaw = localStorage.getItem("authUser");
        if (!authUserRaw) {
          setError("Not authenticated");
          return;
        }
        const authUser = JSON.parse(authUserRaw);
        const res = await fetch("/api/powerbi/embed-config?reportName=ExecutiveOverview", {
          headers: {
            Authorization: `Bearer ${authUser.token}`
          }
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Failed to load embed config");
        }
        const data = await res.json();

        if (data.demoMode || !data.embedUrl || !data.accessToken || !data.reportId) {
          setConfig(null);
          // Friendlier, non-technical note for demo mode
          setInfo(
            "Showing interactive Executive Overview with dummy data. Connect Power BI later to see live metrics."
          );
          return;
        }

        setConfig(data);
      } catch (err) {
        setError(err.message || "Error loading dashboard");
      }
    };
    loadConfig();
  }, []);

  return (
    <div className="page">
      <h2 className="page-title">Executive Overview</h2>
      <p className="page-subtitle">
        High-level view of revenue, profit, and growth across all regions and channels.
      </p>
      {error && <div className="alert error">{error}</div>}
      {!config && !error && !info && <div className="loader">Loading Power BI report...</div>}
      {info && !config && !error && <div className="alert info">{info}</div>}
      {config ? (
        <PowerBIEmbedContainer
          embedUrl={config.embedUrl}
          accessToken={config.accessToken}
          reportId={config.reportId}
        />
      ) : (
        <DemoExecutiveOverview />
      )}
    </div>
  );
}
