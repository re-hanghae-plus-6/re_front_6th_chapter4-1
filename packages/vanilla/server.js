import express from "express";
import fs from "fs";

//핵심 키워드: middleware, template, render, hydration

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5174;
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/vanilla/" : "/");

// MSW 서버를 가장 먼저 시작하여 모든 fetch 요청을 인터셉트할 수 있도록 함
const { mswServer } = await import("./src/mocks/server.js");
mswServer.listen({
  onUnhandledRequest: "bypass",
});

// Create http server
const app = express();

// Add Vite or respective production middlewares
/** @type {import('vite').ViteDevServer | undefined} */
let vite;
if (!prod) {
  const { createServer } = await import("vite");

  // 미들웨어 모드로 Vite 서버를 생성하고 애플리케이션의 타입을 'custom'으로 설정합니다.
  // 이는 Vite의 자체 HTML 제공 로직을 비활성화하고,
  // 상위 서버에서 이를 제어할 수 있도록 합니다.
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    base,
  });

  // Vite를 미들웨어로 사용합니다.
  // 만약 Express 라우터(express.Router())를 사용하는 경우, router.use를 사용해야 합니다.
  // 서버가 다시 시작되어도(예: 사용자가 vite.config.js를 수정한 후)
  // 새로운 내부 스택의 Vite 및 플러그인이 주입된 미들웨어를 포함해,
  // `vite.middlewares`는 여전히 동일한 참조를 유지합니다.
  // 다음은 재시작 후에도 유효합니다.
  app.use(vite.middlewares);
} else {
  const compression = (await import("compression")).default;
  app.use(compression());

  // 프로덕션에서 정적 파일 처리 (JS, CSS 등)
  const sirv = (await import("sirv")).default;
  app.use(base, sirv("./dist/vanilla", { extensions: [] }));
}

// 모든 페이지 라우트를 SSR로 처리
app.get("/{*splat}", async (req, res) => {
  // index.html 파일을 제공합니다
  try {
    // 1. index.html 파일을 읽어들입니다.
    const templateHtml = prod ? fs.readFileSync("./dist/vanilla/index.html", "utf-8") : "";

    const url = req.originalUrl.replace(base, "/");

    /** @type {string} */
    let template;
    /** @type {import('./src/main-server.js').render} */
    let render;
    if (!prod) {
      // Always read fresh template in development

      // 2. Vite의 HTML 변환 작업을 통해 Vite HMR 클라이언트를 주입하고,
      //    Vite 플러그인의 HTML 변환도 적용합니다.
      //    (예: @vitejs/plugin-react의 전역 초기화 코드)
      template = fs.readFileSync("./index.html", "utf-8");
      template = await vite.transformIndexHtml(url, template);
      // 3. 서버의 진입점(Entry)을 로드합니다.
      //    ssrLoadModule은 Node.js에서 사용할 수 있도록 ESM 소스 코드를 자동으로 변환합니다.
      //    추가적인 번들링이 필요하지 않으며, HMR과 유사한 동작을 수행합니다.
      render = (await vite.ssrLoadModule("/src/main-server.js")).render;
    } else {
      template = templateHtml;
      render = (await import("./dist/vanilla-ssr/main-server.js")).render;
    }

    // 4. 앱의 HTML을 렌더링합니다.
    //    이는 entry-server.js에서 내보낸(Export) `render` 함수가
    //    ReactDOMServer.renderToString()과 같은 적절한 프레임워크의 SSR API를 호출한다고 가정합니다.
    console.log("🔍 Rendering URL:", url, "Query:", req.query, "Prod:", prod);
    console.log("📦 Template length:", template?.length);
    console.log("🎯 Render function:", typeof render);

    const rendered = await render(url, req.query);
    console.log("✅ Rendered result:", rendered ? Object.keys(rendered) : "null");

    // 5. 렌더링된 HTML을 템플릿에 주입합니다.
    const html = template
      .replace(`<!--app-head-->`, rendered.head ?? "")
      .replace(`<!--app-html-->`, rendered.html ?? "")
      .replace(
        `</body>`,
        `
        <script>
          window.__INITIAL_DATA__ = ${JSON.stringify(rendered.initialState)};
        </script>
        </body>`,
      );

    // 6. 렌더링된 HTML을 응답으로 전송합니다.
    res.status(200).set({ "Content-Type": "text/html" }).send(html);
  } catch (e) {
    // 만약 오류가 발생된다면, Vite는 스택트레이스(Stacktrace)를 수정하여
    // 오류가 실제 코드에 매핑되도록 재구성합니다.
    vite?.ssrFixStacktrace(e);
    console.log(e.stack);
    res.status(500).end(e.stack);
  }
});

// 프로덕션 모드에서는 정적 파일을 별도로 처리하지 않음 (SSR 우선)

// Start http server
app.listen(port, () => {
  console.log(`React Server started at http://localhost:${port}`);
});
