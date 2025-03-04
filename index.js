const { getAllFilePathsWithExtension, readFile } = require("./fileSystem");
const { readLine } = require("./console");
const path = require("path");

console.log("Please, write your command!");
readLine(processCommand);

function getFiles() {
  const filePaths = getAllFilePathsWithExtension(process.cwd(), "js");
  return filePaths.map((filePath) => ({
    filename: path.basename(filePath),
    content: readFile(filePath),
  }));
}

function isGood(str) {
  const splitedStr = str.split("TODO")[0];
  if (
    splitedStr.split("").filter((x) => x === "'").length % 2 === 0 &&
    splitedStr.split("").filter((x) => x === '"').length % 2 === 0 &&
    splitedStr.split("").filter((x) => x === "`").length % 2 === 0
  ) {
    return true;
  }
  return false;
}

function getTodos() {
  const filesData = getFiles();
  const todos = [];
  for (const fileData of filesData) {
    const { filename, content } = fileData;
    const lines = content.split("\n");
    for (const line of lines) {
      if (line.includes("// TODO") && isGood(line)) {
        todos.push({
          raw: `//${line.split("//")[1]}`,
          fileName: filename,
        });
      }
    }
  }
  return todos;
}

function checkRe(todoObj) {
  if (!todoObj || !todoObj.raw) return false;
  const str = todoObj.raw;
  const regex = /\/\/ TODO\s+([^;]+);\s*([^;]+);\s*(.+)/;
  const match = str.match(regex);

  if (match) {
    const author = match[1].trim();
    const date = match[2].trim();
    const comment = match[3].trim();
    return {
      author,
      date,
      comment,
      raw: str,
      file: todoObj.fileName,
    };
  } else {
    return false;
  }
}

function calculateColumnWidths(todos) {
  let maxImportance = 1;
  let maxUser = "user".length;
  let maxDate = "date".length;
  let maxFile = "file".length;
  let maxComment = "comment".length;

  for (const t of todos) {
    if (t.author !== undefined) {
      maxUser = Math.max(maxUser, t.author.length);
      maxDate = Math.max(maxDate, t.date.length);
      maxComment = Math.max(maxComment, t.comment.length);
      maxFile = Math.max(maxFile, t.file ? t.file.length : 0);
    } else {
      const rawText = t.raw || "";
      maxComment = Math.max(
        maxComment,
        rawText.replace("// TODO", "").trim().length
      );
      maxFile = Math.max(maxFile, t.fileName ? t.fileName.length : 0);
    }
  }

  return {
    importance: Math.min(maxImportance, 1),
    user: Math.min(maxUser, 10),
    date: Math.min(maxDate, 10),
    file: Math.min(maxFile, 20),
    comment: Math.min(maxComment, 50),
  };
}

function formatTableRow(importance, user, date, file, comment, widths) {
  const importanceFormatted = importance
    .padEnd(widths.importance)
    .slice(0, widths.importance);

  let userFormatted = user.slice(0, widths.user);
  userFormatted = userFormatted.padEnd(widths.user);

  let dateFormatted = date.slice(0, widths.date);
  dateFormatted = dateFormatted.padEnd(widths.date);

  let fileFormatted = file.slice(0, widths.file);
  fileFormatted = fileFormatted.padEnd(widths.file);

  let commentSlice = comment.slice(0, widths.comment);
  if (comment.length > widths.comment) {
    commentSlice = commentSlice.slice(0, widths.comment - 3) + "...";
  }
  const commentFormatted = commentSlice.padEnd(widths.comment);

  return `  ${importanceFormatted}  |  ${userFormatted}  |  ${dateFormatted}  |  ${fileFormatted}  |  ${commentFormatted}`;
}

function getHeader(widths) {
  return formatTableRow("!", "user", "date", "file", "comment", widths);
}

function getSeparator(widths) {
  const totalLength =
    2 +
    widths.importance +
    2 +
    3 +
    (2 + widths.user + 2 + 3) +
    (2 + widths.date + 2 + 3) +
    (2 + widths.file + 2 + 3) +
    (2 + widths.comment + 2);
  return "-".repeat(totalLength);
}

function printTodos(todoObjects) {
  if (todoObjects.length === 0) {
    return;
  }

  const parsed = todoObjects.map((obj) => {
    const parsedObj = checkRe(obj);
    if (parsedObj) {
      return parsedObj;
    } else {
      return {
        author: "",
        date: "",
        comment: obj.raw.replace("// TODO", "").trim(),
        raw: obj.raw,
        file: obj.fileName,
      };
    }
  });

  const widths = calculateColumnWidths(parsed);

  console.log(getHeader(widths));
  console.log(getSeparator(widths));

  for (const p of parsed) {
    const importance = p.raw.includes("!") ? "!" : " ";
    console.log(
      formatTableRow(
        importance,
        p.author || "",
        p.date || "",
        p.file || "",
        p.comment || "",
        widths
      )
    );
  }

  console.log(getSeparator(widths));
}

function parseDate(dateStr) {
  const parts = dateStr.split("-");
  const year = parseInt(parts[0], 10);
  const month = parts[1] ? parseInt(parts[1], 10) - 1 : 0;
  const day = parts[2] ? parseInt(parts[2], 10) : 1;
  return new Date(year, month, day);
}

function processCommand(command) {
  const splitedCommand = command.trim().split(" ");
  const cmd = splitedCommand[0];
  switch (cmd) {
    case "exit":
      process.exit(0);
      break;

    case "show": {
      const todos = getTodos();
      printTodos(todos);
      break;
    }

    case "important": {
      const todos = getTodos().filter((t) => t.raw.includes("!"));
      printTodos(todos);
      break;
    }

    case "user": {
      const userName = splitedCommand[1];
      if (!userName) {
        console.log("Не указан пользователь. Пример: user Veronika");
        break;
      }
      const todos = getTodos();
      const parsed = todos.map((obj) => {
        const parsedObj = checkRe(obj);
        if (parsedObj) {
          return parsedObj;
        } else {
          return {
            author: "",
            date: "",
            comment: obj.raw.replace("// TODO", "").trim(),
            raw: obj.raw,
            file: obj.fileName,
          };
        }
      });
      const filtered = parsed.filter(
        (p) => p.author.toLowerCase() === userName.toLowerCase()
      );
      printTodos(filtered);
      break;
    }

    case "sort": {
      const arg = splitedCommand[1];
      if (!arg) {
        console.log("Не указан критерий сортировки. Пример: sort user");
        break;
      }
      switch (arg) {
        case "importance": {
          const todos = getTodos();
          todos.sort(
            (a, b) => b.raw.split("!").length - a.raw.split("!").length
          );
          printTodos(todos);
          break;
        }

        case "user": {
          const todos = getTodos();
          const parsed = todos.map((obj) => {
            const parsedObj = checkRe(obj);
            if (parsedObj) {
              return parsedObj;
            } else {
              return {
                author: "",
                date: "",
                comment: obj.raw.replace("// TODO", "").trim(),
                raw: obj.raw,
                file: obj.fileName,
              };
            }
          });
          parsed.sort((a, b) => {
            if (a.author.toLowerCase() < b.author.toLowerCase()) return -1;
            if (a.author.toLowerCase() > b.author.toLowerCase()) return 1;
            return 0;
          });
          const withAuthor = parsed.filter((x) => x.author !== "");
          const withoutAuthor = parsed.filter((x) => x.author === "");
          const result = [...withAuthor, ...withoutAuthor];
          printTodos(result);
          break;
        }

        case "date": {
          const todos = getTodos();
          const parsed = todos.map((obj) => {
            const parsedObj = checkRe(obj);
            if (parsedObj) {
              const d = parseDate(parsedObj.date);
              return {
                ...parsedObj,
                dateObj: isNaN(d.getTime()) ? null : d,
              };
            } else {
              return {
                author: "",
                date: "",
                comment: obj.raw.replace("// TODO", "").trim(),
                raw: obj.raw,
                file: obj.fileName,
                dateObj: null,
              };
            }
          });
          parsed.sort((a, b) => {
            if (b.dateObj && a.dateObj) {
              return b.dateObj - a.dateObj;
            } else if (b.dateObj && !a.dateObj) {
              return 1;
            } else if (!b.dateObj && a.dateObj) {
              return -1;
            } else {
              return 0;
            }
          });
          printTodos(parsed);
          break;
        }

        default:
          console.log("Неверный аргумент сортировки");
          break;
      }
      break;
    }

    case "date": {
      const dateStr = splitedCommand[1];
      if (!dateStr) {
        console.log("Не указана дата. Пример: date 2018-03-02");
        break;
      }
      const afterDate = parseDate(dateStr);
      if (isNaN(afterDate.getTime())) {
        console.log("Некорректный формат даты.");
        break;
      }
      const todos = getTodos();
      const parsed = todos.map((obj) => {
        const parsedObj = checkRe(obj);
        if (parsedObj) {
          return {
            ...parsedObj,
            file: obj.fileName,
          };
        } else {
          return {
            author: "",
            date: "",
            comment: obj.raw.replace("// TODO", "").trim(),
            raw: obj.raw,
            file: obj.fileName,
          };
        }
      });
      const filtered = parsed.filter((t) => {
        if (!t.date) return false;
        const d = parseDate(t.date);
        if (isNaN(d.getTime())) return false;
        return d > afterDate;
      });
      printTodos(filtered);
      break;
    }

    default:
      console.log("wrong command");
      break;
  }
}
