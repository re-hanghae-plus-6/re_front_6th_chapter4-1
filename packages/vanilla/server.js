import express from "express";
import fs from "fs";

// const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
// const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/vanilla/" : "/");

const base = "/front_6th_chapter4-1/vanilla/";

const app = express();

const render = () => {
  const html = fs.readFileSync("./dist/vanilla/index.html", "utf8");
  return html.replace("<!--app-html-->", `<div>안뇽</div>`);
};

const compression = (await import("compression")).default;
const sirv = (await import("sirv")).default;
app.use(compression());
app.use(base, sirv("./dist/vanilla", { extensions: [] }));

app.get("*all", (req, res) => {
  res.send(render());
});

// Start http server
app.listen(port, () => {
  console.log(`React Server started at http://localhost:${port}`);
});
