-- ============================================================
-- Business Intelligence Web Dashboard – Sales & Growth Analytics
-- Star Schema + Sample Data + View + Example Queries
-- Target DB: SQL Server / Azure SQL
-- ============================================================

IF DB_ID('SalesAnalyticsBI') IS NULL
BEGIN
    CREATE DATABASE SalesAnalyticsBI;
END;
GO

USE SalesAnalyticsBI;
GO

-- ============================================================
-- 1. Dimension Tables
-- ============================================================

IF OBJECT_ID('dbo.dim_date', 'U') IS NOT NULL DROP TABLE dbo.dim_date;
IF OBJECT_ID('dbo.dim_region', 'U') IS NOT NULL DROP TABLE dbo.dim_region;
IF OBJECT_ID('dbo.dim_channel', 'U') IS NOT NULL DROP TABLE dbo.dim_channel;
IF OBJECT_ID('dbo.dim_product', 'U') IS NOT NULL DROP TABLE dbo.dim_product;
IF OBJECT_ID('dbo.dim_customer', 'U') IS NOT NULL DROP TABLE dbo.dim_customer;
IF OBJECT_ID('dbo.sales_fact', 'U') IS NOT NULL DROP TABLE dbo.sales_fact;
GO

-- 1.1 dim_date

CREATE TABLE dbo.dim_date (
    DateKey         INT         NOT NULL PRIMARY KEY, -- YYYYMMDD
    FullDate        DATE        NOT NULL,
    [Year]          INT         NOT NULL,
    [Quarter]       TINYINT     NOT NULL,
    QuarterName     VARCHAR(10) NOT NULL,
    [Month]         TINYINT     NOT NULL,
    MonthName       VARCHAR(20) NOT NULL,
    YearMonth       CHAR(7)     NOT NULL, -- 'YYYY-MM'
    WeekOfYear      TINYINT     NOT NULL,
    DayOfMonth      TINYINT     NOT NULL,
    DayOfWeek       TINYINT     NOT NULL,
    DayName         VARCHAR(20) NOT NULL,
    IsWeekend       BIT         NOT NULL,
    IsHoliday       BIT         NOT NULL
);
GO

-- Simple date population for demo (2025 only). In production, use a full calendar range.

DECLARE @StartDate DATE = '2025-01-01';
DECLARE @EndDate   DATE = '2025-12-31';

;WITH DateRange AS (
    SELECT @StartDate AS Dt
    UNION ALL
    SELECT DATEADD(DAY, 1, Dt)
    FROM DateRange
    WHERE Dt < @EndDate
)
INSERT INTO dbo.dim_date
(
    DateKey, FullDate, [Year], [Quarter], QuarterName, [Month],
    MonthName, YearMonth, WeekOfYear, DayOfMonth, DayOfWeek,
    DayName, IsWeekend, IsHoliday
)
SELECT
    CONVERT(INT, FORMAT(Dt, 'yyyyMMdd')) AS DateKey,
    Dt AS FullDate,
    YEAR(Dt) AS [Year],
    DATEPART(QUARTER, Dt) AS [Quarter],
    CONCAT('Q', DATEPART(QUARTER, Dt)) AS QuarterName,
    MONTH(Dt) AS [Month],
    DATENAME(MONTH, Dt) AS MonthName,
    CONVERT(CHAR(7), Dt, 126) AS YearMonth, -- yyyy-MM
    DATEPART(WEEK, Dt) AS WeekOfYear,
    DAY(Dt) AS DayOfMonth,
    DATEPART(WEEKDAY, Dt) AS DayOfWeek,
    DATENAME(WEEKDAY, Dt) AS DayName,
    CASE WHEN DATENAME(WEEKDAY, Dt) IN ('Saturday', 'Sunday') THEN 1 ELSE 0 END AS IsWeekend,
    0 AS IsHoliday -- customize for real holidays
FROM DateRange
OPTION (MAXRECURSION 366);
GO

-- 1.2 dim_region

CREATE TABLE dbo.dim_region (
    RegionKey      INT IDENTITY(1,1) PRIMARY KEY,
    RegionCode     VARCHAR(20)  NOT NULL UNIQUE,
    RegionName     VARCHAR(100) NOT NULL,
    Country        VARCHAR(100) NOT NULL,
    RegionManager  VARCHAR(200) NULL
);
GO

INSERT INTO dbo.dim_region (RegionCode, RegionName, Country, RegionManager)
VALUES
('NORTH', 'North Region', 'USA', 'John Carter'),
('SOUTH', 'South Region', 'USA', 'Maria Gomez'),
('EAST',  'East Region',  'USA', 'Emily Clark'),
('WEST',  'West Region',  'USA', 'David Lee');
GO

-- 1.3 dim_channel

CREATE TABLE dbo.dim_channel (
    ChannelKey   INT IDENTITY(1,1) PRIMARY KEY,
    ChannelCode  VARCHAR(20)  NOT NULL UNIQUE,
    ChannelName  VARCHAR(100) NOT NULL,
    IsOnline     BIT          NOT NULL
);
GO

INSERT INTO dbo.dim_channel (ChannelCode, ChannelName, IsOnline)
VALUES
('RET', 'Retail', 0),
('ECM', 'E-Commerce', 1),
('DST', 'Distributor', 0);
GO

-- 1.4 dim_product

CREATE TABLE dbo.dim_product (
    ProductKey      INT IDENTITY(1,1) PRIMARY KEY,
    ProductCode     VARCHAR(50)  NOT NULL UNIQUE,
    ProductName     VARCHAR(200) NOT NULL,
    Category        VARCHAR(100) NOT NULL,
    SubCategory     VARCHAR(100) NULL,
    Brand           VARCHAR(100) NULL,
    UnitPrice       DECIMAL(18,2) NOT NULL,
    CostPrice       DECIMAL(18,2) NOT NULL,
    IsActive        BIT NOT NULL DEFAULT 1,
    LaunchDateKey   INT NULL,
    CONSTRAINT FK_dim_product_dim_date
        FOREIGN KEY (LaunchDateKey) REFERENCES dbo.dim_date(DateKey)
);
GO

INSERT INTO dbo.dim_product
    (ProductCode, ProductName, Category, SubCategory, Brand, UnitPrice, CostPrice, IsActive, LaunchDateKey)
VALUES
('P-1001', 'Premium Headphones', 'Electronics', 'Audio', 'SoundMax',   120.00,  70.00, 1, 20250115),
('P-1002', 'Wireless Mouse',     'Electronics', 'Accessories', 'ClickPro', 25.00, 10.00, 1, 20250201),
('P-1003', 'Office Chair',       'Furniture',   'Seating', 'ComfortLine', 180.00, 110.00, 1, 20250110),
('P-1004', 'Standing Desk',      'Furniture',   'Desk', 'WorkFlex',      320.00, 210.00, 1, 20250301);
GO

-- 1.5 dim_customer

CREATE TABLE dbo.dim_customer (
    CustomerKey     INT IDENTITY(1,1) PRIMARY KEY,
    CustomerCode    VARCHAR(50)  NOT NULL UNIQUE,
    CustomerName    VARCHAR(200) NOT NULL,
    CustomerSegment VARCHAR(100) NOT NULL,
    Email           VARCHAR(255) NULL,
    Phone           VARCHAR(50)  NULL,
    RegionKey       INT          NOT NULL,
    City            VARCHAR(100) NULL,
    Country         VARCHAR(100) NULL,
    JoinDateKey     INT          NULL,
    IsActive        BIT          NOT NULL DEFAULT 1,
    CONSTRAINT FK_dim_customer_dim_region
        FOREIGN KEY (RegionKey) REFERENCES dbo.dim_region(RegionKey),
    CONSTRAINT FK_dim_customer_dim_date
        FOREIGN KEY (JoinDateKey) REFERENCES dbo.dim_date(DateKey)
);
GO

INSERT INTO dbo.dim_customer
    (CustomerCode, CustomerName, CustomerSegment, Email, Phone, RegionKey, City, Country, JoinDateKey, IsActive)
VALUES
('C-001', 'Alpha Retailers',   'SMB',            'alpha@retail.com',  '1234567890', 1, 'New York',      'USA', 20250101, 1),
('C-002', 'Beta Distributors', 'Enterprise',     'contact@beta.com',  '1234567891', 2, 'Dallas',        'USA', 20250102, 1),
('C-003', 'Online Consumer',   'Retail Consumer','user@example.com',  NULL,        3, 'San Francisco', 'USA', 20250103, 1),
('C-004', 'Gamma Stores',      'SMB',            'info@gamma.com',    '1234567892', 4, 'Seattle',       'USA', 20250104, 1);
GO

-- ============================================================
-- 2. Fact Table
-- ============================================================

CREATE TABLE dbo.sales_fact (
    SalesFactKey       BIGINT IDENTITY(1,1) PRIMARY KEY,
    InvoiceNumber      VARCHAR(50) NOT NULL,
    InvoiceLineNumber  INT         NOT NULL,
    DateKey            INT         NOT NULL,
    ProductKey         INT         NOT NULL,
    CustomerKey        INT         NOT NULL,
    RegionKey          INT         NOT NULL,
    ChannelKey         INT         NOT NULL,
    Quantity           INT         NOT NULL,
    UnitPrice          DECIMAL(18,2) NOT NULL,
    UnitCost           DECIMAL(18,2) NOT NULL,
    DiscountAmount     DECIMAL(18,2) NOT NULL DEFAULT 0,
    TaxAmount          DECIMAL(18,2) NOT NULL DEFAULT 0,
    NetSalesAmount     DECIMAL(18,2) NOT NULL,
    GrossSalesAmount   DECIMAL(18,2) NOT NULL,
    CreatedAt          DATETIME    NOT NULL DEFAULT GETDATE(),
    UpdatedAt          DATETIME    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_sales_fact_invoice_line UNIQUE (InvoiceNumber, InvoiceLineNumber),
    CONSTRAINT FK_sales_fact_dim_date
        FOREIGN KEY (DateKey) REFERENCES dbo.dim_date(DateKey),
    CONSTRAINT FK_sales_fact_dim_product
        FOREIGN KEY (ProductKey) REFERENCES dbo.dim_product(ProductKey),
    CONSTRAINT FK_sales_fact_dim_customer
        FOREIGN KEY (CustomerKey) REFERENCES dbo.dim_customer(CustomerKey),
    CONSTRAINT FK_sales_fact_dim_region
        FOREIGN KEY (RegionKey) REFERENCES dbo.dim_region(RegionKey),
    CONSTRAINT FK_sales_fact_dim_channel
        FOREIGN KEY (ChannelKey) REFERENCES dbo.dim_channel(ChannelKey)
);
GO

-- Sample sales data (a few rows across dates/regions/channels)

INSERT INTO dbo.sales_fact
    (InvoiceNumber, InvoiceLineNumber, DateKey, ProductKey, CustomerKey, RegionKey, ChannelKey,
     Quantity, UnitPrice, UnitCost, DiscountAmount, TaxAmount, NetSalesAmount, GrossSalesAmount)
VALUES
('INV-10001', 1, 20250101, 1, 1, 1, 1, 10, 120.00, 70.00,  50.00,  72.00, 1150.00, 1200.00),
('INV-10001', 2, 20250101, 2, 1, 1, 2,  5,  25.00, 10.00,  10.00,  18.00,  115.00,  125.00),
('INV-10002', 1, 20250102, 3, 2, 2, 3,  2, 180.00,110.00,   0.00,  64.80,  360.00,  360.00),
('INV-10003', 1, 20250215, 1, 3, 3, 2,  3, 115.00, 70.00,  20.00,  24.30,  325.00,  345.00),
('INV-10004', 1, 20250310, 4, 4, 4, 1,  1, 320.00,210.00,   0.00,  57.60,  320.00,  320.00),
('INV-10005', 1, 20250405, 2, 2, 2, 1, 15,  22.00, 10.00,  30.00,  52.80,  300.00,  330.00);
GO

-- Basic indexes for performance

CREATE NONCLUSTERED INDEX IX_sales_fact_DateKey    ON dbo.sales_fact (DateKey);
CREATE NONCLUSTERED INDEX IX_sales_fact_RegionKey  ON dbo.sales_fact (RegionKey);
CREATE NONCLUSTERED INDEX IX_sales_fact_ProductKey ON dbo.sales_fact (ProductKey);
GO

-- ============================================================
-- 3. Analytical View for Power BI
-- ============================================================

IF OBJECT_ID('dbo.v_sales_flat', 'V') IS NOT NULL DROP VIEW dbo.v_sales_flat;
GO

CREATE VIEW dbo.v_sales_flat AS
SELECT
    f.SalesFactKey,
    f.InvoiceNumber,
    f.InvoiceLineNumber,
    d.FullDate,
    d.DateKey,
    d.[Year],
    d.[Month],
    d.MonthName,
    d.YearMonth,
    r.RegionName,
    r.RegionCode,
    c.ChannelName,
    p.ProductName,
    p.Category,
    p.SubCategory,
    cust.CustomerName,
    cust.CustomerSegment,
    f.Quantity,
    f.UnitPrice,
    f.UnitCost,
    f.GrossSalesAmount,
    f.DiscountAmount,
    f.NetSalesAmount,
    (f.NetSalesAmount - (f.UnitCost * f.Quantity)) AS Profit
FROM dbo.sales_fact f
JOIN dbo.dim_date    d    ON f.DateKey    = d.DateKey
JOIN dbo.dim_product p    ON f.ProductKey = p.ProductKey
JOIN dbo.dim_customer cust ON f.CustomerKey = cust.CustomerKey
JOIN dbo.dim_region  r    ON f.RegionKey  = r.RegionKey
JOIN dbo.dim_channel c    ON f.ChannelKey = c.ChannelKey;
GO

-- ============================================================
-- 4. Example Analytical Queries
-- ============================================================

-- 4.1 Sales by Region & Channel (HAVING)

SELECT
    r.RegionName,
    c.ChannelName,
    SUM(f.NetSalesAmount) AS TotalNetSales,
    SUM(f.NetSalesAmount - (f.UnitCost * f.Quantity)) AS TotalProfit
FROM dbo.sales_fact f
JOIN dbo.dim_region r   ON f.RegionKey = r.RegionKey
JOIN dbo.dim_channel c  ON f.ChannelKey = c.ChannelKey
JOIN dbo.dim_date d     ON f.DateKey   = d.DateKey
WHERE d.[Year] = 2025
GROUP BY r.RegionName, c.ChannelName
HAVING SUM(f.NetSalesAmount) > 500
ORDER BY TotalNetSales DESC;
GO

-- 4.2 Window function – Rank products by sales within region

SELECT
    r.RegionName,
    p.ProductName,
    SUM(f.NetSalesAmount) AS TotalSales,
    RANK() OVER (PARTITION BY r.RegionName ORDER BY SUM(f.NetSalesAmount) DESC) AS SalesRankInRegion
FROM dbo.sales_fact f
JOIN dbo.dim_product p ON f.ProductKey = p.ProductKey
JOIN dbo.dim_region r  ON f.RegionKey = r.RegionKey
JOIN dbo.dim_date d    ON f.DateKey   = d.DateKey
WHERE d.[Year] = 2025
GROUP BY r.RegionName, p.ProductName;
GO

-- 4.3 CTE – YoY growth by region (example; assumes multiple years in real data)

WITH SalesByYearRegion AS (
    SELECT
        r.RegionName,
        d.[Year],
        SUM(f.NetSalesAmount) AS TotalSales
    FROM dbo.sales_fact f
    JOIN dbo.dim_region r ON f.RegionKey = r.RegionKey
    JOIN dbo.dim_date d   ON f.DateKey   = d.DateKey
    GROUP BY r.RegionName, d.[Year]
),
WithPrevYear AS (
    SELECT
        cur.RegionName,
        cur.[Year],
        cur.TotalSales AS CurrentYearSales,
        prev.TotalSales AS PreviousYearSales
    FROM SalesByYearRegion cur
    LEFT JOIN SalesByYearRegion prev
        ON cur.RegionName = prev.RegionName
       AND cur.[Year] = prev.[Year] + 1
)
SELECT
    RegionName,
    [Year],
    CurrentYearSales,
    PreviousYearSales,
    CASE
        WHEN PreviousYearSales IS NULL OR PreviousYearSales = 0
            THEN NULL
        ELSE (CurrentYearSales - PreviousYearSales) * 100.0 / PreviousYearSales
    END AS YoY_Growth_Pct
FROM WithPrevYear
ORDER BY RegionName, [Year];
GO

