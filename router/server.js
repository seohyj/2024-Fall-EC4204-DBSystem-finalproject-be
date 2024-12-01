const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("../module/db"); // db.js 모듈을 가져옴

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Login API
app.post("/api/login", (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res
      .status(400)
      .json({ message: "You must enter your ID to login." });
  }

  const query = "SELECT * FROM User WHERE user_id = ?";
  db.query(query, [user_id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Server Error" });
    }

    if (results.length > 0) {
      res.json({ success: true, message: "Successfully Logged In" });
    } else {
      res.status(401).json({ message: "Invalid UserID" });
    }
  });
});

// Run Server
const PORT = 5001; // Use 5001 Port for API Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}.`);
});
