# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 개발 명령어

### 개발 서버
- `pnpm run dev`: CSR 개발 서버 실행 (포트 5173)
- `pnpm run dev:ssr`: SSR 개발 서버 실행 (포트 5174)

### 빌드
- `pnpm run build`: 전체 빌드 (CSR + SSR + SSG)
- `pnpm run build:client`: 클라이언트 빌드만 실행
- `pnpm run build:server`: 서버 사이드 빌드만 실행
- `pnpm run build:ssg`: 정적 사이트 생성

### 미리보기
- `pnpm run preview:csr`: 클라이언트 빌드 미리보기
- `pnpm run preview:ssr`: SSR 빌드 미리보기 (포트 4174)
- `pnpm run preview:ssg`: SSG 빌드 미리보기 (포트 4178)

### 테스트 및 코드 품질
- `pnpm run lint:fix`: ESLint 자동 수정 실행
- `pnpm run prettier:write`: Prettier 포매팅 적용
- `pnpm run serve:test`: 모든 서버 동시 실행 (개발용)

### 중요사항: 스타일 변경 금지
- **절대 styles.css 파일을 수정하거나 변경하지 마세요**
- 기존 스타일링은 그대로 유지해야 합니다

## 프로젝트 아키텍처

### Redux-style 상태관리 패턴
프로젝트는 바닐라 JS로 Redux 패턴을 구현한 상태관리 시스템을 사용합니다:

- **Store 구조**: `src/lib/createStore.js`에서 Redux-like store 생성
- **Observer 패턴**: `src/lib/createObserver.js`로 상태 변경 감지 및 알림
- **스토어 분리**:
  - `productStore.js`: 상품 목록, 상세, 카테고리, 검색 상태
  - `cartStore.js`: 장바구니 아이템, 선택 상태, 총계
  - `uiStore.js`: 모달, 토스트, 로딩 상태

### SPA 라우팅 시스템
- **커스텀 라우터**: `src/lib/Router.js`에서 SPA 라우팅 구현
- **매개변수 지원**: `/products/:id` 형태의 동적 라우팅
- **쿼리 파라미터**: 검색, 필터링, 페이징 상태 관리
- **라우트**:
  - `/`: 홈페이지 (상품 목록)
  - `/products/:id/`: 상품 상세 페이지

### 컴포넌트 기반 아키텍처
- **재사용 컴포넌트**: `src/components/` - UI 컴포넌트들
- **페이지 컴포넌트**: `src/pages/` - 라우트별 페이지
- **서비스 레이어**: `src/services/` - 비즈니스 로직 및 API 호출

### 렌더링 전략
- **CSR**: 클라이언트사이드 렌더링 (기본)
- **SSR**: Express.js 서버를 통한 서버사이드 렌더링
- **SSG**: 정적 사이트 생성 (사전 빌드)
- **하이드레이션**: 서버 렌더링된 페이지의 클라이언트 활성화

### 핵심 기능들
- **무한스크롤 페이징**: 상품 목록의 점진적 로딩
- **실시간 검색/필터링**: 검색어, 카테고리, 정렬 기능
- **장바구니 관리**: 로컬스토리지 기반 영구 저장
- **모달 시스템**: 장바구니 등의 오버레이 UI
- **토스트 알림**: 사용자 액션 피드백

## 데이터 흐름
1. **API 호출**: `src/services/`에서 MSW 모킹된 API 호출
2. **상태 업데이트**: Redux-style action dispatch를 통한 스토어 업데이트
3. **UI 반응**: Observer 패턴으로 상태 변경 시 자동 리렌더링
4. **영구 저장**: 장바구니 등은 localStorage에 자동 저장

## 개발 시 주의사항
- MSW를 통해 API가 모킹되어 있으므로 실제 API 서버 불필요
- 모든 상태 변경은 store의 dispatch를 통해서만 수행
- 컴포넌트 라이프사이클은 수동으로 관리 (mount/unmount)
- SEO를 위해 SSR/SSG 빌드 시 메타태그 및 구조화된 데이터 생성

## 추가 구현 과제 (SSR/SSG)

### 목표
- Express SSR 서버 구현
- Static Site Generation
- 서버/클라이언트 데이터 공유

### 체크리스트
#### Express SSR 서버
- [ ] Express 미들웨어 기반 서버 구현 (`server.js`)
- [ ] 개발/프로덕션 환경 분기 처리
- [ ] HTML 템플릿 치환 (`<!--app-html-->`, `<!--app-head-->`)

#### 서버 사이드 렌더링
- [ ] 서버에서 동작하는 Router 구현 (`main-server.js`)
- [ ] 서버 데이터 프리페칭 (상품 목록, 상품 상세)
- [ ] 서버 상태관리 초기화

#### 클라이언트 Hydration
- [ ] `window.__INITIAL_DATA__` 스크립트 주입
- [ ] 클라이언트 상태 복원 (`main.js`)
- [ ] 서버-클라이언트 데이터 일치

#### Static Site Generation
- [ ] 동적 라우트 SSG (상품 상세 페이지들) (`static-site-generate.js`)
- [ ] 빌드 타임 페이지 생성
- [ ] 파일 시스템 기반 배포

### 테스트 실행
```bash
pnpm run test:e2e:basic
pnpm run test:e2e:ui
```