// backend/server.js
require("dotenv").config();
console.log("ENV CHECK:", {
  host: process.env.DB_HOST,
  db: process.env.DB_NAME,
  airtableBase: process.env.AIRTABLE_BASE
});

const express = require("express");
const cors = require("cors");
const pool = require("./db");
const crypto = require("crypto");
const Airtable = require("airtable");
const airtable = new Airtable({ apiKey: process.env.AIRTABLE_KEY })
  .base(process.env.AIRTABLE_BASE);
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

app.get("/dashboard/workloads", async (req, res) => {
  try {
    const sql = `
      WITH valid_jobs AS (
        SELECT * FROM public."Jobs"
        WHERE "Status" NOT IN (3,4)   -- exclude completed
      )

      -- FIELD TECHS
      SELECT
        s."Name" AS store,
        ft."Id" AS user_id,
        (ft."Name" || ' ' || ft."Surname") AS full_name,
        COUNT(vj."Id") AS count,
        'tech' AS type
      FROM valid_jobs vj
      JOIN public."Stores" s ON s."Id" = vj."StoreId"
      JOIN public."AbpUsers" ft ON ft."Id" = vj."FieldTechId"
      GROUP BY store, user_id, full_name

      UNION ALL

      -- INSTALLERS
      SELECT
        s."Name" AS store,
        u."Id" AS user_id,
        (u."Name" || ' ' || u."Surname") AS full_name,
        COUNT(vj."Id") AS count,
        'installer' AS type
      FROM valid_jobs vj
      JOIN public."Stores" s ON s."Id" = vj."StoreId"
      JOIN public."JobContractors" jc ON jc."JobId" = vj."Id"
      JOIN public."AbpUsers" u ON u."Id" = jc."UserId"
      GROUP BY store, user_id, full_name
    `;

    const result = await pool.query(sql);

    // Organize by store
    const stores = {};

    result.rows.forEach(row => {
      if (!stores[row.store]) {
        stores[row.store] = { techs: [], installers: [] };
      }

      const entry = {
        id: row.user_id,
        name: row.full_name,
        count: Number(row.count)
      };

      if (row.type === "tech") stores[row.store].techs.push(entry);
      else stores[row.store].installers.push(entry);
    });

    res.json(stores);

  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/job/:jobId/images", async (req, res) => {
  const jobId = req.params.jobId;

  try {
    const sql = `
      SELECT 
        img."Id",
        img."ImagePath",
        item."Id" AS "PreWalkItemId",
        list."Id" AS "PreWalkListId"
      FROM "PreWalkImages" img
      JOIN "PreWalkItems" item
        ON img."PreWalkItemId" = item."Id"
      JOIN "PreWalkLists" list
        ON item."PreWalkListId" = list."Id"
      WHERE list."JobId" = $1
      ORDER BY img."Id" ASC;
    `;

    const result = await pool.query(sql, [jobId]);

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error loading job images:", err);
    res.status(500).json({ error: "Failed to load images" });
  }
});
// ================================
// GET MEASUREMENTS FOR A JOB
// ================================
app.get("/job/:jobId/measurements", async (req, res) => {
  const jobId = Number(req.params.jobId);

  try {
   const sql = `
  SELECT 
    "Id" AS id,
    "Height" AS height,
    "Width" AS width,
    "Category" AS category,
    "JobId" AS jobid
  FROM public."Measurements"
  WHERE "JobId" = $1
  ORDER BY "Id" ASC
`;


    const r = await pool.query(sql, [jobId]);
    res.json(r.rows);

  } catch (err) {
    console.error("Measurements error:", err);
    res.status(500).json({ error: "Failed to load measurements" });
  }
});
app.post("/measurements/update", async (req, res) => {
  const { jobId, measurements } = req.body;

  try {
    for (const m of measurements) {
      await pool.query(
        `
        UPDATE public."Measurements"
        SET "Width" = $1,
            "Height" = $2,
            "Category" = $3
        WHERE "Id" = $4 AND "JobId" = $5
        `,
        [m.width, m.height, m.category, m.id, jobId]
      );
    }

    res.json({ success: true });

  } catch (err) {
    console.error("Measurements update error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});
//
// GET all materials with their mapped reasons
//
app.get("/materials-with-reasons", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        m."Id" AS material_id,
        m."Name" AS material_name,
        m."HasColor",
        r."Id" AS reason_id,
        r."Title" AS reason_name   -- FIXED HERE
      FROM public."Materials" m
      LEFT JOIN public."MaterialReasons" mr 
        ON mr."MaterialId" = m."Id"
      LEFT JOIN public."Reasons" r 
        ON r."Id" = mr."ReasonId"
      ORDER BY m."Id", r."Id"
    `);

    const map = {};

    result.rows.forEach(row => {
      if (!map[row.material_id]) {
        map[row.material_id] = {
          id: row.material_id,
          name: row.material_name,
          hasColor: row.hascolor,
          reasons: []
        };
      }

      if (row.reason_id) {
        map[row.material_id].reasons.push({
          id: row.reason_id,
          name: row.reason_name
        });
      }
    });

    res.json(Object.values(map));
  } catch (err) {
    console.error("Error loading materials:", err);
    res.status(500).json({ error: "Server error" });
  }
});
app.get('/job/:id/construction-manager', async (req, res) => {
  const jobId = req.params.id;

  try {
    const result = await pool.query(
      `SELECT cm."FullName",
              cm."PhoneNumber",
              cm."Id"
       FROM public."ConstructionManagers" cm
       WHERE cm."BuilderId" = (
           SELECT "BuilderId" FROM public."Jobs" WHERE "Id" = $1
       )
       AND cm."IsDeleted" = false
       LIMIT 1`,
      [jobId]
    );

    res.json(result.rows[0] || null);
  } catch (err) {
    console.error("Error loading construction manager:", err);
    res.status(500).json({ error: "Failed to load construction manager" });
  }
});


app.get('/job/:id/prewalk-items', async (req, res) => {
  const jobId = req.params.id;

  try {
    const result = await pool.query(
      `SELECT i."Id",
              i."PreWalkListId",
              i."ReasonId",
              i."AskCMToFix",
              i."Note",
              r."Title" AS reason_name
       FROM public."PreWalkItems" i
       LEFT JOIN public."Reasons" r 
         ON r."Id" = i."ReasonId"
       WHERE i."PreWalkListId" IN (
          SELECT "Id" FROM public."PreWalkLists" WHERE "JobId" = $1
       )
       ORDER BY i."Id" ASC`,
      [jobId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error loading PreWalkItems:", err);
    res.status(500).json({ error: "Failed to load PreWalkItems" });
  }
});



app.get('/job/:id/prewalk-pdfs', async (req, res) => {
  const jobId = req.params.id;

  try {
    const result = await pool.query(
      `SELECT "Id", "PreWalkItemsPdfUrl"
       FROM public."PreWalkLists"
       WHERE "JobId" = $1
       ORDER BY "Id" ASC`,
      [jobId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error loading PreWalk PDFs:", err);
    res.status(500).json({ error: "Failed to load PDF list" });
  }
});

//
// SAVE SELECTED MATERIAL / REASON
//
app.post("/materials/save-selection", async (req, res) => {
  try {
    const { materialId, reasonId, color } = req.body;

    await pool.query(
      `
      INSERT INTO public."MaterialSelections"
      ("MaterialId", "ReasonId", "Color")
      VALUES ($1, $2, $3)
      `,
      [materialId, reasonId, color ?? null]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Error saving selection:", err);
    res.status(500).json({ error: "Server error" });
  }
});


app.get("/job-images/:jobId", async (req, res) => {
  const jobId = Number(req.params.jobId);

  if (!jobId) {
    return res.status(400).json({ error: "Invalid Job ID" });
  }

  try {
    const sql = `
      SELECT 
        img."Id",
        img."ImagePath",
        item."Id" AS "PreWalkItemId",
        list."Id" AS "PreWalkListId"
      FROM "PreWalkImages" img
      JOIN "PreWalkItems" item
        ON img."PreWalkItemId" = item."Id"
      JOIN "PreWalkLists" list
        ON item."PreWalkListId" = list."Id"
      WHERE list."JobId" = $1
      ORDER BY img."Id" ASC;
    `;

    const result = await pool.query(sql, [jobId]);

    res.json(result.rows);
    
  } catch (err) {
    console.error("❌ Error loading job images:", err);
    res.status(500).json({
      error: "Server error fetching job images",
      details: err.message
    });
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
// GET 20 LIEN NUMBER JOBS
// ================================
app.get("/jobs/lien", async (req, res) => {
  try {
    const sql = `
      SELECT 
        "Id" AS job_id,
        "Name" AS job_name,
        "LienNumber" AS lien_number
      FROM "Jobs"
      WHERE "LienNumber" IS NOT NULL
      ORDER BY "Id" DESC
      LIMIT 20
    `;

    const r = await pool.query(sql);
    res.json(r.rows);

  } catch (err) {
    console.error("Lien jobs error:", err);
    res.status(500).json({ error: "Server error fetching lien jobs" });
  }
});

// GET subcontractors from Users table (non-Vanir emails)
// =========================================
app.get("/subcontractors-users", async (req, res) => {
  try {
    console.log("🔵 /subcontractors-users called…");

    const sql = `
      SELECT 
        u."Id",
        u."EmailAddress" AS "UserName",
        u."Name",
        u."Surname",
        u."StoreId",
        s."Name" AS "StoreName"
      FROM public."AbpUsers" u
      LEFT JOIN public."Stores" s ON s."Id" = u."StoreId"
      WHERE u."IsDeleted" = false
        AND LOWER(u."EmailAddress") NOT LIKE '%vanir%'
        AND LOWER(u."EmailAddress") NOT LIKE '%techverx%'
      ORDER BY u."EmailAddress" ASC;
    `;

    const userResult = await pool.query(sql);
    const users = userResult.rows;

    // Airtable records
    const airtableRecords = await airtable(process.env.AIRTABLE_TABLE)
      .select({ view: process.env.AIRTABLE_VIEW })
      .all();

    // Email → Airtable lookup
    const recordMap = {};
    airtableRecords.forEach((r) => {
      const email = (r.get("Subcontractor Email") || "").toLowerCase();
      if (email) {
        recordMap[email] = { ...r.fields, id: r.id };
      }
    });

    // Merge
    const merged = users.map((u) => {
      const email = (u.UserName || "").toLowerCase();
      const air = recordMap[email] || {};

      // Direct map of expiration fields (top-level)
      return {
        ...u,

        GeneralLiability: air["General Liability Expiration Date"] || null,
        WorkersComp: air["Worker's Comp Expiration Date"] || null,
        AutoLiability: air["Auto Liability Expiration Date"] || null,

        // Nested Airtable extras
        Specialty: air["Specialty"] || [],
        COI: air["COI"] || [],

        AirtableId: air.id || null
      };
    });

    res.json(merged);

  } catch (err) {
    console.error("❌ Users subcontractor error:", err);
    res.status(500).json({ error: "Server error loading subcontractors" });
  }
});



//
// ---------------- SUBCONTRACTORS CRUD ----------------
//

// GET all
app.get("/subcontractors", async (req, res) => {
  try {
    const q = `
      SELECT * 
      FROM public."SubContractorForms"
      ORDER BY "Id" ASC
    `;
    const r = await pool.query(q);
    res.json(r.rows);
  } catch (err) {
    console.error("❌ /subcontractors GET error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET one by ID
app.get("/subcontractors/:id", async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT * FROM public."SubContractorForms" WHERE "Id" = $1`,
      [req.params.id]
    );
    res.json(r.rows[0] || null);
  } catch (err) {
    console.error("❌ /subcontractors/:id error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// CREATE
app.post("/subcontractors", async (req, res) => {
  try {
    const { installername, contractorname, contractortitle, userid } = req.body;

    const r = await pool.query(
      `
      INSERT INTO public."SubContractorForms"
      ("InstallerName", "ContractorName", "ContractorTitle", "UserId", "CreationTime", "IsDeleted")
      VALUES ($1, $2, $3, $4, NOW(), false)
      RETURNING *
    `,
      [installername, contractorname, contractortitle, userid]
    );

    res.json(r.rows[0]);
  } catch (err) {
    console.error("❌ POST /subcontractors error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// UPDATE
app.put("/subcontractors/:id", async (req, res) => {
  try {
    const { installername, contractorname, contractortitle, userid } = req.body;

    const r = await pool.query(
      `
      UPDATE public."SubContractorForms"
      SET "InstallerName"=$1,
          "ContractorName"=$2,
          "ContractorTitle"=$3,
          "UserId"=$4,
          "LastModificationTime"=NOW()
      WHERE "Id"=$5
      RETURNING *
      `,
      [installername, contractorname, contractortitle, userid, req.params.id]
    );

    res.json(r.rows[0]);
  } catch (err) {
    console.error("❌ PUT /subcontractors error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// SOFT DELETE
app.delete("/subcontractors/:id", async (req, res) => {
  try {
    const r = await pool.query(
      `
      UPDATE public."SubContractorForms"
      SET "IsDeleted" = true,
          "DeletionTime" = NOW()
      WHERE "Id" = $1
      RETURNING *
      `,
      [req.params.id]
    );

    res.json(r.rows[0]);
  } catch (err) {
    console.error("❌ DELETE /subcontractors error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// RESTORE
app.post("/subcontractors/restore/:id", async (req, res) => {
  try {
    const r = await pool.query(
      `
      UPDATE public."SubContractorForms"
      SET "IsDeleted" = false,
          "DeletionTime" = null
      WHERE "Id" = $1
      RETURNING *
      `,
      [req.params.id]
    );

    res.json(r.rows[0]);
  } catch (err) {
    console.error("❌ RESTORE /subcontractors error:", err);
    res.status(500).json({ error: "Server error" });
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
  J."LienNumber" AS lien_number,  -- ✅ ADD THIS
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

WHERE 1=1

ORDER BY J."CreationTime" DESC
LIMIT 30000;

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
    const r = await pool.query(`
      SELECT "Id", "Name"
      FROM public."Stores"
      ORDER BY "Name" ASC
    `);
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
    const r = await pool.query(`
      SELECT 
        C."Id" AS community_id,
        C."Name" AS community_name,
        C."StoreId",
        C."LaborReduction",
        BC."BuilderId",
        B."Name" AS builder_name
      FROM public."Communities" C
      LEFT JOIN public."BuilderCommunities" BC 
        ON BC."CommunityId" = C."Id"
      LEFT JOIN public."Builders" B 
        ON B."Id" = BC."BuilderId"
      ORDER BY C."StoreId", C."Name" ASC
    `);

    const map = {};

    r.rows.forEach(row => {
      if (!map[row.community_id]) {
        map[row.community_id] = {
          Id: row.community_id,
          Name: row.community_name,
          StoreId: row.StoreId,
          LaborReduction: row.LaborReduction,
          builders: []
        };
      }

      if (row.BuilderId) {
        map[row.community_id].builders.push({
          id: row.BuilderId,
          name: row.builder_name
        });
      }
    });

    res.json(Object.values(map));

  } catch (err) {
    console.error("Communities error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/constructionmanagers", async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT 
        "Id",
        "FullName",
        "PhoneNumber",
        "BuilderId",
        "StoreId"
      FROM public."ConstructionManagers"
      WHERE "IsDeleted" = false
      ORDER BY "StoreId", "BuilderId", "FullName"
    `);

    res.json(r.rows);
  } catch (err) {
    console.error("ConstructionManagers error:", err);
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
