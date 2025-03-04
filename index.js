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

function processCommand(command) {
  switch (command) {
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
    default:
      console.log("wrong command");
      break;
  }
}

// TODO you can do it!
