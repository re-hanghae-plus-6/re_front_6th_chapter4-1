// 새로운 h1 요소를 생성합니다.
const heading = document.createElement("h1");

// h1 요소에 텍스트 내용을 설정합니다.
heading.textContent = "동적으로 생성된 H1 태그입니다!";

// body 태그에 h1 요소를 추가합니다.
document.body.appendChild(heading);
