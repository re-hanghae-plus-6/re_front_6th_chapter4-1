import fs from "fs";
import { server } from "./src/mocks/serverBrowser.js";
import { createServer } from "vite";

async function generateStaticSite() {
  let vite;

  try {
    // MSW 서버 시작 (await로 완전히 시작될 때까지 대기)
    await server.listen({ onUnhandledRequest: "bypass" });
    console.log("MSW 서버 시작 완료");

    // Vite 서버 생성 (개발 모드와 동일)
    vite = await createServer({
      server: { middlewareMode: true },
      appType: "custom",
    });

    // Vite를 통해 SSR 모듈 로드 (개발 환경과 동일한 방식)
    const { render } = await vite.ssrLoadModule("/src/main-server.js");

    // HTML 템플릿 읽기
    const template = fs.readFileSync("../../dist/vanilla/index.html", "utf-8");

    // 홈페이지 렌더링 (빈 쿼리로)
    const rendered = await render("/", {});

    // rendered가 문자열이면 html만, 객체면 html과 head 추출
    const htmlContent = typeof rendered === "string" ? rendered : rendered?.html || "";
    const headContent = typeof rendered === "object" ? rendered?.head || "" : "";

    // 결과 HTML 생성하기
    const result = template
      .replace(`<!--app-head-->`, headContent)
      .replace(`<!--app-html-->`, htmlContent)
      .replace(`<!--app-data-->`, `<script>window.__INITIAL_DATA__ = ${JSON.stringify(rendered)};</script>`);

    fs.writeFileSync("../../dist/vanilla/index.html", result);
  } catch (error) {
    console.error("SSG 생성 실패:", error);
    throw error;
  } finally {
    // 서버들 종료 (에러 발생 여부와 관계없이 실행)
    if (vite) {
      await vite.close();
      console.log("Vite 서버 종료됨");
    }
    await server.close();
    console.log("MSW 서버 종료됨");
  }
}

// 실행
generateStaticSite().catch(console.error);
