const { getAllFilePathsWithExtension, readFile } = require("./fileSystem");
const { readLine } = require("./console");

const files = getFiles();

console.log("Please, write your command!");
readLine(processCommand);

function getFiles() {
  const filePaths = getAllFilePathsWithExtension(process.cwd(), "js");
  return filePaths.map((path) => readFile(path));
}

function isGood(str) {
  const splitedStr = str.split("TODO")[0];
  if (
    splitedStr.split("").filter((x) => x == "'").length % 2 == 0 &&
    splitedStr.split("").filter((x) => x == '"').length % 2 == 0 &&
    splitedStr.split("").filter((x) => x == "`").length % 2 == 0
  ) {
    return true;
  }

  return false;
}

function getTodos() {
  const files = getFiles();
  const todos = [];
  for (const file of files) {
    let lines = file.split("\n");
    for (const line of lines) {
      if (line.includes("// TODO") && isGood(line)) {
        todos.push(`//${line.split("//")[1]}`);
      }
    }
  }

  return todos;
}

function checkRe(str) {
  const regex = /\/\/ TODO\s+([^;]+);\s+([^;]+);\s+(.+)/;

  const match = str.match(regex);
  
  if (match) {
    const author = match[1].trim();
    const date = match[2].trim();
    const comment = match[3].trim();
    return { author: author, date: date, comment: comment, raw: str }
  }
  else {
    return false;
  }
  
}

function calculateColumnWidths(todos) {
  let maxImportance = 1;
  let maxUser = 0;
  let maxDate = 0;
  let maxComment = 0;

  for (const todo of todos) {
    const parsedTodo = checkRe(todo);
    if (parsedTodo) {
      const importance = todo.includes("!") ? 1 : 0;
      const userLength = parsedTodo.author.length;
      const dateLength = parsedTodo.date.length;
      const commentLength = parsedTodo.comment.length;

      if (userLength > maxUser) maxUser = userLength;
      if (dateLength > maxDate) maxDate = dateLength;
      if (commentLength > maxComment) maxComment = commentLength;
    }
  }


  return {
    importance: Math.min(maxImportance, 1),
    user: Math.min(maxUser, 10),
    date: Math.min(maxDate, 10),
    comment: Math.min(maxComment, 50),
  };
}

function formatTableRow(importance, user, date, comment, widths) {
  const importanceFormatted = importance.padEnd(widths.importance).slice(0, widths.importance);
  const userFormatted = user.slice(0, widths.user).padEnd(widths.user);
  const dateFormatted = date.slice(0, widths.date).padEnd(widths.date);
  const commentFormatted = comment.slice(0, widths.comment).padEnd(widths.comment);

  const commentDisplay = comment.length > widths.comment ? commentFormatted.slice(0, widths.comment - 3) + "..." : commentFormatted;

  return `  ${importanceFormatted}  |  ${userFormatted}  |  ${dateFormatted}  |  ${commentDisplay}`;
}


function printTodos(todos) {
  const widths = calculateColumnWidths(todos);
  for (const todo of todos) {
    const parsedTodo = checkRe(todo);
    if (parsedTodo) {
      const importance = todo.includes("!") ? "!" : " ";
      const user = parsedTodo.author;
      const date = parsedTodo.date;
      const comment = parsedTodo.comment;
      console.log(formatTableRow(importance, user, date, comment, widths));
    }
  }
}

function processCommand(command) {
  const splitedCommand = command.split(' ');
  switch (splitedCommand[0]) {
    case "important":
      const importantTodos = getTodos().filter((x) => x.includes("!"));
      printTodos(importantTodos);
      break;
    case "exit":
      process.exit(0);
      break;
    case "show":
      const todos = getTodos();
      printTodos(todos);
      break;
    case "user":
      const reTodos = getTodos().map(checkRe);
      const userTodos = reTodos.filter((todo) => todo && todo.author.toLowerCase() === splitedCommand[1].toLowerCase());
      printTodos(userTodos.map((todo) => todo.raw));
      break;
    case "date":
      if (splitedCommand.length < 2) {
        console.log("Wrong command format. Use: date {yyyy[-mm[-dd]]}");
        break;
      }
      const dateStr = splitedCommand[1];
      const targetDate = parseDate(dateStr);
      const reTodosForDate = getTodos().map(checkRe);
      const filteredTodos = reTodosForDate.filter((todo) => {
        if (todo) {
          const todoDate = parseDate(todo.date);
          return todoDate > targetDate;
        }
        return false;
      });
      printTodos(filteredTodos.map((todo) => todo.raw));
      break;
    default:
      console.log("wrong command");
      break;
  }
}

function parseDate(dateStr) {
  const parts = dateStr.split("-");
  const year = parseInt(parts[0]);
  const month = parts[1] ? parseInt(parts[1]) - 1 : 0; // Месяцы в JavaScript начинаются с 0
  const day = parts[2] ? parseInt(parts[2]) : 1;
  return new Date(year, month, day);
}

// TODO you can do it
