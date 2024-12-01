const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

// 라우터 가져오기
const userRouter = require("./router/user");
const reservationRouter = require("./router/reservation");
const reviewRouter = require("./router/review");
const teamsRouter = require("./router/teams");

const app = express();

// CORS 설정
app.use(
  cors({ origin: "*", methods: "GET,POST,PUT,DELETE", credentials: true })
);

// JSON 파싱 미들웨어
app.use(bodyParser.json());
app.use(express.json());

// 라우터 설정
app.use("/api/user", userRouter);
app.use("/api/reservation", reservationRouter);
app.use("/api/review", reviewRouter);
app.use("/api/team", teamsRouter);

// 서버 실행
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
