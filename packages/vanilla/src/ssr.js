import { App } from "./components/Todo.js";

export const generateHTML = ({ todoItems }) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Todo List</title>
  </head>
  <body>
  <div id="app">
        ${App(todoItems)}
  </body>
    <script type="module" src="/src/test-main.js"></script>
       <script>window.__INITIAL_MODEL__ = ${JSON.stringify({ todoItems })}</script>
  </html>
`;
