import express from "express";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/vanilla/" : "/");

const app = express();
console.log(1)
const render = () => {
  return `<div>안녕하세요</div>`;
};

app.get("*all", (req, res) => {
  res.send(
    `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vanilla Javascript SSR</title>
</head>
<body>
<div id="app">${render()}</div>
</body>
</html>
  `.trim(),
  );
});

// Start http server
app.listen(port, () => {
  console.log(`React Server started at http://localhost:${port}`);
});
