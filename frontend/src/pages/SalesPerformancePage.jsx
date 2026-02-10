import React, { useEffect, useState } from "react";
import { PowerBIEmbedContainer } from "../powerbi/PowerBIEmbedContainer.jsx";

// Dummy data for the Sales Performance demo UI
const dummyProducts = [
  { category: "Electronics", product: "Premium Headphones", sales: 120000, profit: 36000 },
  { category: "Electronics", product: "Wireless Mouse", sales: 65000, profit: 19500 },
  { category: "Furniture", product: "Standing Desk", sales: 90000, profit: 38000 },
  { category: "Furniture", product: "Office Chair", sales: 70000, profit: 24000 }
];

const dummyRegions = ["North", "South", "East", "West"];
const dummyChannels = [
  { channel: "Retail", sales: 160000, profit: 52000 },
  { channel: "E-Commerce", sales: 110000, profit: 33000 },
  { channel: "Distributor", sales: 80000, profit: 21000 }
];

const dummyRegionProduct = [
  { region: "North", product: "Premium Headphones", sales: 40000 },
  { region: "North", product: "Standing Desk", sales: 30000 },
  { region: "South", product: "Premium Headphones", sales: 20000 },
  { region: "South", product: "Office Chair", sales: 25000 },
  { region: "East", product: "Wireless Mouse", sales: 30000 },
  { region: "West", product: "Standing Desk", sales: 20000 }
];

function DemoSalesPerformance() {
  const [sortBy, setSortBy] = useState("sales");

  const sortedProducts = [...dummyProducts].sort((a, b) => {
    if (sortBy === "profit") return b.profit - a.profit;
    if (sortBy === "margin") return b.profit / b.sales - a.profit / a.sales;
    return b.sales - a.sales;
  });

  const maxSales = Math.max(...sortedProducts.map((p) => p.sales));

  return (
    <>
      <div className="demo-filters-row">
        <span className="demo-filters-label">Sort products by:</span>
        <button
          className={sortBy === "sales" ? "btn-secondary small active" : "btn-secondary small"}
          onClick={() => setSortBy("sales")}
        >
          Sales
        </button>
        <button
          className={sortBy === "profit" ? "btn-secondary small active" : "btn-secondary small"}
          onClick={() => setSortBy("profit")}
        >
          Profit
        </button>
        <button
          className={sortBy === "margin" ? "btn-secondary small active" : "btn-secondary small"}
          onClick={() => setSortBy("margin")}
        >
          Margin %
        </button>
      </div>

      <div className="demo-charts-grid demo-charts-grid-2col">
        <div className="demo-card">
          <div className="demo-card-title">Product-wise Sales (dummy)</div>
          <div className="demo-bar-horizontal">
            {sortedProducts.map((p) => {
              const widthPct = maxSales ? (p.sales / maxSales) * 100 : 0;
              const marginPct = p.sales ? (p.profit / p.sales) * 100 : 0;
              return (
                <div key={p.product} className="demo-bar-row">
                  <div className="demo-bar-row-label">
                    <div>{p.product}</div>
                    <div className="demo-subtext">{p.category}</div>
                  </div>
                  <div className="demo-bar-row-track">
                    <div className="demo-bar-row-fill" style={{ width: `${widthPct}%` }} />
                  </div>
                  <div className="demo-bar-row-value">
                    {p.sales.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                    <div className="demo-subtext">Margin {marginPct.toFixed(1)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="demo-card">
          <div className="demo-card-title">Sales by Channel (dummy)</div>
          <div className="demo-bar-horizontal">
            {dummyChannels.map((c) => {
              const widthPct = Math.max(...dummyChannels.map((x) => x.sales))
                ? (c.sales / Math.max(...dummyChannels.map((x) => x.sales))) * 100
                : 0;
              const marginPct = c.sales ? (c.profit / c.sales) * 100 : 0;
              return (
                <div key={c.channel} className="demo-bar-row">
                  <div className="demo-bar-row-label">{c.channel}</div>
                  <div className="demo-bar-row-track">
                    <div className="demo-bar-row-fill" style={{ width: `${widthPct}%` }} />
                  </div>
                  <div className="demo-bar-row-value">
                    {c.sales.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                    <div className="demo-subtext">Margin {marginPct.toFixed(1)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="demo-card demo-card-fullwidth">
          <div className="demo-card-title">Region vs Product (dummy)</div>
          <div className="demo-table">
            <div className="demo-table-header">
              <div>Region</div>
              <div>Product</div>
              <div className="right">Sales</div>
            </div>
            {dummyRegionProduct.map((row, idx) => (
              <div key={`${row.region}-${row.product}-${idx}`} className="demo-table-row">
                <div>{row.region}</div>
                <div>{row.product}</div>
                <div className="right">
                  {row.sales.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export function SalesPerformancePage() {
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
        const res = await fetch("/api/powerbi/embed-config?reportName=SalesPerformance", {
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
            "Showing interactive Sales Performance with dummy data. Connect Power BI later to see live performance by product, region, and channel."
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
      <h2 className="page-title">Sales Performance</h2>
      <p className="page-subtitle">
        Product-wise and region-wise performance, with drill-down and drill-through.
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
        <DemoSalesPerformance />
      )}
    </div>
  );
}


