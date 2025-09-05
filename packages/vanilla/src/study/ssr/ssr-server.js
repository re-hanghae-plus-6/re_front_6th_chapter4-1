import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// import.meta.url: 현재 모듈 파일의 위치를 나타내는 file:// 프로토콜 기반의 URL 문자열을 반환합니다.
// fileURLToPath(import.meta.url): file:// URL을 로컬 파일 시스템 경로로 변환해 줍니다.
const __filename = fileURLToPath(import.meta.url);
// 현재 파일의 폴더 경로를 가져옴
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 5174;

const app = express();

function getServerData() {
  return {
    message: "서버에서 생성된 메시지입니다!",
    time: new Date().toLocaleString("ko-KR"),
  };
}

app.get("/", (req, res) => {
  // ssr.html 파일을 읽어옴
  const htmlTemplate = fs.readFileSync(path.join(__dirname, "ssr.html"), "utf-8");

  // 서버에서 데이터 처리
  const data = getServerData();

  // HTML 템플릿에 데이터를 삽입하여 완성된 HTML 생성
  const renderedHTML = htmlTemplate.replace(
    "<body></body>",
    `<body>
      <h1>${data.message}</h1>
      <p>생성 시간: ${data.time}</p>
      <p>이 내용은 서버에서 미리 렌더링되었습니다.</p>
    </body>`,
  );

  res.send(renderedHTML);
});

app.listen(port, () => {
  console.log(`SSR Server started at http://localhost:${port}`);
});
