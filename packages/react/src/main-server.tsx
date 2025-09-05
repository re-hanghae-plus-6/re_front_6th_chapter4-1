import { renderToString } from "react-dom/server";

// eslint-disable-next-line react-refresh/only-export-components
function App() {
  return <div>안녕하세요 쇼핑몰 테스트입니다.</div>;
}

export class SSRService {
  async render(url: string, query: Record<string, string>) {
    console.log({ url, query });

    return {
      head: /* HTML */ `<title>쇼핑몰 - 홈</title>`,
      html: renderToString(<App />),
      data: { name: "changyu" },
    };
  }
}
