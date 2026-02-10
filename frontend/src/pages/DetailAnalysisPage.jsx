import React, { useEffect, useMemo, useState } from "react";
import { PowerBIEmbedContainer } from "../powerbi/PowerBIEmbedContainer.jsx";
import { useFilters } from "../context/FiltersContext.jsx";

const dummyDetailRows = [
  {
    date: "2025-01-15",
    region: "North",
    channel: "Retail",
    category: "Electronics",
    product: "Premium Headphones",
    customerSegment: "SMB",
    customer: "Alpha Retailers",
    quantity: 10,
    sales: 1200,
    profit: 400
  },
  {
    date: "2025-01-20",
    region: "South",
    channel: "E-Commerce",
    category: "Electronics",
    product: "Wireless Mouse",
    customerSegment: "Retail Consumer",
    customer: "Online Consumer",
    quantity: 25,
    sales: 625,
    profit: 200
  },
  {
    date: "2025-02-05",
    region: "West",
    channel: "Distributor",
    category: "Furniture",
    product: "Standing Desk",
    customerSegment: "Enterprise",
    customer: "Beta Distributors",
    quantity: 5,
    sales: 4500,
    profit: 1800
  },
  {
    date: "2025-02-10",
    region: "East",
    channel: "Retail",
    category: "Furniture",
    product: "Office Chair",
    customerSegment: "SMB",
    customer: "Gamma Stores",
    quantity: 8,
    sales: 1600,
    profit: -200
  }
];

function DemoDetailAnalysis() {
  const { filters } = useFilters();
  const { dateFrom, dateTo } = filters;

  const [topMode, setTopMode] = useState("all"); // "top", "bottom", "all"
  const [topN, setTopN] = useState(10);
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    let data = [...dummyDetailRows];

    if (dateFrom || dateTo) {
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo) : null;
      data = data.filter((r) => {
        const d = new Date(r.date);
        if (fromDate && d < fromDate) return false;
        if (toDate && d > toDate) return false;
        return true;
      });
    }

    if (search) {
      const s = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.product.toLowerCase().includes(s) ||
          r.customer.toLowerCase().includes(s) ||
          r.region.toLowerCase().includes(s)
      );
    }

    data.sort((a, b) => b.sales - a.sales);
    if (topMode === "top") {
      data = data.slice(0, topN);
    } else if (topMode === "bottom") {
      data = data.slice(-topN);
    }

    return data;
  }, [dateFrom, dateTo, topMode, topN, search]);

  return (
    <>
      <div className="demo-filters-row">
        <span className="demo-filters-label">Top/Bottom selector:</span>
        <button
          className={topMode === "top" ? "btn-secondary small active" : "btn-secondary small"}
          onClick={() => setTopMode("top")}
        >
          Top N by Sales
        </button>
        <button
          className={topMode === "bottom" ? "btn-secondary small active" : "btn-secondary small"}
          onClick={() => setTopMode("bottom")}
        >
          Bottom N by Sales
        </button>
        <button
          className={topMode === "all" ? "btn-secondary small active" : "btn-secondary small"}
          onClick={() => setTopMode("all")}
        >
          All
        </button>
        <input
          type="number"
          min={1}
          max={50}
          value={topN}
          onChange={(e) => setTopN(Number(e.target.value) || 10)}
          className="demo-input-number"
        />
        <span className="demo-filters-label">Search:</span>
        <input
          type="text"
          placeholder="Product, customer, region..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="demo-input-text"
        />
      </div>

      <div className="demo-card demo-card-fullwidth">
        <div className="demo-card-title">Detailed Sales (dummy)</div>
        <div className="demo-table wide">
          <div className="demo-table-header">
            <div>Date</div>
            <div>Region</div>
            <div>Channel</div>
            <div>Category</div>
            <div>Product</div>
            <div>Segment</div>
            <div>Customer</div>
            <div className="right">Qty</div>
            <div className="right">Sales</div>
            <div className="right">Profit</div>
            <div className="right">Margin %</div>
          </div>
          {rows.map((r, idx) => {
            const marginPct = r.sales ? (r.profit / r.sales) * 100 : 0;
            const profitClass = r.profit < 0 ? "negative" : "positive";
            return (
              <div key={idx} className="demo-table-row">
                <div>{r.date}</div>
                <div>{r.region}</div>
                <div>{r.channel}</div>
                <div>{r.category}</div>
                <div>{r.product}</div>
                <div>{r.customerSegment}</div>
                <div>{r.customer}</div>
                <div className="right">{r.quantity}</div>
                <div className="right">
                  {r.sales.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                </div>
                <div className={`right profit ${profitClass}`}>
                  {r.profit.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                </div>
                <div className={`right margin ${profitClass}`}>
                  {marginPct.toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
        <div className="demo-subtext" style={{ marginTop: "0.5rem" }}>
          Hint: In Power BI, this table would be exportable to Excel/CSV with full row-level detail
          matching the filters and Top/Bottom selection.
        </div>
      </div>
    </>
  );
}

export function DetailAnalysisPage() {
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
        const res = await fetch("/api/powerbi/embed-config?reportName=DetailedAnalysis", {
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
            "Showing Detailed Analysis with dummy data. Connect Power BI later to export and pivot live transaction-level details."
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
      <h2 className="page-title">Detailed Analysis</h2>
      <p className="page-subtitle">
        Export-ready detailed tables with conditional formatting and advanced filters.
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
        <DemoDetailAnalysis />
      )}
    </div>
  );
}
