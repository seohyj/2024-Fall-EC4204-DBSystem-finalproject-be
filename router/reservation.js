const express = require("express");
const router = express.Router();
const { query } = require("../module/db");

// Fetch all reservations for a specific user
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

// Fetch all spaces
router.get("/spaces", async (req, res) => {
  try {
    const spaces = await query("SELECT space_id, name FROM Space");
    res.json(spaces);
  } catch (err) {
    console.error("Error fetching spaces:", err);
    res.status(500).json({ message: "Failed to fetch spaces." });
  }
});

// Fetch available times for a specific space and date
router.get("/available-times", async (req, res) => {
  const { space_id, date } = req.query;

  if (!space_id || !date) {
    return res.status(400).json({ message: "Space ID and date are required." });
  }

  try {
    const allTimes = Array.from({ length: 24 }, (_, i) => ({
      start_time: `${String(i).padStart(2, "0")}:00:00`,
      end_time: `${String(i + 1).padStart(2, "0")}:00:00`,
    }));

    const reservedTimes = await query(
      `
      SELECT rt.start_time, rt.end_time 
      FROM Reservation r
      INNER JOIN Reservation_Time rt ON r.reservation_time_id = rt.reservation_time_id
      WHERE r.space_id = ? AND rt.date = ?
      `,
      [space_id, date]
    );

    const availableTimes = allTimes.filter(
      (time) =>
        !reservedTimes.some(
          (reserved) =>
            reserved.start_time === time.start_time &&
            reserved.end_time === time.end_time
        )
    );

    res.json(availableTimes);
  } catch (err) {
    console.error("Error fetching available times:", err);
    res.status(500).json({ message: "Failed to fetch available times." });
  }
});

// Create a reservation
router.post("/", async (req, res) => {
  const { user_id, team_id, space_id, time_slot, date, purpose_id } = req.body;

  if (
    (!user_id && !team_id) || // 하나는 반드시 존재해야 함
    (user_id && team_id) || // 둘 다 존재하면 안 됨
    !space_id ||
    !time_slot ||
    !date ||
    !purpose_id
  ) {
    return res
      .status(400)
      .json({ message: "Invalid reservation data: Check user/team fields." });
  }

  try {
    const [start_time, end_time] = time_slot.split(" - ");

    // Step 1: reservation_time_id 확인 또는 생성
    let reservation_time_id;
    const [existingTime] = await query(
      "SELECT reservation_time_id FROM Reservation_Time WHERE start_time = ? AND end_time = ? AND date = ?",
      [start_time, end_time, date]
    );

    if (existingTime) {
      reservation_time_id = existingTime.reservation_time_id;
    } else {
      const timeInsertResult = await query(
        "INSERT INTO Reservation_Time (start_time, end_time, date) VALUES (?, ?, ?)",
        [start_time, end_time, date]
      );
      reservation_time_id = timeInsertResult.insertId;
    }

    // Step 2: 중복 예약 검증
    const [existingReservation] = await query(
      "SELECT reservation_id FROM Reservation WHERE space_id = ? AND reservation_time_id = ?",
      [space_id, reservation_time_id]
    );

    if (existingReservation) {
      return res
        .status(400)
        .json({ message: "This time slot is already reserved for the space." });
    }

    // Step 3: 예약 생성
    const reservationResult = await query(
      "INSERT INTO Reservation (user_id, team_id, space_id, reservation_time_id, purpose_id) VALUES (?, ?, ?, ?, ?)",
      [
        user_id || null,
        team_id || null,
        space_id,
        reservation_time_id,
        purpose_id,
      ]
    );

    res.json({
      success: true,
      reservation_id: reservationResult.insertId,
    });
  } catch (err) {
    console.error("Error creating reservation:", err);
    res.status(500).json({ message: "Failed to create reservation." });
  }
});

module.exports = router;
