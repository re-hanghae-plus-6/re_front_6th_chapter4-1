import fs from "fs";

async function generateStaticSite() {
  try {
    // SSG 빌드 모드 설정
    process.env.BUILD_MODE = "ssg";
    console.log("SSG 빌드 시작 (JSON 직접 로드)");

    // 빌드된 서버 번들 사용
    const { render } = await import("./dist/vanilla-ssr/main-server.js");

    // HTML 템플릿 읽기
    const template = fs.readFileSync("../../dist/vanilla/index.html", "utf-8");

    // 홈 페이지 렌더링 (기본 정렬 파라미터 포함)
    const {
      html: homeHtml,
      head: homeHead,
      initialState: homeState,
    } = await render("/", {
      sort: "price_asc",
      limit: 20,
    });

    // 홈페이지 HTML 생성
    const homeResult = template
      .replace("<!--app-html-->", homeHtml)
      .replace("<!--app-head-->", homeHead)
      .replace(
        "</body>",
        `
        <script>
          window.__INITIAL_DATA__ = ${JSON.stringify(homeState)};
        </script>
        </body>
      `,
      );

    fs.writeFileSync("../../dist/vanilla/index.html", homeResult);

    // 404 페이지 생성
    const { html: notFoundHtml, head: notFoundHead, initialState: notFoundState } = await render("/404", {});

    const notFoundResult = template
      .replace("<!--app-html-->", notFoundHtml)
      .replace("<!--app-head-->", notFoundHead)
      .replace(
        "</body>",
        `
        <script>
          window.__INITIAL_DATA__ = ${JSON.stringify(notFoundState)};
        </script>
        </body>
      `,
      );

    fs.writeFileSync("../../dist/vanilla/404.html", notFoundResult);

    // 상품 상세 페이지들 생성
    const productIds = ["85067212996", "86940857379"]; // 테스트에서 사용하는 상품 ID들

    for (const productId of productIds) {
      try {
        const {
          html: productHtml,
          head: productHead,
          initialState: productState,
        } = await render(`/product/${productId}/`, {});

        const productResult = template
          .replace("<!--app-html-->", productHtml)
          .replace("<!--app-head-->", productHead)
          .replace(
            "</body>",
            `
            <script>
              window.__INITIAL_DATA__ = ${JSON.stringify(productState)};
            </script>
            </body>
          `,
          );

        // 디렉토리 생성
        const productDir = `../../dist/vanilla/product/${productId}`;
        fs.mkdirSync(productDir, { recursive: true });
        fs.writeFileSync(`${productDir}/index.html`, productResult);

        console.log(`상품 페이지 생성 완료: /product/${productId}/`);
      } catch (error) {
        console.error(`상품 페이지 생성 실패 (${productId}):`, error);
      }
    }

    console.log("정적 사이트 생성 완료");
  } catch (error) {
    console.error("정적 사이트 생성 실패:", error);
    process.exit(1);
  }
}

// 실행
generateStaticSite();
