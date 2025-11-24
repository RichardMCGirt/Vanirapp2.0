// backend/routes/jobs.js
const express = require("express");
const router = express.Router();
const pool = require("../db");

//
//-----------------------------------------------------
//  GET ALL JOBS (SUMMARY LIST)
//-----------------------------------------------------
//
router.get("/", async (req, res) => {
  try {
    const sql = `
      SELECT 
        j."Id" AS job_id,
        j."Name" AS job_name,
        s."Name" AS store_name,
        j."Status",
        j."CreationTime"
      FROM public."Jobs" j
      LEFT JOIN public."Stores" s ON s."Id" = j."StoreId"
      ORDER BY j."Id" DESC
    `;

    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error("🔥 Error loading jobs:", err);
    res.status(500).json({ error: "Server error" });
  }
});

//
//-----------------------------------------------------
//  GET JOB DETAILS PAGE
//-----------------------------------------------------
//
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const jobSQL = `
      SELECT 
        j.*, 
        s."Name" AS store_name
      FROM public."Jobs" j
      LEFT JOIN public."Stores" s ON s."Id" = j."StoreId"
      WHERE j."Id" = $1
    `;

    const materialsSQL = `
      SELECT * FROM public."Materials"
      WHERE "JobId" = $1
    `;

    const punchSQL = `
      SELECT * FROM public."PunchItems"
      WHERE "JobId" = $1
    `;

    const contractorsSQL = `
      SELECT 
        jc.*, 
        t."Name" AS trade_name
      FROM public."JobContractors" jc
      LEFT JOIN public."Trades" t ON t."Id" = jc."Type"
      WHERE jc."JobId" = $1
    `;

    const [job, materials, punch, contractors] = await Promise.all([
      pool.query(jobSQL),
      pool.query(materialsSQL),
      pool.query(punchSQL),
      pool.query(contractorsSQL),
    ]);

    res.json({
      job: job.rows[0],
      materials: materials.rows,
      punchitems: punch.rows,
      contractors: contractors.rows,
    });
  } catch (err) {
    console.error("🔥 Job details error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

//
//-----------------------------------------------------
//  UNPAID SUBCONTRACTORS
//  → MATCHES YOUR SCREENSHOT: JobContractors.IsPaid = false
//-----------------------------------------------------
//
router.get("/unpaid", async (req, res) => {
  try {
    const sql = `
      SELECT
        j."Id" AS job_id,
        j."Name" AS job_name,
        s."Name" AS store_name,
        jc."IsPaid",
        jc."Type" AS trade_id,
        t."Name" AS trade_name
      FROM public."Jobs" j
      LEFT JOIN public."JobContractors" jc ON jc."JobId" = j."Id"
      LEFT JOIN public."Trades" t ON t."Id" = jc."Type"
      LEFT JOIN public."Stores" s ON s."Id" = j."StoreId"
      WHERE jc."IsPaid" = false
      ORDER BY j."Id" DESC
    `;

    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error("🔥 Unpaid jobs SQL error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

//
//-----------------------------------------------------
//  MEASUREMENTS NEEDED
//  → Your DB uses Job.MeasurementStatus (0 = needs measurement)
//-----------------------------------------------------
//
router.get("/measurements", async (req, res) => {
  try {
    const sql = `
      SELECT
        j."Id" AS job_id,
        j."Name" AS job_name,
        j."MeasurementStatus",
        s."Name" AS store_name
      FROM public."Jobs" j
      LEFT JOIN public."Stores" s ON s."Id" = j."StoreId"
      WHERE j."MeasurementStatus" = 0 OR j."MeasurementStatus" IS NULL
      ORDER BY j."Id" DESC
    `;

    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error("🔥 Measurement jobs error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

//
//-----------------------------------------------------
//  ONBOARDING (OPEN PUNCH ITEMS)
//  → Uses Job.IsUnresolvedPunchItem = true
//-----------------------------------------------------
//
router.get("/onboard", async (req, res) => {
  try {
    const sql = `
      SELECT
        j."Id" AS job_id,
        j."Name" AS job_name,
        j."IsUnresolvedPunchItem",
        j."Status",
        s."Name" AS store_name
      FROM public."Jobs" j
      LEFT JOIN public."Stores" s ON s."Id" = j."StoreId"
      WHERE j."IsUnresolvedPunchItem" = true
      ORDER BY j."Id" DESC
    `;

    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error("🔥 Onboard jobs error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
