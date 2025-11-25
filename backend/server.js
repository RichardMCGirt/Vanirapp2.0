// backend/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

// ------------------- TEMP LOGIN -------------------
const { verifyAspNetIdentityPassword } = require("./passwordValidator");

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const sql = `
      SELECT "Id", "EmailAddress", "Password"
      FROM "AbpUsers"
      WHERE LOWER("EmailAddress") = LOWER($1)
    `;

    const result = await pool.query(sql, [email]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid login" });
    }

    const user = result.rows[0];

    const valid = verifyAspNetIdentityPassword(password, user.Password);

    if (!valid) {
      return res.status(400).json({ error: "Invalid login" });
    }

    res.json({
      token: "auth-token-" + user.Id,
      userId: user.Id,
      email: user.EmailAddress,
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// ================================
// GET JOB DETAILS (FULLY FIXED)
// ================================
app.get("/job/:id", async (req, res) => {
  const sql = `
    SELECT 
      J."Id" AS id,
      J."Name" AS name,
      J."StartDate" AS startdate,
      J."CreationTime" AS creationtime,
      J."Status" AS status,
      J."PlansAndOptions" AS plansandoptions,
      J."Address" AS address,

      S."Name" AS store_name,
      C."Name" AS community_name,
      B."Name" AS builder_name,

      U."Id" AS fieldtech_id,
      U."Name" AS fieldtech_first,
      U."Surname" AS fieldtech_last,

      T."Name" AS trade_name,
      JT."LaborCost" AS labor_cost,
      JC."IsPaid" AS ispaid

    FROM "Jobs" J
    LEFT JOIN "Stores" S ON S."Id" = J."StoreId"
    LEFT JOIN "Communities" C ON C."Id" = J."CommunityId"
    LEFT JOIN "Builders" B ON B."Id" = J."BuilderId"
    LEFT JOIN "AbpUsers" U ON U."Id" = J."FieldTechId"
    LEFT JOIN "JobTrades" JT ON JT."JobId" = J."Id"
    LEFT JOIN "Trades" T ON T."Id" = JT."TradeId"
    LEFT JOIN "JobContractors" JC ON JC."JobId" = J."Id"

    WHERE J."Id" = $1
  `;

  try {
    const r = await pool.query(sql, [req.params.id]);
    if (r.rows.length === 0) return res.json(null);

    const row = r.rows[0];

    const base = {
      id: row.id,
      name: row.name,
      startdate: row.startdate,
      creationtime: row.creationtime,
      status: row.status,
      plansandoptions: row.plansandoptions,
      address: row.address,
      store_name: row.store_name,
      community_name: row.community_name,
      builder_name: row.builder_name,

      fieldtech_id: row.fieldtech_id || null,
      fieldtech_name: `${row.fieldtech_first || ""} ${row.fieldtech_last || ""}`.trim(),

      trades: []
    };

    r.rows.forEach(tr => {
      if (tr.trade_name) {
        base.trades.push({
          trade_name: tr.trade_name,
          labor_cost: tr.labor_cost,
          ispaid: tr.ispaid
        });
      }
    });

    res.json(base);

  } catch (err) {
    console.error("Job details error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// ================================
// UPDATE JOB
// ================================
app.post("/job/update", async (req, res) => {
  try {
    const {
      id,
      name,
      startdate,
      address,
      plansandoptions,
      fieldtech_id,
      trades
    } = req.body;

    // 1️⃣ Update main job record
    await pool.query(
      `
      UPDATE "Jobs"
      SET 
        "Name" = $1,
        "StartDate" = $2,
        "Address" = $3,
        "PlansAndOptions" = $4,
        "FieldTechId" = $5
      WHERE "Id" = $6
      `,
      [name, startdate, address, plansandoptions, fieldtech_id, id]
    );

    // 2️⃣ Update each trade
    if (Array.isArray(trades)) {
      for (const t of trades) {
        await pool.query(
          `
          UPDATE "JobTrades"
          SET "LaborCost" = $1
          WHERE "Id" = $2
          `,
          [t.labor_cost, t.id]
        );
      }
    }

    res.json({ success: true });

  } catch (err) {
    console.error("Update job error:", err);
    res.status(500).json({ error: "Server error during update" });
  }
});


// ================================
// GET LAST 20 JOBS
// ================================
app.get("/jobs", async (req, res) => {
  const sql = `
    SELECT
      J."Id" AS job_id,
      J."Name" AS job_name,
      J."CreationTime",
      S."Name" AS store_name,
      T."Name" AS trade_name,
      JT."LaborCost" AS labor_cost,
      JC."IsPaid" AS ispaid
    FROM "Jobs" J
    LEFT JOIN "Stores" S ON S."Id" = J."StoreId"
    LEFT JOIN "JobTrades" JT ON JT."JobId" = J."Id"
    LEFT JOIN "Trades" T ON T."Id" = JT."TradeId"
    LEFT JOIN "JobContractors" JC ON JC."JobId" = J."Id"

    ORDER BY J."CreationTime" DESC
    LIMIT 20;
  `;

  try {
    const r = await pool.query(sql);
    res.json(r.rows);

  } catch (err) {
    console.error("Jobs list error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/stores", async (req, res) => {
  try {
    const r = await pool.query(`SELECT "Id", "Name" FROM "Stores" ORDER BY "Name" ASC`);
    res.json(r.rows);
  } catch (err) {
    console.error("Stores error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/builders", async (req, res) => {
  try {
    const r = await pool.query(`SELECT "Id", "Name" FROM "Builders" ORDER BY "Name" ASC`);
    res.json(r.rows);
  } catch (err) {
    console.error("Builders error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/communities", async (req, res) => {
  try {
    const r = await pool.query(`SELECT "Id", "Name" FROM "Communities" ORDER BY "Name" ASC`);
    res.json(r.rows);
  } catch (err) {
    console.error("Communities error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/fieldtechs", async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT "Id", "Name", "Surname"
      FROM "AbpUsers"
      ORDER BY "Name" ASC
    `);

    const formatted = r.rows.map(u => ({
      id: u.Id,
      name: `${u.Name} ${u.Surname || ""}`.trim()
    }));

    res.json(formatted);

  } catch (err) {
    console.error("Fieldtechs error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// ================================
// START SERVER
// ================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 API running on port ${PORT}`);
});
