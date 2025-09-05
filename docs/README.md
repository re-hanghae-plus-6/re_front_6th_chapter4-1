# Vanilla JavaScript SSR/SSG 구현 문서

## 📚 문서 목록

### 1. [구현 계획서](./vanilla-ssr-ssg-implementation-plan.md)

전체 프로젝트의 구현 계획과 아키텍처를 설명하는 문서입니다.

**주요 내용:**

- 프로젝트 개요 및 목표
- 구현 우선순위 및 단계별 계획
- 세부 구현 태스크 및 코드 예시
- 실행 순서 및 빌드 가이드
- 체크리스트 및 성공 기준

### 2. [단계별 태스크 목록](./step-by-step-tasks.md)

사용자가 직접 수행할 수 있는 상세한 단계별 태스크 목록입니다.

**주요 내용:**

- 5단계별 세부 구현 태스크
- 각 태스크별 구체적인 코드 예시
- 테스트 및 검증 방법
- 주의사항 및 완료 체크리스트

## 🎯 프로젝트 목표

바닐라 자바스크립트로 **Express SSR 서버**, **Static Site Generation**, **서버/클라이언트 데이터 공유**를 구현하여 완전한 SSR/SSG 시스템을 구축하는 것입니다.

## 🚀 시작하기

### 1. 구현 계획서 읽기

먼저 [구현 계획서](./vanilla-ssr-ssg-implementation-plan.md)를 읽어 전체적인 구조와 목표를 이해하세요.

### 2. 단계별 태스크 수행

[단계별 태스크 목록](./step-by-step-tasks.md)을 따라 순서대로 구현을 진행하세요.

### 3. 테스트 및 검증

각 단계가 완료되면 해당 단계의 완료 조건을 확인하고 다음 단계로 진행하세요.

## 📋 핵심 요구사항

- ✅ Express SSR 서버 구현
- ✅ Static Site Generation (SSG)
- ✅ 서버/클라이언트 데이터 공유
- ✅ E2E 테스트 통과

## 🔧 기술 스택

- **언어**: Vanilla JavaScript (ES6+)
- **서버**: Express.js
- **빌드 도구**: Vite
- **테스트**: Playwright
- **상태 관리**: Redux-style Store 패턴
- **라우팅**: SPA Router

## 📁 프로젝트 구조

```
packages/vanilla/
├── src/
│   ├── main.js              # 클라이언트 진입점
│   ├── main-server.js       # 서버 렌더링 엔진
│   ├── server.js            # Express SSR 서버
│   ├── static-site-generate.js  # SSG 엔진
│   ├── components/          # UI 컴포넌트
│   ├── stores/              # 상태 관리
│   ├── api/                 # API 호출
│   └── ...
├── dist/                    # 빌드 결과물
└── package.json
```

## 🎯 최종 목표

모든 체크리스트 항목이 완료되고 E2E 테스트가 통과하는 완전한 SSR/SSG 시스템을 구축하는 것입니다.

**성공 기준:**

- ✅ Express SSR 서버가 정상 동작
- ✅ Static Site Generation이 정상 동작
- ✅ 서버/클라이언트 데이터가 정상 공유
- ✅ E2E 테스트 통과
- ✅ 모든 빌드 스크립트 정상 동작

---

**시작하기**: [구현 계획서](./vanilla-ssr-ssg-implementation-plan.md)부터 읽어보세요!
