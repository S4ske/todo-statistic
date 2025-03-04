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

function processCommand(command) {
  const splitedCommand = command.split(' ');
  switch (splitedCommand[0]) {
    case "important":
      const importantTodos = getTodos().filter((x) => x.includes("!"));
      for (const todo of importantTodos) {
        console.log(todo);
      }
      break;
    case "exit":
      process.exit(0);
      break;
    case "show":
      const todos = getTodos();
      for (const todo of todos) {
        console.log(todo);
      }
      break;
    case "user":
      const reTodos = getTodos().map(checkRe);
      for (const todo of reTodos) {
        if (todo && todo.author.toLowerCase() === splitedCommand[1].toLowerCase()) {
          console.log(todo.raw);
        }
      }
      break;
    default:
      console.log("wrong command");
      break;
  }
}

// TODO you can do it!
