// backend/server.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// ----------------------------
// TEST ROOT
// ----------------------------
app.get("/", (req, res) => {
  res.json({ status: "Backend API running 🚀" });
});

// ----------------------------
// TEST LOGIN
// ----------------------------
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

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  const user = testUsers.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) return res.status(400).json({ error: "Invalid login" });

  res.json({ token: user.token });
});

// --------------------------------------------------
// MAIN JOB LIST
// --------------------------------------------------
app.get("/api/jobs", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM "Jobs"
      WHERE "Status" != 4
      ORDER BY "Id" DESC
      LIMIT 50;
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Jobs fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// --------------------------------------------------
// UNPAID SUBCONTRACTORS
// --------------------------------------------------
app.get("/api/jobs/unpaid", async (req, res) => {
  try {
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

    const r = await pool.query(sql);
    res.json(r.rows);
  } catch (err) {
    console.error("Unpaid subcontractors error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// --------------------------------------------------
// MEASUREMENTS NEEDED
// --------------------------------------------------
app.get("/api/jobs/measurements", async (req, res) => {
  try {
    const sql = `
      SELECT 
        J."Id" AS id,
        J."Name" AS jobname,
        J."CreationTime" AS created
      FROM "Jobs" J
      WHERE J."MeasurementStatus" = 1
      ORDER BY J."CreationTime" DESC;
    `;

    const r = await pool.query(sql);
    res.json(r.rows);
  } catch (err) {
    console.error("Measurements error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// --------------------------------------------------
// SUBCONTRACTORS TO ONBOARD
// --------------------------------------------------
app.get("/api/jobs/onboard", async (req, res) => {
  try {
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

    const r = await pool.query(sql);
    res.json(r.rows);
  } catch (err) {
    console.error("Onboarding error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// --------------------------------------------------
// LIEN NOTICE JOBS
// --------------------------------------------------
app.get("/api/jobs/liens", async (req, res) => {
  try {
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

    const r = await pool.query(sql);
    res.json(r.rows);
  } catch (err) {
    console.error("Lien error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// --------------------------------------------------
// JOB DETAILS ENDPOINTS
// --------------------------------------------------
app.get("/api/job/:id", async (req, res) => {
  const result = await pool.query(`SELECT * FROM "Jobs" WHERE "Id" = $1`, [
    req.params.id,
  ]);
  res.json(result.rows[0]);
});

app.get("/api/job/:id/contractors", async (req, res) => {
  const result = await pool.query(
    `
    SELECT JC."Id", U."Name", JC."IsPaid"
    FROM "JobContractors" JC
    LEFT JOIN "SubContractors" U ON JC."UserId" = U."Id"
    WHERE JC."JobId" = $1
  `,
    [req.params.id]
  );
  res.json(result.rows);
});

app.get("/api/job/:id/materials", async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM "Materials" WHERE "JobId" = $1`,
    [req.params.id]
  );
  res.json(result.rows);
});

app.get("/api/job/:id/punchlist", async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM "PunchItems" WHERE "JobId" = $1`,
    [req.params.id]
  );
  res.json(result.rows);
});

app.get("/api/job/:id/prewalks", async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM "PreWalkItems" WHERE "JobId" = $1`,
    [req.params.id]
  );
  res.json(result.rows);
});

app.get("/api/job/:id/store", async (req, res) => {
  const result = await pool.query(
    `
    SELECT S."Name"
    FROM "Stores" S
    JOIN "Jobs" J ON J."StoreId" = S."Id"
    WHERE J."Id" = $1
  `,
    [req.params.id]
  );
  res.json(result.rows[0]);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 API running on port ${PORT}`));
