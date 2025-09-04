# React SSR 구현 체크리스트

## 📋 프로젝트 개요

바닐라 JavaScript SSR 패턴을 React에 적용하여 **CSR/SSR/SSG 삼중 렌더링**을 지원하는 완전한 SSR 시스템 구현

### 🎯 목표

- 바닐라 JavaScript와 동일한 수준의 SSR 기능
- React 18 최신 기능 활용 (`hydrateRoot`, `renderToPipeableStream`)
- TypeScript 타입 안전성 보장
- 개발/프로덕션 환경 모두 지원

### 🏗️ 아키텍처 설계

```
HTTP 요청 → Express 서버 → React Router 매칭 → 페이지 컴포넌트 찾기
→ SSR 데이터 로드 → renderToPipeableStream → HTML 스트림 생성
→ 클라이언트 전송 → React 하이드레이션 → SPA 모드 전환
```

---

## 1단계: 서버 사이드 라우터 구현 ⚡

### Module: ServerRouter for React

**Priority: 높음** | **예상 시간: 2-3시간** | **의존성: 없음**

#### Tasks:

- [x] **`src/router/ServerRouter.ts` 생성**
  - [x] 바닐라 ServerRouter 클래스를 React용으로 포팅
  - [x] React 컴포넌트를 핸들러로 받는 타입 정의
  - [x] URL 매칭 및 파라미터 추출 로직 구현
  - [x] 라우트 등록 메서드 (`addRoute`) 구현
  - [x] 라우트 찾기 메서드 (`findRoute`) 구현

- [x] **`src/router/routes.ts` 수정**
  - [x] 클라이언트/서버 공통 라우트 설정
  - [x] React 컴포넌트와 SSR 메서드 연결 구조 설계
  - [x] `registerClientRoutes`, `registerServerRoutes` 함수 구현
  - [x] TypeScript 인터페이스 정의

- [x] **타입 정의 파일 생성**
  - [x] `src/types/ssr.ts` - SSR 관련 타입들
  - [x] 페이지 컴포넌트 SSR 메서드 타입
  - [x] 메타데이터 타입 정의

#### Acceptance Criteria:

- [x] 서버에서 URL 기반 라우트 매칭 정상 동작
- [x] 라우트 파라미터 추출 및 타입 안전성 보장
- [x] 바닐라 ServerRouter와 동일한 API 제공

#### 구현 참고:

```typescript
// 목표 API 구조
interface SSRPageComponent<T = any> extends React.ComponentType<T> {
  ssr?: (context: SSRContext) => Promise<any>;
  metadata?: (data: any) => Promise<MetaData> | MetaData;
}

interface SSRContext {
  params: Record<string, string>;
  query: Record<string, string>;
}
```

---

## 2단계: 페이지 컴포넌트 SSR 지원 🔧

### Module: SSR-enabled Page Components

**Priority: 높음** | **예상 시간: 4-5시간** | **의존성: 1단계**

#### Tasks:

- [x] **`src/pages/HomePage.tsx` SSR 지원**
  - [x] `HomePage.ssr` 메서드 추가
    - [x] 상품 목록 API 호출 (`getProducts`)
    - [x] 카테고리 API 호출 (`getCategories`)
    - [x] 쿼리 파라미터 기반 필터링 지원
    - [x] 에러 처리 및 기본값 반환
  - [x] `HomePage.metadata` 메서드 추가
    - [x] 기본 메타데이터 설정
    - [x] 검색어 기반 동적 제목 생성
  - [x] SSR 데이터와 클라이언트 데이터 우선순위 처리
    - [x] props로 받은 SSR 데이터 우선 사용
    - [x] SSR 데이터 없을 시 기존 스토어 로직 유지

- [x] **`src/pages/ProductDetailPage.tsx` SSR 지원**
  - [x] `ProductDetailPage.ssr` 메서드 추가
    - [x] 상품 상세 API 호출 (`getProduct`)
    - [x] 관련 상품 API 호출 (`getProducts` with category filter)
    - [x] 상품 없음 에러 처리
  - [x] `ProductDetailPage.metadata` 메서드 추가
    - [x] 상품 정보 기반 동적 메타데이터
    - [x] Open Graph 태그 지원
    - [x] 상품 이미지, 설명 포함
  - [x] 에러 상태 렌더링 로직 개선

- [x] **`src/pages/NotFoundPage.tsx` SSR 지원**
  - [x] 정적 메타데이터 설정
  - [x] 서버/클라이언트 일관성 보장

#### Acceptance Criteria:

- [x] 각 페이지에서 서버 데이터 프리페칭 정상 동작
- [x] SEO 메타데이터 동적 생성 및 적용
- [x] 에러 상황에서도 안정적인 렌더링
- [x] 기존 클라이언트 로직과 호환성 유지

#### 구현 예시:

```typescript
const HomePage: SSRPageComponent<HomePageProps> = ({ ssrData }) => {
  // SSR 데이터가 있으면 우선 사용, 없으면 스토어 상태 사용
  const productState = ssrData || useProductStore();
  // ... 기존 렌더링 로직
};

HomePage.ssr = async ({ query }) => {
  const [products, categories] = await Promise.all([getProducts(query), getCategories()]);
  return { products: products.products, categories, totalCount: products.pagination.total };
};
```

---

## 3단계: Express 서버 고도화 🚀

### Module: Production-Ready Express SSR Server

**Priority: 높음** | **예상 시간: 3-4시간** | **의존성: 1,2단계**

#### Tasks:

- [ ] **`server.js` 완전 재작성**
  - [ ] 환경 변수 및 상수 설정
    - [ ] `isProduction`, `port`, `base` 설정
    - [ ] 템플릿 HTML 캐싱 (프로덕션)
  - [ ] Express 앱 설정
    - [ ] JSON 파싱 미들웨어
    - [ ] 압축 미들웨어 (프로덕션)
    - [ ] 정적 파일 서빙 (프로덕션)
  - [ ] Vite 개발 서버 통합
    - [ ] 개발 환경에서 Vite 미들웨어 사용
    - [ ] HMR 및 트랜스폼 지원
  - [ ] MSW 서버 통합
    - [ ] 서버사이드 API 모킹 설정
    - [ ] 요청 핸들링 우선순위 설정
  - [ ] API vs SSR 라우트 분리
    - [ ] `/api/*` 경로는 API 라우터로
    - [ ] 나머지 경로는 SSR 처리

- [ ] **`src/main-server.tsx` 구현**
  - [ ] `render` 함수 구현
    - [ ] 서버 라우터로 라우트 매칭
    - [ ] 페이지 컴포넌트의 SSR 메서드 호출
    - [ ] React 컴포넌트 서버 렌더링
    - [ ] 메타데이터 생성 및 HTML 주입
  - [ ] 데이터 프리페칭 로직
    - [ ] `prefetchData` 함수 구현
    - [ ] 에러 처리 및 fallback 데이터
  - [ ] 메타데이터 생성 로직
    - [ ] `generateMetadata` 함수 구현
    - [ ] 기본값 및 동적 메타데이터 처리
  - [ ] 초기 데이터 직렬화
    - [ ] `window.__INITIAL_DATA__` 주입
    - [ ] XSS 방지를 위한 안전한 직렬화

- [ ] **에러 처리 및 fallback**
  - [ ] 404 페이지 렌더링
  - [ ] 500 에러 페이지 렌더링
  - [ ] 개발/프로덕션 환경별 에러 표시

#### Acceptance Criteria:

- [ ] 개발 환경에서 HMR과 SSR 동시 지원
- [ ] 프로덕션 환경에서 최적화된 SSR 서빙
- [ ] API 라우트와 SSR이 충돌 없이 동작
- [ ] 바닐라 서버와 동일한 기능 제공

#### 구현 구조:

```typescript
// src/main-server.tsx 목표 구조
export const render = async (pathname: string, query: Record<string, string>) => {
  const serverRouter = new ServerRouter();
  registerRoutes(serverRouter);

  serverRouter.start(pathname, query);
  const route = serverRouter.route;

  if (!route) return render404Page();

  const data = await prefetchData(route, route.params, query);
  const metadata = await generateMetadata(route, route.params, data);
  const html = renderToString(<App ssrData={data} />);

  return { head: generateHead(metadata), html, __INITIAL_DATA__: data };
};
```

---

## 4단계: 클라이언트 하이드레이션 💧

### Module: React Hydration System

**Priority: 높음** | **예상 시간: 2-3시간** | **의존성: 3단계**

#### Tasks:

- [ ] **`src/main.tsx` 하이드레이션 로직**
  - [ ] `createRoot` → `hydrateRoot` 변경
  - [ ] 서버 데이터 복원 함수 구현
    - [ ] `window.__INITIAL_DATA__` 읽기
    - [ ] 데이터 유효성 검증
    - [ ] 초기 데이터 정리
  - [ ] 스토어 상태 초기화 순서 최적화
    - [ ] 하이드레이션 → 이벤트 등록 → 라우터 시작

- [ ] **스토어 하이드레이션 구현**
  - [ ] `productStore` 서버 데이터 복원
    - [ ] SSR 데이터로 스토어 상태 설정
    - [ ] 로딩 상태 비활성화
    - [ ] 에러 상태 초기화
  - [ ] `cartStore` 로컬스토리지와 통합
    - [ ] 서버 데이터와 로컬 데이터 병합 로직
    - [ ] 우선순위 설정
  - [ ] 하이드레이션 불일치 방지
    - [ ] 서버와 클라이언트 상태 동기화 검증
    - [ ] 불일치 시 경고 및 복구 로직

- [ ] **라우터 하이드레이션**
  - [ ] 서버 렌더링된 페이지와 클라이언트 라우터 동기화
  - [ ] 초기 네비게이션 이벤트 처리
  - [ ] SSR 데이터를 클라이언트 컴포넌트에 전달

- [ ] **App.tsx 수정**
  - [ ] SSR 데이터 Props 추가
  - [ ] 하이드레이션 모드 감지
  - [ ] 초기 렌더링 최적화

#### Acceptance Criteria:

- [ ] 서버 HTML과 클라이언트 렌더링 완전 일치
- [ ] React 하이드레이션 경고 없음
- [ ] 초기 데이터 정상적으로 복원 및 사용
- [ ] 하이드레이션 후 즉시 인터랙티브

#### 구현 예시:

```typescript
// src/main.tsx
function hydrateFromServerData() {
  if (window.__INITIAL_DATA__) {
    const data = window.__INITIAL_DATA__;

    // 상품 스토어 하이드레이션
    if (data.products || data.currentProduct) {
      productStore.setState({
        ...data,
        loading: false,
        status: "done"
      });
    }

    delete window.__INITIAL_DATA__;
  }
}

function main() {
  hydrateFromServerData();
  router.start();

  const rootElement = document.getElementById("root")!;
  hydrateRoot(rootElement, <App />);
}
```

---

## 5단계: 정적 사이트 생성 (SSG) 📁

### Module: Advanced Static Site Generation

**Priority: 중간** | **예상 시간: 2-3시간** | **의존성: 4단계**

#### Tasks:

- [ ] **`static-site-generate.js` 고도화**
  - [ ] 페이지 목록 생성 함수
    - [ ] 정적 페이지 (/, /404) 추가
    - [ ] 동적 상품 페이지 목록 생성
    - [ ] API에서 상품 데이터 조회
  - [ ] Vite SSR 모듈 로딩 통합
    - [ ] 개발 Vite 서버 생성
    - [ ] SSR 모듈 동적 로딩
    - [ ] 의존성 해결
  - [ ] 각 페이지 렌더링 및 저장
    - [ ] 렌더 함수 호출
    - [ ] HTML 템플릿 치환
    - [ ] 파일 시스템에 저장
  - [ ] 에러 핸들링 및 로깅
    - [ ] 페이지별 에러 처리
    - [ ] 진행 상황 로깅
    - [ ] 실패한 페이지 목록 출력

- [ ] **빌드 스크립트 최적화**
  - [ ] `package.json` 스크립트 점검
  - [ ] CSR, SSR, SSG 병렬 빌드 가능성 검토
  - [ ] 의존성 최적화
  - [ ] 빌드 시간 측정 및 단축

- [ ] **MSW 통합**
  - [ ] SSG 빌드 시 MSW 서버 시작
  - [ ] API 모킹 데이터 일관성 보장
  - [ ] 빌드 완료 후 서버 정리

#### Acceptance Criteria:

- [ ] 모든 상품 페이지가 정적 HTML로 생성
- [ ] 빌드 프로세스가 안정적으로 동작
- [ ] 생성된 정적 파일이 독립적으로 서빙 가능
- [ ] 바닐라 SSG와 동일한 결과물 생성

#### 구현 구조:

```javascript
// static-site-generate.js 목표 구조
async function generateStaticSite() {
  // 1. MSW 서버 시작
  // 2. Vite 서버 생성
  // 3. 렌더 함수 로드
  // 4. 페이지 목록 생성
  // 5. 각 페이지 렌더링 및 저장
  // 6. 서버 정리
}

async function getPages() {
  return [
    { url: "/", filePath: "index.html" },
    { url: "/404", filePath: "404.html" },
    ...products.map((p) => ({
      url: `/product/${p.id}/`,
      filePath: `product/${p.id}/index.html`,
    })),
  ];
}
```

---

## 6단계: 스트리밍 SSR (선택사항) 🌊

### Module: React 18 Streaming SSR

**Priority: 낮음** | **예상 시간: 3-4시간** | **의존성: 4단계**

#### Tasks:

- [ ] **스트리밍 렌더링 구현**
  - [ ] `renderToString` → `renderToPipeableStream` 변경
  - [ ] 스트림 기반 HTML 응답 구현
  - [ ] Suspense 경계 설정
  - [ ] 점진적 페이지 로딩 로직

- [ ] **컴포넌트 Suspense 적용**
  - [ ] 데이터 로딩 컴포넌트에 Suspense 래핑
  - [ ] 로딩 fallback UI 구현
  - [ ] 에러 경계 설정

- [ ] **성능 최적화**
  - [ ] 청크 단위 스트리밍 설정
  - [ ] 우선순위 기반 렌더링
  - [ ] 메모리 사용량 최적화
  - [ ] TTFB 측정 및 개선

#### Acceptance Criteria:

- [ ] 페이지가 점진적으로 로딩
- [ ] TTFB (Time To First Byte) 현저한 개선
- [ ] 대용량 페이지에서 성능 향상 확인

---

## 7단계: 통합 테스트 및 최적화 🧪

### Module: Testing and Performance Optimization

**Priority: 중간** | **예상 시간: 2-3시간** | **의존성: 전체**

#### Tasks:

- [ ] **E2E 테스트 구현**
  - [ ] CSR 모드 테스트 (`npm run dev`)
  - [ ] SSR 모드 테스트 (`npm run dev:ssr`)
  - [ ] SSG 모드 테스트 (`npm run preview:ssg`)
  - [ ] 라우팅 및 하이드레이션 테스트
  - [ ] 성능 메트릭 수집

- [ ] **SEO 최적화 검증**
  - [ ] 메타태그 동적 생성 확인
    - [ ] 홈페이지 기본 메타태그
    - [ ] 상품 상세 동적 메타태그
    - [ ] 검색어 기반 메타태그
  - [ ] Open Graph 태그 설정
  - [ ] 구조화된 데이터 추가 (JSON-LD)
  - [ ] robots.txt 및 sitemap.xml

- [ ] **성능 모니터링**
  - [ ] 서버 렌더링 시간 측정
    - [ ] 각 페이지별 SSR 성능
    - [ ] 데이터 프리페칭 시간
  - [ ] 메모리 사용량 모니터링
  - [ ] 클라이언트 하이드레이션 성능
    - [ ] TTI (Time To Interactive)
    - [ ] LCP (Largest Contentful Paint)
  - [ ] 바닐라 버전과 성능 비교

- [ ] **최종 검증**
  - [ ] 모든 렌더링 모드에서 동일한 결과 출력
  - [ ] 브라우저 호환성 테스트
  - [ ] 접근성 검증
  - [ ] 보안 취약점 점검

#### Acceptance Criteria:

- [ ] 모든 렌더링 모드에서 정상 동작
- [ ] SEO 메타데이터 완전 적용
- [ ] 성능 기준치 달성 (바닐라 대비 동등 이상)
- [ ] E2E 테스트 100% 통과

---

## 📊 진행 상황 추적

### 완료된 단계

- [x] 1단계: 서버 사이드 라우터 구현
- [x] 2단계: 페이지 컴포넌트 SSR 지원
- [x] 3단계: Express 서버 고도화
- [x] 4단계: 클라이언트 하이드레이션
- [ ] 5단계: 정적 사이트 생성 (SSG)
- [ ] 6단계: 스트리밍 SSR (선택사항)
- [ ] 7단계: 통합 테스트 및 최적화

### 현재 작업 중

**단계:** 5단계 - 정적 사이트 생성 (SSG)  
**작업:** 준비 중  
**진행률:** 0%

### 다음 할 일

1. static-site-generate.js 고도화
2. 동적 라우트 페이지 목록 생성
3. Vite SSR 모듈 로딩 통합

---

## 🔧 기술 스택 및 의존성

### 핵심 기술

- **React 18**: 최신 SSR 기능 (`hydrateRoot`, `renderToPipeableStream`)
- **TypeScript**: 타입 안전성 보장
- **Express**: SSR 서버
- **Vite**: 개발 서버 및 빌드 도구
- **MSW**: API 모킹

### 주요 파일 구조

```
src/
├── router/
│   ├── ServerRouter.ts     # 서버 라우터 (신규)
│   ├── routes.ts          # 공통 라우트 설정 (수정)
│   └── router.ts          # 클라이언트 라우터 (기존)
├── pages/
│   ├── HomePage.tsx       # SSR 지원 추가
│   ├── ProductDetailPage.tsx # SSR 지원 추가
│   └── NotFoundPage.tsx   # SSR 지원 추가
├── types/
│   └── ssr.ts            # SSR 타입 정의 (신규)
├── main.tsx              # 하이드레이션 로직 (수정)
└── main-server.tsx       # SSR 진입점 (구현)
```

### 성능 목표

- **TTFB**: < 200ms
- **TTI**: < 1500ms
- **LCP**: < 2000ms
- **하이드레이션**: < 100ms

---

## 📝 참고 자료

### 바닐라 구현 참고 파일

- `/packages/vanilla/server.js` - Express 서버 구조
- `/packages/vanilla/src/main-server.js` - 렌더 함수 구조
- `/packages/vanilla/src/lib/ServerRouter.js` - 서버 라우터 로직
- `/packages/vanilla/src/pages/HomePage.js` - 페이지 SSR 패턴
- `/packages/vanilla/static-site-generate.js` - SSG 구현

### React 18 SSR 공식 문서

- [React 18 Suspense SSR](https://react.dev/reference/react-dom/server)
- [hydrateRoot API](https://react.dev/reference/react-dom/client/hydrateRoot)
- [renderToPipeableStream](https://react.dev/reference/react-dom/server/renderToPipeableStream)

---

## ⚠️ 주의사항

1. **하이드레이션 불일치**: 서버와 클라이언트 렌더링 결과가 정확히 일치해야 함
2. **메모리 누수**: 서버에서 요청별 상태 격리 필수
3. **타입 안전성**: SSR 관련 모든 함수에 적절한 타입 정의
4. **성능**: 바닐라 버전 대비 성능 저하 없도록 최적화
5. **호환성**: 기존 클라이언트 로직과의 호환성 유지

---

**마지막 업데이트:** 2024-12-19  
**작성자:** Assistant  
**다음 리뷰 예정일:** \_\_\_
