const express = require("express");
const router = express.Router();
const { query } = require("../module/db");

// 팀 정보 조회
router.get("/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    const teams = await query(
      `
      SELECT 
        t.team_id, 
        t.team_name, 
        GROUP_CONCAT(u.name) AS team_members
      FROM User_Team ut
      INNER JOIN Team t ON ut.team_id = t.team_id
      INNER JOIN User u ON ut.user_id = u.user_id
      WHERE ut.team_id IN (
        SELECT team_id FROM User_Team WHERE user_id = ?
      )
      GROUP BY t.team_id
      `,
      [user_id]
    );
    res.json(teams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch team information." });
  }
});

// 팀 등록
router.post("/", async (req, res) => {
  const { team_id, team_name, user_ids } = req.body;

  if (!team_id || !team_name || !user_ids || user_ids.length === 0) {
    return res.status(400).json({ message: "Invalid team data." });
  }

  try {
    await query("INSERT INTO Team (team_id, team_name) VALUES (?, ?)", [
      team_id,
      team_name,
    ]);

    for (const user_id of user_ids) {
      await query("INSERT INTO User_Team (user_id, team_id) VALUES (?, ?)", [
        user_id,
        team_id,
      ]);
    }

    res.json({ success: true, message: "Team registered successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to register team." });
  }
});

module.exports = router;
