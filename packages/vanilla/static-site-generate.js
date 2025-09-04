import fs from "fs";
import { render } from "./dist/vanilla-ssr/main-server.js";

async function generateStaticSite() {
  // 임시. HTML 템플릿 읽기
  const template = fs.readFileSync("../../dist/vanilla/index.html", "utf-8");

  const rendered = await render("/", {});
  const html = template
    .replace(`<!--app-head-->`, rendered.head ?? "")
    .replace(
      `<!--app-initial-data-->`,
      `<script>window.__INITIAL_DATA__ = ${JSON.stringify(rendered.initialData)}</script>`,
    )
    .replace(`<!--app-html-->`, rendered.html ?? "");

  fs.writeFileSync("../../dist/vanilla/index.html", html);
}

// 실행
generateStaticSite();
