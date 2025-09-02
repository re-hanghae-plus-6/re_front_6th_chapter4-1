/**
 * HTML 템플릿 생성 및 치환 유틸리티
 */

/**
 * 기본 HTML 템플릿
 */
export const createHTMLTemplate = (appHtml, appHead = "", initialData = null) => {
  const initialDataScript = initialData
    ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};</script>`
    : "";

  // SSR 확인을 위한 메타 정보
  const ssrMeta = `
    <!-- SSR 렌더링 정보 -->
    <meta name="ssr-rendered" content="true" />
    <meta name="ssr-timestamp" content="${new Date().toISOString()}" />
    <meta name="ssr-html-length" content="${appHtml.length}" />
  `;

  return `
    <!doctype html>
    <html lang="ko">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>쇼핑몰 (SSR)</title>
        <script src="https://cdn.tailwindcss.com"></script>
        ${ssrMeta}
        ${appHead}
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
        ${initialDataScript}
      </head>
      <body class="bg-gray-50">
        <!-- SSR 렌더링된 콘텐츠 -->
        <div id="app">${appHtml}</div>
        <script type="module" src="/src/main.js"></script>
      </body>
    </html>
  `.trim();
};

/**
 * 기존 HTML 템플릿에서 치환
 */
export const replaceHTMLTemplate = (template, appHtml, appHead = "", initialData = null) => {
  let result = template;

  // app-html 치환
  if (result.includes("<!--app-html-->")) {
    result = result.replace("<!--app-html-->", appHtml);
  }

  // app-head 치환
  if (result.includes("<!--app-head-->")) {
    result = result.replace("<!--app-head-->", appHead);
  }

  // 초기 데이터 주입
  if (initialData && !result.includes("window.__INITIAL_DATA__")) {
    const initialDataScript = `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};</script>`;
    result = result.replace("</head>", `  ${initialDataScript}\n</head>`);
  }

  return result;
};
