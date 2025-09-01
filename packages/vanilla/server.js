import express from "express";
import { getCategories, getProducts } from "./src/api/productApi.js";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/vanilla/" : "/");

const app = express();

let vite;
if (!prod) {
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    base,
  });
  app.use(vite.middlewares);
} else {
  const compression = (await import("compression")).default;
  const sirv = (await import("sirv")).default;
  app.use(compression());
  app.use(base, sirv("./dist/client", { extensions: [] }));
}

const { HomePage } = await vite.ssrLoadModule("./src/pages/HomePage.js");
const { server } = await vite.ssrLoadModule("./src/mocks/server-browser.js");
server.listen();
// 뿌려줄 아이
const render = async (url, query) => {
  console.log({ url, query });
  const [
    {
      products,
      pagination: { total },
    },
    categories,
  ] = await Promise.all([getProducts(query), getCategories()]);
  return `${HomePage(url, query, { products, categories, totalCount: total, loading: false, status: "done" })}`;
};

// 호출부
// get 이라는 메소드로 호출된 애는 아래로 시작하겠다.
// req: 요청 객체 (url, query)
// res: 응답 객체
app.get("*all", async (req, res) => {
  res.send(
    `
    <!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://cdn.tailwindcss.com"></script>
    <!--app-head-->
    <link rel="stylesheet" href="/src/styles.css">
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              primary: '#3b82f6',
              secondary: '#6b7280'
            }
          }
        }
      }
    </script>
  </head>
  <body class="bg-gray-50">
    <div id="app">${await render(req.url, req.query)}</div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
  `.trim(),
  );
});

// Start http server
app.listen(port, () => {
  console.log(`React Server started at http://localhost:${port}`);
});
