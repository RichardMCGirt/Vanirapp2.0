const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");

router.get("/job/:id", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM public."JobContractors" WHERE "JobId" = $1`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
