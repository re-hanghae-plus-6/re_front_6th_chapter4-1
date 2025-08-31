# SSR 구현 과정 및 문제 해결

## 🎯 목표

서버 라우트 설정하고, 페이지 뿌려주기

## ❌ 문제 상황

클라이언트 코드를 서버 Node 환경에서 실행하려고 해서 발생하는 에러

### **에러 메시지**

```
node:internal/modules/esm/resolve:263
    throw new ERR_UNSUPPORTED_DIR_IMPORT(path, basePath, String(resolved));
          ^

Error [ERR_UNSUPPORTED_DIR_IMPORT]: Directory import '/Users/angielee/Desktop/hanghae/front_6th_chapter4-1/packages/vanilla/src/components' is not supported resolving ES modules imported from /Users/angielee/Desktop/hanghae/front_6th_chapter4-1/packages/vanilla/src/pages/HomePage.js
```

### **에러 원인**

클라이언트 코드 서버 실행: 브라우저용 코드를 Node.js 환경에서 실행하려고 시도

```
const html = HomePage();
```

## ✅ 해결 방법

### **1. Vite SSR 모듈 로드 방식 사용**

```javascript
const render = async (url) => {
  try {
    if (prod) {
      // 프로덕션: 빌드된 SSR 모듈 사용
      const { render } = await import("./dist/vanilla-ssr/main-server.js");
      return await render(url);
    } else {
      // 개발: Vite SSR 모듈 로드
      const { render } = await vite.ssrLoadModule("/src/main-server.js");
      return await render(url);
    }
  } catch (error) {
    console.error("Render error:", error);
    return { html: "<div>Error</div>", head: "", initialData: {} };
  }
};
```

### **2. 서버 사이드 전용 코드 분리**

- `main-server.js`: 서버에서만 실행되는 코드
- 클라이언트 전용 코드 제거 (store, window 객체 등)
- 서버 사이드 라우터 구현

### **3. 라우트 패턴 수정**

```javascript
// 문제가 되는 패턴
serverRouter.addRoute("/product/:id/", async (params) => { // 끝에 슬래시

// 수정된 패턴
serverRouter.addRoute("/product/:id", async (params) => { // 슬래시 제거
```

### **4. 정규식 기반 라우터 구현**

```javascript
class ServerRouter {
  addRoute(path, handler) {
    const paramNames = [];

    // 경로 정규화: 끝의 슬래시 제거
    const normalizedPath = path.replace(/\/$/, "");

    const regexPath = normalizedPath
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1));
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    const regex = new RegExp(`^${regexPath}$`);
    this.routes.set(path, { regex, paramNames, handler });
  }

  findRoute(url) {
    for (const [routePath, route] of this.routes) {
      const match = url.match(route.regex);
      if (match) {
        const params = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });
        return { ...route, params, path: routePath };
      }
    }
    return null;
  }
}
```

## 🔧 구현 단계

### **1단계: 서버 설정**

- Express 서버 구성
- Vite 미들웨어 모드 설정
- 정적 파일 서빙 설정

### **2단계: SSR 렌더링 엔진**

- `main-server.js` 구현
- 서버 사이드 라우터 구현
- 데이터 프리페칭 로직

### **3단계: HTML 템플릿 처리**

- HTML 템플릿 읽기
- 플레이스홀더 치환 (`<!--app-html-->`, `<!--app-head-->`)
- 초기 데이터 스크립트 주입

### **4단계: 클라이언트 하이드레이션**

- `window.__INITIAL_DATA__` 처리
- 클라이언트 상태 복원
- 이벤트 리스너 연결

## 🚀 최종 결과

- 서버에서 초기 HTML 생성
- 클라이언트에서 JavaScript 활성화
- SEO 최적화 및 빠른 초기 로딩
- 서버/클라이언트 데이터 동기화
