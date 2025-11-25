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
// GET JOB DETAILS (WITH INSTALLER)
// ================================
app.get("/job/:id", async (req, res) => {
  const sql = `
    SELECT
      J."Id" AS job_id,
      J."Name" AS job_name,
 J."LocationAddress" AS address,
       J."StartDate" AS startdate,
      J."CreationTime" AS creationtime,
      J."Status" AS status,
      J."PlansAndOptions" AS plansandoptions,
      J."FieldTechId" AS fieldtech_id,

      S."Name" AS store_name,
      C."Name" AS community_name,
      B."Name" AS builder_name,

      FT."Name" AS fieldtech_first,
      FT."Surname" AS fieldtech_last,

      JT."LaborCost" AS labor_cost,
      T."Name" AS trade_name,

      JC."UserId" AS installer_user_id,

      U."Name" AS installer_first,
      U."Surname" AS installer_last,
      U."EmailAddress" AS installer_email

    FROM public."Jobs" J
    
    LEFT JOIN public."Stores" S ON S."Id" = J."StoreId"
    LEFT JOIN public."Communities" C ON C."Id" = J."CommunityId"
    LEFT JOIN public."Builders" B ON B."Id" = J."BuilderId"
    LEFT JOIN public."AbpUsers" FT ON FT."Id" = J."FieldTechId"

    LEFT JOIN public."JobTrades" JT ON JT."JobId" = J."Id"
    LEFT JOIN public."Trades" T ON T."Id" = JT."TradeId"

    LEFT JOIN public."JobContractors" JC ON JC."JobId" = J."Id"
    LEFT JOIN public."AbpUsers" U ON U."Id" = JC."UserId"

    WHERE J."Id" = $1;
  `;

  try {
    const r = await pool.query(sql, [req.params.id]);

    if (r.rows.length === 0) return res.json(null);

    const first = r.rows[0];

    const response = {
      id: first.job_id,
      name: first.job_name,
      address: first.address,
      startdate: first.startdate,
      creationtime: first.creationtime,
      status: first.status,
      plansandoptions: first.plansandoptions,

      store_name: first.store_name,
      community_name: first.community_name,
      builder_name: first.builder_name,

      fieldtech_id: first.fieldtech_id,
      fieldtech_name: `${first.fieldtech_first || ""} ${first.fieldtech_last || ""}`.trim(),

      installer: {
        user_id: first.installer_user_id,
        first: first.installer_first,
        last: first.installer_last,
        email: first.installer_email
      },

      trades: r.rows
        .filter(r => r.trade_name)
        .map(r => ({
          trade_name: r.trade_name,
          labor_cost: r.labor_cost
        }))
    };

    res.json(response);

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

  JC."IsPaid" AS ispaid,
  JC."UserId" AS installer_user_id,

  U."Name" AS installer_first,
  U."Surname" AS installer_last

FROM "Jobs" J
LEFT JOIN "Stores" S ON S."Id" = J."StoreId"
LEFT JOIN "JobTrades" JT ON JT."JobId" = J."Id"
LEFT JOIN "Trades" T ON T."Id" = JT."TradeId"
LEFT JOIN "JobContractors" JC ON JC."JobId" = J."Id"
LEFT JOIN "AbpUsers" U ON U."Id" = JC."UserId"

WHERE JC."UserId" IS NOT NULL     -- 🔥 ENSURES INSTALLER EXISTS

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
