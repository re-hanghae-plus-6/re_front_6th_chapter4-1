import express from "express";
import { generateHTML } from "./src/ssr.js";
// import { model } from "./src/model.js";

// const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
// const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/vanilla/" : "/");

const app = express();

// JSON 요청 본문을 파싱하는 미들웨어 추가
app.use(express.json());

// static 파일 등록
app.use("/src", express.static("./src"));

app.get("*all", (req, res) => {
  res.send(generateHTML({ todoItems: ["test", "test"] }));
});

// Start http server
app.listen(port, () => {
  console.log(`React Server started at http://localhost:${port}`);
});
