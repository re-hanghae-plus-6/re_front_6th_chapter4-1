const lifeCycles = new WeakMap();
const pageState = { current: null, previous: null };
const initLifecycle = { mount: null, unmount: null, watches: [], deps: [], mounted: false };

// 페이지의 생명주기 상태를 가져오거나 초기화
const getPageLifecycle = (page) => {
  if (!lifeCycles.has(page)) {
    lifeCycles.set(page, { ...initLifecycle });
  }
  return lifeCycles.get(page);
};

// 의존성 배열 비교 함수
const depsChanged = (newDeps, oldDeps) => {
  // 배열이 아니면 변경되지 않은 것으로 처리
  if (!Array.isArray(newDeps) || !Array.isArray(oldDeps)) {
    return false;
  }

  // 길이가 다르면 변경됨
  if (newDeps.length !== oldDeps.length) {
    return true;
  }

  // 각 요소 비교
  return newDeps.some((dep, index) => dep !== oldDeps[index]);
};

// 페이지 마운트 처리
const mount = (page) => {
  const lifecycle = getPageLifecycle(page);
  if (lifecycle.mounted) return;

  // 마운트 콜백들 실행
  lifecycle.mount?.();
  lifecycle.mounted = true;
  lifecycle.deps = [];
};

// 페이지 언마운트 처리
const unmount = (pageFunction) => {
  const lifecycle = getPageLifecycle(pageFunction);

  if (!lifecycle.mounted) return;

  // 언마운트 콜백들 실행
  lifecycle.unmount?.();
  lifecycle.mounted = false;
};

export const withLifecycle = ({ onMount, onUnmount, watches } = {}, page) => {
  const lifecycle = getPageLifecycle(page);
  if (typeof onMount === "function") {
    lifecycle.mount = onMount;
  }

  if (typeof onUnmount === "function") {
    lifecycle.unmount = onUnmount;
  }

  if (Array.isArray(watches)) {
    lifecycle.watches = typeof watches[0] === "function" ? [watches] : watches;
  }

  return (...args) => {
    const wasNewPage = pageState.current !== page;

    // 이전 페이지 언마운트
    if (pageState.current && wasNewPage) {
      unmount(pageState.current);
    }

    // 현재 페이지 설정
    pageState.previous = pageState.current;
    pageState.current = page;

    // 새 페이지면 마운트, 기존 페이지면 업데이트 (클라이언트 환경에서만 실행)
    if (typeof window !== "undefined") {
      // window 객체가 존재하는 클라이언트 환경에서만 생명주기 로직 실행
      if (wasNewPage) {
        mount(page, ...args); // 새 페이지인 경우 마운트
      } else if (lifecycle.watches) {
        // 기존 페이지인 경우 watches에 등록된 의존성 변화 감지 및 콜백 실행
        lifecycle.watches.forEach(([getDeps, callback], index) => {
          const newDeps = getDeps(...args); // 새로운 의존성 값 가져오기
          if (depsChanged(newDeps, lifecycle.deps[index])) {
            // 의존성 변경 여부 확인
            callback(...args); // 변경된 경우 콜백 실행
          }
          // 의존성 배열 업데이트
          lifecycle.deps[index] = Array.isArray(newDeps) ? [...newDeps] : [];
        });
      }
    }

    // 페이지 함수 실행
    return page(...args);
  };
};
