import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 블로그 포스트 목록 페이지 생성 (실무 예제)
function buildBlogList() {
  console.log("📝 블로그 목록 페이지 빌드 시작...");

  // 포스트 데이터 읽기 (실무에서는 CMS, API, 마크다운 파일 등에서 가져옴)
  const postsData = JSON.parse(fs.readFileSync(path.join(__dirname, "posts.json"), "utf-8"));
  const buildTime = new Date().toLocaleString("ko-KR");

  // HTML 템플릿 읽기
  const template = fs.readFileSync(path.join(__dirname, "ssg.html"), "utf-8");

  // 포스트 목록 HTML 생성
  const postsHTML = postsData
    .map(
      (post) => `
    <article style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px; background: white;">
      <h2 style="margin: 0 0 10px 0; color: #1f2937;">
        <a href="/post/${post.id}" style="text-decoration: none; color: inherit;">${post.title}</a>
      </h2>
      <p style="color: #6b7280; margin: 10px 0; line-height: 1.5;">${post.summary}</p>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; font-size: 14px; color: #9ca3af;">
        <span>작성자: ${post.author}</span>
        <span>${post.date}</span>
      </div>
    </article>
  `,
    )
    .join("");

  // 완성된 HTML 생성
  const html = template.replace(
    "<body></body>",
    `<body>
      <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; min-height: 100vh;">
        <header style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #1f2937; margin: 0; font-size: 2.5rem;">개발 블로그</h1>
          <p style="color: #6b7280; margin: 10px 0;">SSG로 생성된 정적 블로그 목록</p>
          <small style="color: #9ca3af;">빌드 시간: ${buildTime}</small>
        </header>

        <main>
          ${postsHTML}
        </main>

        <footer style="text-align: center; margin-top: 40px; padding: 20px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
          <p>총 ${postsData.length}개의 포스트 | Static Site Generated</p>
        </footer>
      </div>
    </body>`,
  );

  // 파일 저장
  const outputPath = path.join(__dirname, "generated-ssg.html");
  fs.writeFileSync(outputPath, html, "utf-8");

  console.log("✅ 블로그 목록 페이지 빌드 완료!");
  console.log(`📁 생성된 파일: ${outputPath}`);
  console.log(`📄 포스트 수: ${postsData.length}개`);
}

// 빌드 실행
buildBlogList();
