const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

// Import routers
const userRouter = require("./router/user");
const reservationRouter = require("./router/reservation");
const reviewRouter = require("./router/review");
const teamsRouter = require("./router/teams");
const reservationTimeRouter = require("./router/reservation_time");
const searchRouter = require("./router/search");

const app = express();

// CORS configuration
app.use(
  cors({ origin: "*", methods: "GET,POST,PUT,DELETE", credentials: true })
);
app.use(bodyParser.json());
app.use(express.json());

// Router setup
app.use("/api/user", userRouter);
app.use("/api/reservation", reservationRouter);
app.use("/api/reservation_time", reservationTimeRouter);
app.use("/api/review", reviewRouter);
app.use("/api/team", teamsRouter);
app.use("/api/search", searchRouter);

// Server startup
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
