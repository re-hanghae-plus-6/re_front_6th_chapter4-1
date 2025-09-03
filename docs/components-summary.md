# 컴포넌트 시스템 요약

## 🧩 컴포넌트 구조

### 1. 함수형 컴포넌트 패턴
```javascript
// 기본 구조
export function ComponentName(props) {
  return `<div>${props.content}</div>`;
}
```

### 2. 주요 컴포넌트들

#### ProductCard
- 상품 정보 표시
- 장바구니 추가 버튼
- 이미지, 제목, 가격, 브랜드

#### ProductList  
- 상품 목록 그리드
- 로딩/에러 상태 처리
- 무한 스크롤 지원

#### SearchBar
- 검색 입력창
- 카테고리 필터
- 정렬/개수 선택

#### CartModal
- 장바구니 모달
- 수량 조절
- 선택/삭제 기능

#### Toast
- 알림 메시지
- 성공/에러/경고 타입

### 3. 페이지 래퍼 패턴
```javascript
export const PageWrapper = ({ headerLeft, children }) => {
  return `
    <div class="min-h-screen">
      <header>${headerLeft}</header>
      <main>${children}</main>
      ${CartModal()}
      ${Toast()}
    </div>
  `;
};
```

### 4. 라이프사이클 관리
```javascript
export const HomePage = withLifecycle(
  {
    onMount: () => loadData(),
    watches: [() => [router.query], () => updateData()]
  },
  () => renderComponent()
);
```

## 🎯 핵심 특징

- **함수형**: 모든 컴포넌트는 함수로 구현
- **템플릿 리터럴**: HTML 문자열 반환
- **Props 기반**: 매개변수로 데이터 전달
- **조합 가능**: 작은 컴포넌트들을 조합하여 복잡한 UI 구성
- **이벤트 위임**: data-* 속성으로 이벤트 처리

## 📝 사용 예시

```javascript
// 컴포넌트 사용
const productCard = ProductCard({
  productId: "123",
  title: "상품명",
  price: 10000
});

// 페이지에서 조합
const homePage = PageWrapper({
  headerLeft: `<h1>쇼핑몰</h1>`,
  children: `${SearchBar()} ${ProductList()}`
});
```

이런 식으로 간단하고 핵심적인 내용만 포함하여 작성하면 토큰 제한을 피할 수 있습니다.
