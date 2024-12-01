const express = require("express");
const router = express.Router();
const { query } = require("../module/db");

// 리뷰 추가
router.post("/", async (req, res) => {
  const { reservation_id, rating, comment } = req.body;

  // 필수 필드 확인
  if (!reservation_id || !rating || isNaN(rating)) {
    return res.status(400).json({
      message: "Reservation ID and a valid numeric rating are required.",
    });
  }

  try {
    // 예약 ID가 유효한지 확인
    const [reservation] = await query(
      "SELECT reservation_id FROM Reservation WHERE reservation_id = ?",
      [reservation_id]
    );

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found." });
    }

    // 리뷰 추가
    const result = await query(
      "INSERT INTO Review (rating, comment) VALUES (?, ?)",
      [parseInt(rating, 10), comment || null]
    );

    // 추가된 리뷰 ID를 가져옴
    const review_id = result.insertId;

    // Reservation 테이블에 review_id 업데이트
    await query(
      "UPDATE Reservation SET review_id = ? WHERE reservation_id = ?",
      [review_id, reservation_id]
    );

    res.json({ success: true, message: "Review submitted successfully." });
  } catch (err) {
    console.error("Error submitting review:", err);
    res.status(500).json({ message: "Failed to submit review." });
  }
});

module.exports = router;
