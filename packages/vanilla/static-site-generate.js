import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { createServer } from "vite";

import { mswServer } from "./src/mocks/node.js";

export class SSGBuilder {
  #distRoot = path.resolve("../../dist/vanilla");
  #template;
  #viteServer;
  #ssrService;

  constructor() {
    this.#template = null;
    this.#viteServer = null;
    this.#ssrService = null;
  }

  async build() {
    await this.#initBuildSetting();

    try {
      const templatePath = path.join(this.#distRoot, "index.html");
      this.#template = await readFile(templatePath, "utf-8");

      const { SSRService } = await this.#viteServer.ssrLoadModule("./src/main-server.js");
      this.#ssrService = new SSRService();

      await this.#createStaticPages();
    } finally {
      await this.#cleanup();
    }
  }

  async #initBuildSetting() {
    mswServer.listen({
      onUnhandledRequest: "bypass",
    });

    this.#viteServer = await createServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
  }

  async #createStaticPages() {
    await this.#buildPage("/404.html");
    await this.#buildPage("/");
    await this.#buildProductPages();
  }

  async #buildProductPages() {
    const { getProducts } = await this.#viteServer.ssrLoadModule("./src/api/productApi.js");
    const { products } = await getProducts();

    const buildTasks = (products ?? []).map(({ productId }) => this.#buildPage(`/product/${productId}/`));
    await Promise.all(buildTasks);
  }

  async #buildPage(pathname) {
    const outputPath = this.#getOutputPath(pathname);
    await mkdir(path.dirname(outputPath), { recursive: true });

    const rendered = await this.#ssrService.render(pathname, {});
    const html = this.#template
      .replace("<!--app-head-->", rendered.head ?? "")
      .replace("<!--app-html-->", rendered.html ?? "")
      .replace("<!--app-data-->", `<script>window.__INITIAL_DATA__ = ${JSON.stringify(rendered.data)};</script>`);

    await writeFile(outputPath, html);
  }

  #getOutputPath(pathname) {
    const fileName = pathname.endsWith(".html")
      ? pathname.replace(/^\//, "")
      : path.join(pathname, "index.html").replace(/^\//, "");

    return path.join(this.#distRoot, fileName);
  }

  async #cleanup() {
    mswServer.close();
    await this.#viteServer?.close();
  }
}

const ssgBuilder = new SSGBuilder();
await ssgBuilder.build();
