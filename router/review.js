const express = require("express");
const router = express.Router();
const { query } = require("../module/db");

// 리뷰 추가
router.post("/", async (req, res) => {
  const { reservation_id, rating, comment } = req.body;

  if (!reservation_id || !rating) {
    return res
      .status(400)
      .json({ message: "Reservation ID and rating are required." });
  }

  try {
    await query(
      "INSERT INTO Review (reservation_id, rating, comment) VALUES (?, ?, ?)",
      [reservation_id, rating, comment || null]
    );
    res.json({ success: true, message: "Review submitted successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to submit review." });
  }
});

module.exports = router;
