const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");

router.post("/login", async (req, res) => {
  const { email } = req.body;

  try {
    const result = await pool.query(
      `SELECT "Id", "EmailAddress", "Name" FROM public."AbpUsers" WHERE "EmailAddress" = $1`,
      [email]
    );

    if (result.rows.length === 0)
      return res.status(401).json({ error: "User not found" });

    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.Id, email: user.EmailAddress },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
