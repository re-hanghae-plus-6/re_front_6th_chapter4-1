import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// import.meta.url: 현재 모듈 파일의 위치를 나타내는 file:// 프로토콜 기반의 URL 문자열을 반환합니다.
// fileURLToPath(import.meta.url): file:// URL을 로컬 파일 시스템 경로로 변환해 줍니다.
const __filename = fileURLToPath(import.meta.url);
// 현재 파일의 폴더 경로를 가져옴
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 5173;
// const prod = process.env.NODE_ENV === "production";
// const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/vanilla/" : "/");

const app = express();

app.get("/main.js", (req, res) => {
  res.sendFile(path.join(__dirname, "main.js"));
});

app.get("*all", (req, res) => {
  res.sendFile(path.join(__dirname, "test.html"));
});

app.listen(port, () => {
  console.log(`React Server started at http://localhost:${port}`);
});
