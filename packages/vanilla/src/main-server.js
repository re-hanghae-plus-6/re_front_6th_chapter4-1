export const render = async (url, query) => {
  console.log({ url, query });

  // 기본 HTML 구조를 반환
  return {
    head: `
      <title>쇼핑몰</title>
      <meta name="description" content="온라인 쇼핑몰">
    `,
    html: `
      <div class="min-h-screen bg-gray-50">
        <div class="container mx-auto px-4 py-8">
          <h1 class="text-2xl font-bold text-gray-900 mb-6">쇼핑몰</h1>
          <div id="app">로딩 중...</div>
        </div>
      </div>
    `,
  };
};
