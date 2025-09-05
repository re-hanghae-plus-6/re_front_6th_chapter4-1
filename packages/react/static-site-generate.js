import fs from "node:fs";
import path from "node:path";
import { createServer } from "vite";

const DIST_DIR = "../../dist/react";

const createOutputPath = (route) => {
  if (route.endsWith(".html")) {
    return path.join(DIST_DIR, route);
  }
  return path.join(DIST_DIR, route, "index.html");
};

const ensureDirectoryExists = (filePath) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const buildHtmlContent = (template, pageData) => {
  return template
    .replace("<!--app-head-->", pageData.head || "")
    .replace("<!--app-html-->", pageData.html || "")
    .replace(
      "<!--app-data-->",
      `<script>window.__INITIAL_DATA__ = ${JSON.stringify(pageData.__INITIAL_DATA__ || {})};</script>`,
    );
};

const writePage = async (route, renderFn, template) => {
  const pageData = await renderFn(route, {});
  const htmlContent = buildHtmlContent(template, pageData);
  const outputPath = createOutputPath(route);

  ensureDirectoryExists(outputPath);
  fs.writeFileSync(outputPath, htmlContent);
};

const generateStaticPages = async () => {
  const viteServer = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
  });

  const { server: mswServer } = await viteServer.ssrLoadModule("./src/mocks/nodeServer.ts");
  mswServer.listen({ onUnhandledRequest: "bypass" });

  try {
    const { render } = await viteServer.ssrLoadModule("./src/main-server.tsx");
    const template = fs.readFileSync(path.join(DIST_DIR, "index.html"), "utf-8");

    await writePage("/404.html", render, template);
    await writePage("/", render, template);

    const { getProducts } = await viteServer.ssrLoadModule("./src/api/productApi.ts");
    const { products } = await getProducts();

    const productTasks = products.map((product) => writePage(`/product/${product.productId}/`, render, template));
    await Promise.all(productTasks);
  } finally {
    mswServer.close();
    viteServer.close();
  }
};

generateStaticPages();
