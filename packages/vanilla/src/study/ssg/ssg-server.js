import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// import.meta.url: 현재 모듈 파일의 위치를 나타내는 file:// 프로토콜 기반의 URL 문자열을 반환합니다.
// fileURLToPath(import.meta.url): file:// URL을 로컬 파일 시스템 경로로 변환해 줍니다.
const __filename = fileURLToPath(import.meta.url);
// 현재 파일의 폴더 경로를 가져옴
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 5175; // SSR과 포트 구분

const app = express();

// SSG: 미리 생성된 정적 HTML 파일을 서빙
app.get("/", (req, res) => {
  const generatedFilePath = path.join(__dirname, "generated-ssg.html");

  // 미리 생성된 파일이 있는지 확인
  if (fs.existsSync(generatedFilePath)) {
    console.log("📄 미리 생성된 SSG 파일을 서빙합니다.");
    res.sendFile(generatedFilePath);
  } else {
    // 빌드되지 않은 경우 안내 메시지
    res.send(`
      <div style="max-width: 600px; margin: 50px auto; padding: 20px; font-family: Arial, sans-serif; text-align: center;">
        <h1 style="color: #dc2626;">⚠️ SSG 파일이 생성되지 않았습니다</h1>
        <p>먼저 다음 명령어로 SSG 빌드를 실행해주세요:</p>
        <code style="background: #f3f4f6; padding: 10px; border-radius: 5px; display: block; margin: 20px 0;">
          node build-ssg.js
        </code>
        <p>빌드 후 서버를 다시 시작하면 미리 생성된 HTML을 확인할 수 있습니다.</p>
      </div>
    `);
  }
});

app.listen(port, () => {
  console.log(`SSG Server started at http://localhost:${port}`);
});
