import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 5176; // 다른 서버들과 포트 구분
const app = express();

// ISR 캐시 설정
const REVALIDATE_TIME = 10; // 10초마다 재생성 (실무에서는 보통 60초 이상)
const cache = new Map(); // 메모리 캐시 (실무에서는 Redis 등 사용)

// 블로그 데이터 가져오기 (실시간 데이터 시뮬레이션)
function getBlogData() {
  const posts = JSON.parse(fs.readFileSync(path.join(__dirname, "posts.json"), "utf-8"));

  // 실시간 데이터 시뮬레이션 (조회수, 댓글 수 등)
  return posts.map((post) => ({
    ...post,
    views: Math.floor(Math.random() * 1000) + 100, // 랜덤 조회수
    comments: Math.floor(Math.random() * 50) + 1, // 랜덤 댓글 수
    lastUpdated: new Date().toLocaleString("ko-KR"),
  }));
}

// HTML 생성 함수
function generateHTML(posts, generatedAt, isRegenerated = false) {
  const template = fs.readFileSync(path.join(__dirname, "isr.html"), "utf-8");

  const postsHTML = posts
    .map(
      (post) => `
    <article style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px; background: white; position: relative;">
      ${isRegenerated ? '<div style="position: absolute; top: 10px; right: 10px; background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">🔄 재생성됨</div>' : ""}
      <h2 style="margin: 0 0 10px 0; color: #1f2937;">
        <a href="/post/${post.id}" style="text-decoration: none; color: inherit;">${post.title}</a>
      </h2>
      <p style="color: #6b7280; margin: 10px 0; line-height: 1.5;">${post.summary}</p>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; font-size: 14px;">
        <div style="color: #9ca3af;">
          <span>작성자: ${post.author}</span> | 
          <span>${post.date}</span>
        </div>
        <div style="color: #059669; font-weight: bold;">
          👀 ${post.views} | 💬 ${post.comments}
        </div>
      </div>
      <div style="font-size: 12px; color: #9ca3af; margin-top: 8px;">
        데이터 업데이트: ${post.lastUpdated}
      </div>
    </article>
  `,
    )
    .join("");

  return template.replace(
    "<body></body>",
    `<body>
      <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; min-height: 100vh;">
        <header style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #1f2937; margin: 0; font-size: 2.5rem;">개발 블로그 (ISR)</h1>
          <p style="color: #6b7280; margin: 10px 0;">Incremental Static Regeneration으로 구현된 블로그</p>
          <div style="background: #fef3c7; padding: 10px; border-radius: 8px; margin: 20px 0; border: 1px solid #f59e0b;">
            <small style="color: #92400e;">
              📊 페이지 생성 시간: ${generatedAt}<br>
              🔄 재생성 주기: ${REVALIDATE_TIME}초<br>
              💡 조회수와 댓글 수는 실시간으로 변경됩니다
            </small>
          </div>
        </header>

        <main>
          ${postsHTML}
        </main>

        <footer style="text-align: center; margin-top: 40px; padding: 20px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
          <p>총 ${posts.length}개의 포스트 | ISR (${REVALIDATE_TIME}초마다 백그라운드 재생성)</p>
          <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
            🔄 새로고침해서 변화 확인
          </button>
        </footer>
      </div>
    </body>`,
  );
}

// ISR 로직: 캐시된 페이지 제공 + 백그라운드 재생성
app.get("/", async (req, res) => {
  const cacheKey = "blog-list";
  const now = Date.now();

  // 캐시에서 데이터 확인
  const cached = cache.get(cacheKey);

  if (cached && now - cached.timestamp < REVALIDATE_TIME * 1000) {
    // 캐시가 유효한 경우: 즉시 캐시된 페이지 반환
    console.log("📄 캐시된 페이지 제공");
    res.send(cached.html);
    return;
  }

  if (cached) {
    // 캐시가 만료된 경우: 기존 페이지를 먼저 반환하고 백그라운드에서 재생성
    console.log("⚡ 기존 페이지 제공 + 백그라운드 재생성 시작");
    res.send(cached.html);

    // 백그라운드에서 재생성
    setTimeout(() => {
      console.log("🔄 백그라운드에서 페이지 재생성 중...");
      const posts = getBlogData();
      const generatedAt = new Date().toLocaleString("ko-KR");
      const html = generateHTML(posts, generatedAt, true);

      // 캐시 업데이트
      cache.set(cacheKey, {
        html,
        timestamp: Date.now(),
      });
      console.log("✅ 백그라운드 재생성 완료");
    }, 100); // 100ms 후 백그라운드 재생성

    return;
  }

  // 캐시가 없는 경우: 새로 생성 (첫 방문)
  console.log("🆕 첫 방문 - 새 페이지 생성");
  const posts = getBlogData();
  const generatedAt = new Date().toLocaleString("ko-KR");
  const html = generateHTML(posts, generatedAt);

  // 캐시에 저장
  cache.set(cacheKey, {
    html,
    timestamp: now,
  });

  res.send(html);
});

app.listen(port, () => {
  console.log(`🔄 ISR Server started at http://localhost:${port}`);
  console.log(`⏰ 재생성 주기: ${REVALIDATE_TIME}초`);
  console.log(`📊 캐시 상태: http://localhost:${port}/cache-status`);
});
