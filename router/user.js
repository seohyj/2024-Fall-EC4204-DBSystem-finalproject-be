const express = require("express");
const router = express.Router();
const { query } = require("../module/db"); // db.js에서 query 함수 가져옴

// Login API
router.post("/", async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res
      .status(400)
      .json({ message: "You must enter your ID to login." });
  }

  try {
    // DB에서 user_id 조회
    const result = await query("SELECT * FROM User WHERE user_id = ?", [
      user_id,
    ]);

    if (result.length > 0) {
      const user_name = result[0].name; // User 테이블에서 name 가져오기
      res.json({
        success: true,
        message: "Successfully Logged In",
        user_name: user_name,
      });
    } else {
      res.status(401).json({ message: "Invalid UserID" });
    }
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
