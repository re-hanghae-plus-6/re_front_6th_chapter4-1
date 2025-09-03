import { App } from "./components/Todo.js";
import { model } from "./model.js";

function render() {
  const $app = document.getElementById("app");
  $app.innerHTML = App(model.todoItems);

  $app.querySelector("#add").onclick = () => {
    model.addTodoItem("새로운 아이템");
    render();
  };

  $app.querySelector("#delete").onclick = () => {
    model.removeTodoItem(0);
    render();
  };
}

function main() {
  model.init(window.__INITIAL_MODEL__);
  render();
}

main();
