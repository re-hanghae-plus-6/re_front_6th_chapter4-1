import express from "express";
import fs from "fs";

const port = process.env.PORT || 5173;

const app = express();

const render = () => {
  // 파일 시스템 가져오기.
  const html = fs.readFileSync("./dist/vanilla/index.html", "utf-8");
  console.log(html);
  return html.replace("<!--app-html-->", `<div>hrell</div>`);
};

app.get("*all", (req, res) => {
  res.send(render());
});

// Start http server
app.listen(port, () => {
  console.log(`React Server started at http://localhost:${port}`);
});
