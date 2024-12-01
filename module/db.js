const mysql2 = require("mysql2");
const util = require("util");

const db = mysql2.createConnection({
  host: "localhost", // MySQL 서버 주소
  user: "root", // MySQL 사용자 이름
  password: "1234", // MySQL 비밀번호
  database: "ec4204", // 데이터베이스 이름
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
  } else {
    console.log("Connected to MySQL");
  }
});

const query = util.promisify(db.query).bind(db);

module.exports = { db, query };
