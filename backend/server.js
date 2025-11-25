// ------------------------------
// 📌 SERVER SETUP
// ------------------------------
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
app.use(cors());
app.use(express.json());


// ------------------------------
// 📌 TEST ROUTE
// ------------------------------
app.get("/", (req, res) => {
  res.json({ status: "Backend API running 🚀" });
});


// ------------------------------
// 📌 TEMP LOGIN
// ------------------------------
const testUsers = [
  {
    email: "richard.mcgirt@vanirinstalledsales.com",
    password: "123qwe",
    token: "richard-temp-token",
  },
  {
    email: "diana.smith@vanirinstalledsales.com",
    password: "123qwe",
    token: "diana-temp-token",
  },
];

app.post("/auth/login", (req, res) => {
  const { email, password } = req.body;

  const user = testUsers.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) return res.status(400).json({ error: "Invalid login" });

  res.json({ token: user.token });
});


// ======================================================================
// 📌 GET FULL JOB LIST WITH STORE, TRADE, LABOR, PAID STATUS
// ======================================================================
app.get("/jobs", async (req, res) => {
  const sql = `
    SELECT
      J."Id" AS job_id,
      J."Name" AS job_name,
      J."CreationTime" AS creationtime,
      S."Name" AS store_name,
      T."Name" AS trade_name,
      JT."LaborCost" AS labor_cost,
      COALESCE(JC."IsPaid", false) AS ispaid

    FROM "Jobs" J
    LEFT JOIN "Stores" S   ON S."Id" = J."StoreId"
    LEFT JOIN "JobTrades" JT  ON JT."JobId" = J."Id"
    LEFT JOIN "Trades" T   ON T."Id" = JT."TradeId"
    LEFT JOIN "JobContractors" JC ON JC."JobId" = J."Id"

    WHERE J."IsDeleted" = false
    ORDER BY J."Id" DESC
    LIMIT 200;
  `;

  try {
    const r = await pool.query(sql);
    res.json(r.rows);
  } catch (err) {
    console.error("Jobs fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// ======================================================================
// 📌 JOB FILTERS (MUST COME BEFORE /job/:id)
// ======================================================================

// 🔴 Unpaid subcontractors
app.get("/jobs/unpaid", async (req, res) => {
  const sql = `
    SELECT 
      JC."Id" AS id,
      J."Name" AS jobname,
      JC."CreationTime" AS created,
      T."Name" AS trade
    FROM "JobContractors" JC
    JOIN "Jobs" J ON JC."JobId" = J."Id"
    JOIN "Trades" T ON JC."Type" = T."Id"
    WHERE JC."IsPaid" = false
    ORDER BY JC."CreationTime" DESC;
  `;
  try {
    const r = await pool.query(sql);
    res.json(r.rows);
  } catch (err) {
    console.error("Unpaid error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 📏 Measurements to order
app.get("/jobs/measurements", async (req, res) => {
  const sql = `
    SELECT 
      J."Id" AS id,
      J."Name" AS jobname,
      J."CreationTime" AS created
    FROM "Jobs" J
    WHERE J."MeasurementStatus" = 1
    ORDER BY J."CreationTime" DESC;
  `;
  try {
    const r = await pool.query(sql);
    res.json(r.rows);
  } catch (err) {
    console.error("Measurements error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🧾 Subcontractors needing onboarding
app.get("/jobs/onboard", async (req, res) => {
  const sql = `
    SELECT 
      SC."Id" AS id,
      SC."Name" AS subname,
      SC."CreationTime" AS created
    FROM "SubContractorForms" SC
    WHERE SC."IsDeleted" = false
      AND (SC."HasPrice" = false OR SC."Location" IS NULL)
    ORDER BY SC."CreationTime" DESC;
  `;
  try {
    const r = await pool.query(sql);
    res.json(r.rows);
  } catch (err) {
    console.error("Onboard error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 📄 Lien notices needed
app.get("/jobs/liens", async (req, res) => {
  const sql = `
    SELECT
      J."Id" AS jobid,
      J."Name" AS jobname,
      J."Status"
    FROM "Jobs" J
    WHERE J."Status" != 4
      AND J."IsDeleted" = false
    ORDER BY J."Id" ASC;
  `;
  try {
    const r = await pool.query(sql);
    res.json(r.rows);
  } catch (err) {
    console.error("Lien error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// ======================================================================
// 📌 FULL JOB DETAILS (USED BY JobDetails.js)
// ======================================================================
app.get("/job/:id", async (req, res) => {
  const sql = `
    SELECT
      J."Id",
      J."Name",
      J."StartDate",
      J."CreationTime",
      J."Status",
      J."PlansAndOptions",
      J."LocationAddress",

      S."Name" AS store_name,
      C."Name" AS community_name,
      B."Name" AS builder_name,

      T."Name" AS trade_name,
      JT."LaborCost" AS labor_cost

    FROM "Jobs" J
    LEFT JOIN "Stores" S ON S."Id" = J."StoreId"
    LEFT JOIN "Communities" C ON C."Id" = J."CommunityId"
    LEFT JOIN "Builders" B ON B."Id" = J."BuilderId"

    LEFT JOIN "JobTrades" JT ON JT."JobId" = J."Id"
    LEFT JOIN "Trades" T ON T."Id" = JT."TradeId"

    WHERE J."Id" = $1
  `;

  try {
    const r = await pool.query(sql, [req.params.id]);

    // Group all trade rows under a single job object
    if (r.rows.length === 0) return res.json(null);

    const base = {
      id: r.rows[0].Id,
      name: r.rows[0].Name,
      startdate: r.rows[0].StartDate,
      creationtime: r.rows[0].CreationTime,
      status: r.rows[0].Status,
      plansandoptions: r.rows[0].PlansAndOptions,
      address: r.rows[0].LocationAddress,
      store_name: r.rows[0].store_name,
      community_name: r.rows[0].community_name,
      builder_name: r.rows[0].builder_name,
      trades: []
    };

    r.rows.forEach(row => {
      if (row.trade_name) {
        base.trades.push({
          trade_name: row.trade_name,
          labor_cost: row.labor_cost
        });
      }
    });

    res.json(base);

  } catch (err) {
    console.error("Job details error:", err);
    res.status(500).json({ error: "Server error" });
  }
});



// ======================================================================
// 📌 OTHER JOB SUB-ROUTES
// ======================================================================
app.get("/job/:id/contractors", async (req, res) => {
  const sql = `
    SELECT JC."Id", U."Name", JC."IsPaid"
    FROM "JobContractors" JC
    LEFT JOIN "SubContractors" U ON JC."UserId" = U."Id"
    WHERE JC."JobId" = $1
  `;
  const r = await pool.query(sql, [req.params.id]);
  res.json(r.rows);
});

app.get("/job/:id/materials", async (req, res) => {
  const sql = `SELECT * FROM "Materials" WHERE "JobId" = $1`;
  const r = await pool.query(sql, [req.params.id]);
  res.json(r.rows);
});

app.get("/job/:id/punchlist", async (req, res) => {
  const sql = `SELECT * FROM "PunchItems" WHERE "JobId" = $1`;
  const r = await pool.query(sql, [req.params.id]);
  res.json(r.rows);
});

app.get("/job/:id/prewalks", async (req, res) => {
  const sql = `SELECT * FROM "PreWalkItems" WHERE "JobId" = $1`;
  const r = await pool.query(sql, [req.params.id]);
  res.json(r.rows);
});

app.get("/job/:id/store", async (req, res) => {
  const sql = `
    SELECT S."Name"
    FROM "Stores" S
    JOIN "Jobs" J ON J."StoreId" = S."Id"
    WHERE J."Id" = $1
  `;
  const r = await pool.query(sql, [req.params.id]);
  res.json(r.rows[0]);
});


// ======================================================================
// 📌 START SERVER
// ======================================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 API running on port ${PORT}`);
});
