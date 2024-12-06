const express = require("express");
const router = express.Router();
const { query } = require("../module/db");

// Fetch reservations for a specific user
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const reservations = await query(
      `SELECT r.reservation_id, r.space_id, s.name AS space_name, rt.date, rt.start_time, rt.end_time, r.purpose_id, p.description AS purpose, s.cost
         FROM Reservation r
         INNER JOIN Reservation_Time rt ON r.reservation_time_id = rt.reservation_time_id
         INNER JOIN Space s ON r.space_id = s.space_id
         INNER JOIN Purpose p ON r.purpose_id = p.purpose_id
         WHERE r.user_id = ? OR r.team_id IN (SELECT team_id FROM User_Team WHERE user_id = ?)`,
      [userId, userId]
    );

    res.json(reservations);
  } catch (err) {
    console.error("Error fetching reservations:", err);
    res.status(500).json({ message: "Failed to fetch reservations." });
  }
});

// Fetch all reservation times
router.get("/", async (req, res) => {
  try {
    const reservationTimes = await query(
      "SELECT reservation_time_id, start_time, end_time, date FROM Reservation_Time"
    );
    res.json(reservationTimes);
  } catch (err) {
    console.error("Error fetching reservation times:", err);
    res.status(500).json({ message: "Failed to fetch reservation times." });
  }
});

// Insert a new reservation time
router.post("/", async (req, res) => {
  const { start_time, end_time, date } = req.body;

  if (!start_time || !end_time || !date) {
    return res
      .status(400)
      .json({ message: "Start time, end time, and date are required." });
  }

  try {
    // 기존의 시간 슬롯 확인
    const [existingTime] = await query(
      "SELECT reservation_time_id FROM Reservation_Time WHERE start_time = ? AND end_time = ? AND date = ?",
      [start_time, end_time, date]
    );

    if (existingTime) {
      return res.json({
        success: true,
        reservation_time_id: existingTime.reservation_time_id,
      });
    }

    // 새로운 시간 슬롯 생성
    const result = await query(
      "INSERT INTO Reservation_Time (start_time, end_time, date) VALUES (?, ?, ?)",
      [start_time, end_time, date]
    );

    res.json({
      success: true,
      reservation_time_id: result.insertId,
    });
  } catch (err) {
    console.error("Error creating or fetching reservation time:", err);
    res
      .status(500)
      .json({ message: "Failed to create or fetch reservation time." });
  }
});

module.exports = router;
