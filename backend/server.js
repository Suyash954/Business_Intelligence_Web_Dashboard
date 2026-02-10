// Backend API for Business Intelligence Web Dashboard – Sales & Growth Analytics
// - Auth: simple email/password -> JWT with role (CEO, SalesManager, Analyst)
// - Power BI: placeholder embed-config endpoint to be wired with real REST calls

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

app.use(cors());
app.use(express.json());

// --- In-memory demo users (replace with real user store / IdP) ---
// Passwords are plain-text for demo purposes only.
const USERS = [
  {
    id: "1",
    name: "Alice CEO",
    email: "ceo@company.com",
    password: "Password123!",
    role: "CEO"
  },
  {
    id: "2",
    name: "Bob Sales Manager",
    email: "sales.manager@company.com",
    password: "Password123!",
    role: "SalesManager"
  },
  {
    id: "3",
    name: "Carol Analyst",
    email: "analyst@company.com",
    password: "Password123!",
    role: "Analyst"
  }
];

// Helper to issue JWT
function createToken(user) {
  const payload = {
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

// Middleware to verify JWT
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// --- Power BI helpers ---

async function getPowerBIAccessToken() {
  const tenantId = process.env.POWERBI_TENANT_ID;
  const clientId = process.env.POWERBI_CLIENT_ID;
  const clientSecret = process.env.POWERBI_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "Power BI app credentials are not configured. Please set POWERBI_TENANT_ID, POWERBI_CLIENT_ID and POWERBI_CLIENT_SECRET in backend/.env."
    );
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);
  params.append("scope", "https://analysis.windows.net/powerbi/api/.default");

  const resp = await axios.post(tokenUrl, params.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });

  return resp.data.access_token;
}

async function getEmbedConfigForReport(reportName, user) {
  const workspaceId = process.env.POWERBI_WORKSPACE_ID;
  const reportIds = {
    ExecutiveOverview: process.env.POWERBI_REPORT_ID_EXEC_OVERVIEW,
    SalesPerformance: process.env.POWERBI_REPORT_ID_SALES_PERF,
    GrowthForecast: process.env.POWERBI_REPORT_ID_GROWTH,
    DetailedAnalysis: process.env.POWERBI_REPORT_ID_DETAILS
  };

  const reportId = reportIds[reportName] || reportIds.ExecutiveOverview;

  const looksUnconfigured =
    !workspaceId ||
    !reportId ||
    workspaceId.startsWith("your-") ||
    reportId.startsWith("your-");

  const tenantId = process.env.POWERBI_TENANT_ID;
  const clientId = process.env.POWERBI_CLIENT_ID;
  const clientSecret = process.env.POWERBI_CLIENT_SECRET;

  const missingAppCredentials = !tenantId || !clientId || !clientSecret;

  // Demo mode: when workspace/report IDs or app credentials are not provided yet,
  // do NOT call Power BI at all. Instead, return a lightweight config that the
  // frontend can use to show a friendly placeholder instead of an error.
  if (looksUnconfigured || missingAppCredentials) {
    return {
      demoMode: true,
      embedConfigured: false,
      reportName,
      message:
        "Power BI embedding is not configured in this environment. The UI, navigation, and page layout are fully functional; reports will render once workspace, report IDs, and app credentials are provided in backend/.env."
    };
  }

  // 1) Get AAD access token for Power BI REST API
  const aadToken = await getPowerBIAccessToken();

  // 2) Optionally fetch report to get embedUrl (recommended)
  const reportResp = await axios.get(
    `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}`,
    {
      headers: {
        Authorization: `Bearer ${aadToken}`
      }
    }
  );

  const embedUrl = reportResp.data.embedUrl;

  // 3) Generate embed token for this report
  const generateTokenResp = await axios.post(
    `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}/GenerateToken`,
    {
      accessLevel: "View"
      // TODO: add identities/roles here for Row-Level Security if needed
    },
    {
      headers: {
        Authorization: `Bearer ${aadToken}`,
        "Content-Type": "application/json"
      }
    }
  );

  const embedToken = generateTokenResp.data.token;

  return {
    reportName,
    embedUrl,
    reportId,
    accessToken: embedToken,
    userRole: user.role
  };
}

// --- Routes ---

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV || "development" });
});

// Auth login (demo only)
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password !== password) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = createToken(user);
  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token
    }
  });
});

app.get("/api/powerbi/embed-config", authenticate, async (req, res) => {
  const reportName = req.query.reportName || "ExecutiveOverview";

  try {
    const config = await getEmbedConfigForReport(reportName, req.user);
    return res.json(config);
  } catch (err) {
    console.error("Error generating Power BI embed config:", err.response?.data || err.message);
    const message =
      err.message ||
      "Failed to generate Power BI embed configuration. Check backend logs and Power BI settings.";
    return res.status(500).json({ message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend API listening on http://localhost:${PORT}`);
});

