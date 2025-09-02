/**
 * 전역 이벤트 핸들러 저장소
 * eventType -> selector -> handler 구조
 */
const eventHandlers = {};

/**
 * 전역 이벤트 처리 함수
 */
const handleGlobalEvents = (e) => {
  const handlers = eventHandlers[e.type];
  if (!handlers) {
    console.log(`🔍 이벤트 핸들러 없음: ${e.type}`, e.target);
    return;
  }

  console.log(`🎯 이벤트 발생: ${e.type}`, e.target, "등록된 핸들러:", Object.keys(handlers));

  // 각 선택자에 대해 확인
  for (const [selector, handler] of Object.entries(handlers)) {
    const targetElement = e.target.closest(selector);
    console.log(`🔍 선택자 매칭 시도: ${selector}`, targetElement);

    // 일치하는 요소가 있으면 핸들러 실행
    if (targetElement) {
      console.log(`✅ 핸들러 실행: ${selector}`);
      try {
        handler(e);
      } catch (error) {
        console.error(`이벤트 핸들러 실행 오류 (${selector}):`, error);
      }
    }
  }
};

/**
 * 전역 이벤트 리스너 등록 (한 번만 실행)
 */
export const registerGlobalEvents = (() => {
  let initialized = false;
  return () => {
    if (initialized) {
      return;
    }

    // 모든 이벤트 타입에 대해 전역 이벤트 리스너 등록
    const eventTypes = ["click", "change", "keydown", "keyup", "submit", "scroll"];
    eventTypes.forEach((eventType) => {
      document.body.addEventListener(eventType, handleGlobalEvents);
    });

    initialized = true;
  };
})();

/**
 * 이벤트 위임을 통한 이벤트 핸들러 추가
 * @param {string} eventType - 이벤트 타입 (click, submit 등)
 * @param {string} selector - CSS 선택자
 * @param {Function} handler - 이벤트 핸들러 함수
 */
export const addEvent = (eventType, selector, handler) => {
  if (!eventHandlers[eventType]) {
    eventHandlers[eventType] = {};
  }

  eventHandlers[eventType][selector] = handler;
  console.log(`🎯 이벤트 등록: ${eventType} -> ${selector}`);
};

/**
 * 등록된 이벤트 핸들러 확인 (디버깅용)
 */
export const getRegisteredEvents = () => {
  return eventHandlers;
};
