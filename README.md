Business Intelligence Web Dashboard – Sales & Growth Analytics
=============================================================

## Overview

This is an end-to-end, industry-style Business Intelligence project for a mid-size company selling products across multiple regions and channels. It combines:

- A **SQL star schema** for sales analytics (`sql/schema.sql`)
- A **Power BI semantic model and DAX layer** (documented in this repo and implemented in Power BI Desktop)
- A **Node.js backend API** for authentication and secure Power BI embedding (`backend/`)
- A **React web frontend** with role-based access and embedded Power BI reports (`frontend/`)

The project is suitable as a portfolio project for:
- Power BI Developer
- Data Analyst / BI Analyst
- Analytics Engineer (Junior)

## Structure

- `sql/`
  - `schema.sql` – Star schema DDL, sample data, and analytical views.
- `backend/`
  - `package.json` – Backend dependencies (Express, JWT, etc.).
  - `server.js` – Auth + Power BI embed-config API (simplified).
- `frontend/`
  - `package.json` – React + Vite app config.
  - `vite.config.js` – Vite config.
  - `index.html` – HTML shell.
  - `src/` – React code (auth, layout, pages, Power BI embed).

## High-Level Architecture

1. **SQL Layer**  
   Transactional sales data is modeled into a star schema:
   - `sales_fact` – fact table at invoice line grain
   - `dim_product`, `dim_customer`, `dim_region`, `dim_channel`, `dim_date` – conformed dimensions

2. **Power BI Layer**  
   Power BI connects to the SQL database, imports the star schema, and defines:
   - Relationships (1-to-many, single direction from dimensions to fact)
   - Advanced DAX measures (Total Sales, Profit, Margin %, MoM, YoY, Running Totals, RankX, etc.)
   - Multiple report pages (Executive Overview, Sales Performance, Growth & Forecast, Detailed Analysis)
   - Row-level security (RLS) based on region and/or role

3. **Backend (Node.js)**  
   The backend provides:
   - `/api/auth/login` – returns a JWT with user role (CEO, SalesManager, Analyst)
   - `/api/powerbi/embed-config` – returns Power BI embed configuration (embedUrl, reportId, accessToken) for the logged-in user

4. **Frontend (React)**  
   The React SPA provides:
   - Login page and role-based protected routes
   - Sidebar navigation (Overview, Sales Performance, Growth & Forecast, Details)
   - Global filters (date, region, product/channel)
   - Embedded Power BI reports using the Power BI JS SDK

## Getting Started

### Prerequisites

- Node.js (LTS)
- npm or yarn
- SQL Server (or Azure SQL); optionally Docker-based SQL for local dev
- Power BI Pro account (for real embedding) – optional if you only want to explore frontend/backend without live reports

### 1. Database

1. Open `sql/schema.sql` in your SQL environment.
2. Run the script to create:
   - Dimensions and fact table
   - Sample data
   - Analytical view `v_sales_flat`

### 2. Backend

```bash
cd "backend"
npm install
npm run dev   # or npm start, depending on script
```

The backend exposes:
- `POST /api/auth/login`
- `GET /api/powerbi/embed-config?reportName=ExecutiveOverview`

Note: The Power BI integration code is scaffolded and should be wired to your own workspace, reports, and service principal credentials.

### 3. Frontend

```bash
cd "frontend"
npm install
npm run dev
```

This will start the React SPA (by default on `http://localhost:5173` if using Vite).

### 4. Power BI

1. Build the data model in Power BI Desktop using the star schema from `sql/schema.sql`.
2. Implement the DAX measures and report pages described in the project documentation.
3. Publish the report to a Power BI workspace.
4. Configure the backend `/api/powerbi/embed-config` to use your workspace, report, and dataset IDs, and generate embed tokens.

## Notes

- This repository focuses on **architecture, patterns, and structure** suitable for interviews and real-world use.
- Many parts are intentionally documented and scaffolded so you can customize for your own environment (e.g., exact Power BI workspace details, RLS mapping tables, etc.).

