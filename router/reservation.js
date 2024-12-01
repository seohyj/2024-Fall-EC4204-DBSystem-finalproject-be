const express = require("express");
const router = express.Router();
const { query } = require("../module/db");

// 예약 조회
router.get("/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    const reservations = await query(
      `
      SELECT 
        r.reservation_id,
        rt.date, 
        rt.start_time,
        rt.end_time,
        s.name AS space_name, 
        s.cost 
      FROM Reservation r
      INNER JOIN Reservation_Time rt ON r.reservation_time_id = rt.reservation_time_id
      INNER JOIN Space s ON r.space_id = s.space_id
      WHERE r.user_id = ?
      ORDER BY rt.date DESC
      `,
      [user_id]
    );

    res.json(reservations);
  } catch (err) {
    console.error("Error fetching reservations:", err);
    res.status(500).json({ message: "Failed to fetch reservations." });
  }
});

module.exports = router;

// user 예약 생성
router.post("/", async (req, res) => {
  const { user_id, space_id, reservation_time_id, purpose_id } = req.body;

  if (!user_id || !space_id || !reservation_time_id || !purpose_id) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const result = await query(
      "INSERT INTO Reservation (user_id, space_id, reservation_time_id, purpose_id) VALUES (?, ?, ?, ?)",
      [user_id, space_id, reservation_time_id, purpose_id]
    );
    res.json({ success: true, reservation_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create reservation." });
  }
});

module.exports = router;
