import fs from "fs/promises";
import express from "express";
import { render } from "./src/main-server.js";

// Constants
const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5174; // dev:ssr 포트
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/vanilla/" : "/");

// Create Express app
const app = express();

// Get template
const template = await fs.readFile("./index.html", "utf-8");

// Add middleware for all requests
app.use("*", async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "");

    const { html: appHtml, head: appHead, initialData } = await render(url);

    const initialDataScript = `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData)}</script>`;

    const html = template
      .replace("<!--app-head-->", appHead || "")
      .replace("<!--app-html-->", appHtml || "SSR Failed")
      .replace("</head>", `${initialDataScript}</head>`);

    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  } catch (e) {
    console.error("SSR Error:", e);
    res.status(500).send("Internal Server Error");
  }
});

// Start http server
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
