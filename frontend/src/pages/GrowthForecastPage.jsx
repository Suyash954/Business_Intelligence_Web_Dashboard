import React, { useEffect, useMemo, useState } from "react";
import { PowerBIEmbedContainer } from "../powerbi/PowerBIEmbedContainer.jsx";
import { useFilters } from "../context/FiltersContext.jsx";

const dummyGrowthData = [
  { month: "Jan 2024", date: "2024-01-15", sales: 100000 },
  { month: "Feb 2024", date: "2024-02-15", sales: 105000 },
  { month: "Mar 2024", date: "2024-03-15", sales: 98000 },
  { month: "Apr 2024", date: "2024-04-15", sales: 110000 },
  { month: "May 2024", date: "2024-05-15", sales: 115000 },
  { month: "Jun 2024", date: "2024-06-15", sales: 120000 },
  { month: "Jan 2025", date: "2025-01-15", sales: 120000 },
  { month: "Feb 2025", date: "2025-02-15", sales: 135000 },
  { month: "Mar 2025", date: "2025-03-15", sales: 150000 },
  { month: "Apr 2025", date: "2025-04-15", sales: 145000 },
  { month: "May 2025", date: "2025-05-15", sales: 160000 },
  { month: "Jun 2025", date: "2025-06-15", sales: 170000 }
];

function DemoGrowthForecast() {
  const { filters } = useFilters();
  const { dateFrom, dateTo } = filters;

  const series = useMemo(() => {
    let data = [...dummyGrowthData];
    if (dateFrom || dateTo) {
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo) : null;
      data = data.filter((p) => {
        const d = new Date(p.date);
        if (fromDate && d < fromDate) return false;
        if (toDate && d > toDate) return false;
        return true;
      });
    }
    return data;
  }, [dateFrom, dateTo]);

  if (!series.length) {
    return (
      <div className="alert info">
        No dummy growth data in the selected date range. Adjust the date filter to see trends.
      </div>
    );
  }

  const indexed = series.map((point, idx) => {
    const prev = series[idx - 1];
    const prevYear = dummyGrowthData.find(
      (p) => p.month.startsWith(point.month.split(" ")[0]) && p.date.startsWith("2024-")
    );
    const mom =
      prev && prev.sales ? ((point.sales - prev.sales) / prev.sales) * 100 : undefined;
    const yoy =
      prevYear && prevYear.sales
        ? ((point.sales - prevYear.sales) / prevYear.sales) * 100
        : undefined;
    return {
      ...point,
      mom,
      yoy,
      runningTotal: idx === 0 ? point.sales : series[idx - 1].runningTotal + point.sales
    };
  });

  const maxSales = Math.max(...indexed.map((x) => x.sales));
  const maxRunning = Math.max(...indexed.map((x) => x.runningTotal));
  const maxAbsGrowth = Math.max(
    ...indexed
      .map((x) => [Math.abs(x.mom || 0), Math.abs(x.yoy || 0)])
      .flat()
      .filter((x) => !Number.isNaN(x)),
    0
  );

  const last = indexed[indexed.length - 1];
  const yoyLast = last.yoy ?? 0;
  const momLast = last.mom ?? 0;

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Latest Month Sales</div>
          <div className="kpi-value">
            {last.sales.toLocaleString("en-US", { style: "currency", currency: "USD" })}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">YoY Growth (latest)</div>
          <div className={`kpi-value ${yoyLast >= 0 ? "positive" : "negative"}`}>
            {yoyLast >= 0 ? "+" : ""}
            {yoyLast.toFixed(1)}%
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">MoM Growth (latest)</div>
          <div className={`kpi-value ${momLast >= 0 ? "positive" : "negative"}`}>
            {momLast >= 0 ? "+" : ""}
            {momLast.toFixed(1)}%
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Running Total</div>
          <div className="kpi-value">
            {last.runningTotal.toLocaleString("en-US", { style: "currency", currency: "USD" })}
          </div>
        </div>
      </div>

      <div className="demo-charts-grid demo-charts-grid-2col">
        <div className="demo-card">
          <div className="demo-card-title">Sales vs Running Total (dummy)</div>
          <div className="demo-line-chart">
            {indexed.map((p) => {
              const heightSales = maxSales ? (p.sales / maxSales) * 100 : 0;
              const heightRun = maxRunning ? (p.runningTotal / maxRunning) * 100 : 0;
              return (
                <div key={p.month} className="demo-line-point">
                  <div className="demo-line-column">
                    <div className="demo-line-bar sales" style={{ height: `${heightSales}%` }} />
                    <div className="demo-line-bar running" style={{ height: `${heightRun}%` }} />
                  </div>
                  <div className="demo-bar-label">{p.month.split(" ")[0]}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="demo-card">
          <div className="demo-card-title">MoM & YoY Growth % (dummy)</div>
          <div className="demo-bar-horizontal">
            {indexed.map((p) => {
              const momRatio = maxAbsGrowth ? (Math.abs(p.mom || 0) / maxAbsGrowth) * 100 : 0;
              const yoyRatio = maxAbsGrowth ? (Math.abs(p.yoy || 0) / maxAbsGrowth) * 100 : 0;
              return (
                <div key={p.month} className="demo-bar-row growth-row">
                  <div className="demo-bar-row-label">{p.month}</div>
                  <div className="demo-bar-row-track dual">
                    <div
                      className={
                        "demo-bar-row-fill growth mom " + ((p.mom || 0) >= 0 ? "positive" : "negative")
                      }
                      style={{ width: `${momRatio}%` }}
                    />
                    <div
                      className={
                        "demo-bar-row-fill growth yoy " + ((p.yoy || 0) >= 0 ? "positive" : "negative")
                      }
                      style={{ width: `${yoyRatio}%` }}
                    />
                  </div>
                  <div className="demo-bar-row-value">
                    <div className="demo-subtext">
                      MoM: {p.mom !== undefined ? p.mom.toFixed(1) + "%" : "n/a"}
                    </div>
                    <div className="demo-subtext">
                      YoY: {p.yoy !== undefined ? p.yoy.toFixed(1) + "%" : "n/a"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="demo-card demo-card-fullwidth">
          <div className="demo-card-title">How to interpret anomalies & forecast</div>
          <ul className="demo-text-list">
            <li>
              Sudden drops of more than 15–20% MoM (red bars) should trigger a check on promotions,
              pricing changes, or supply constraints.
            </li>
            <li>
              Strong positive YoY with flat or improving margin suggests **healthy growth**; positive
              YoY with shrinking margin may indicate **discount-driven growth**.
            </li>
            <li>
              In the real Power BI report, a forecast line would extend this trend 3–6 months and
              highlight where actuals fall outside the expected confidence band.
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}

export function GrowthForecastPage() {
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
        const res = await fetch("/api/powerbi/embed-config?reportName=GrowthForecast", {
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
          setInfo(
            "Showing Growth & Forecast with dummy data. Connect Power BI later to see live YoY/MoM trends and forecasts."
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
      <h2 className="page-title">Growth &amp; Forecast</h2>
      <p className="page-subtitle">
        Year-over-year and month-over-month trends, running totals, and forecast interpretation.
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
        <DemoGrowthForecast />
      )}
    </div>
  );
}
