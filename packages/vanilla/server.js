import express from "express";
import fs from "fs";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5174;
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/vanilla/" : "/");

const app = express();

let template;
let vite;

if (prod) {
  template = fs.readFileSync("dist/vanilla/index.html", "utf-8");
} else {
  template = fs.readFileSync("index.html", "utf-8");
}

if (!prod) {
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
  });
  app.use(vite.middlewares);
} else {
  app.use(base, express.static("dist/vanilla"));
}

app.get("/favicon.ico", (_, res) => {
  res.status(204).end();
});

app.get("*", async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "");
    console.log("SSR Request URL:", req.originalUrl, "-> Processed URL:", url);

    let render;
    if (!prod) {
      const { render: ssrRender } = await vite.ssrLoadModule("/src/main-server.js");
      render = ssrRender;
    } else {
      const { render: prodRender } = await import("./dist/vanilla-ssr/main-server.js");
      render = prodRender;
    }

    const { html, head, initialData } = await render(url);

    const initialDataScript = `
      <script>
        window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};
      </script>
    `;

    const finalHtml = template
      .replace("<!--app-head-->", `<title>${head.title}</title>`)
      .replace("<!--app-html-->", html)
      .replace("</head>", `${initialDataScript}</head>`);

    res.status(200).set({ "Content-Type": "text/html" }).end(finalHtml);
  } catch (e) {
    console.error("SSR Error:", e);
    res.status(500).end("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`SSR Server started at http://localhost:${port}`);
});
