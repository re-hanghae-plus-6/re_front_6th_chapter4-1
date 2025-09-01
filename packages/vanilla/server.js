import compression from "compression";
import express from "express";
import * as fs from "fs";
import sirv from "sirv";

const port = process.env.PORT || 5173;
const base = process.env.BASE || "/front_6th_chapter4-1/vanilla/";

const render = () => {
  const html = fs.readFileSync("./dist/vanilla/index.html", "utf-8");
  return html.replace("<!--app-html-->", /* HTML */ `<div>SSR 테스트</div>`);
};

const app = express();

app.use(compression());
app.use(base, sirv("./dist/vanilla", { extensions: [] }));

app.get("*all", async (_, res) => {
  const html = render();
  res.status(200).set({ "Content-Type": "text/html" }).send(html);
});

// Start http server
app.listen(port, () => {
  console.log(`Vanilla Server started at http://localhost:${port}`);
});
