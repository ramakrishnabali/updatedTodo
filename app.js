const express = require("express");
const app = express();
const { open } = require("sqlite");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
const dbDriver = require("sqlite3");

let database = null;

app.use(express.json());

const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const isValid = require("date-fns/isValid");

const connectingDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: dbDriver.Database,
    });
    app.listen(3000, () => {
      console.log("server is running....");
    });
  } catch (error) {
    console.log(`database error ${error.message}`);
  }
};

connectingDbAndServer();

//scenario 1 status;
const isStatus = (status) => {
  return status.status !== undefined;
};

//scenario 2 priority
const isPriority = (priority) => {
  return priority.priority !== undefined;
};

//scenario 3
const isPriorityAndStatus = (object) => {
  return object.status !== undefined && object.priority !== undefined;
};

//scenario 5
const isCategoryAndStatus = (object) => {
  return object.status !== undefined && object.category !== undefined;
};

//scenario 6
const isCategory = (object) => {
  return object.category !== undefined;
};

//scenario 7
const isCategoryAndPriority = (object) => {
  return object.category !== undefined && object.priority !== undefined;
};

const isSearch_q = (object) => {
  return object.search_q !== undefined;
};

app.get("/todos/", async (request, response) => {
  const { search_q = "", status, priority, category } = request.query;
  let sqlQuery;
  const queryObject = request.query;
  switch (true) {
    case isStatus(queryObject):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        sqlQuery = `SELECT * FROM todo WHERE status = "${status}";`;
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case isPriority(queryObject):
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        sqlQuery = `SELECT * FROM todo WHERE priority = "${priority}";`;
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case isPriorityAndStatus(queryObject):
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          sqlQuery = `SELECT * FROM todo WHERE status = "${status}" AND priority = "${priority}";`;
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case isCategoryAndStatus(queryObject):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          sqlQuery = `SELECT * FROM todo WHERE status = "${status}" AND category = "${category}";`;
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case isCategory(queryObject):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        sqlQuery = `SELECT * FROM todo WHERE category = "${category}";`;
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case isCategoryAndPriority(queryObject):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "LOW" ||
          priority === "MEDIUM"
        ) {
          sqlQuery = `SELECT * FROM todo WHERE priority = "${priority}";`;
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case isSearch_q(queryObject):
      sqlQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%";`;
      break;
    default:
      sqlQuery = `SELECT * FROM todo;`;
  }
  //console.log(request.query);
  if (sqlQuery !== undefined) {
    const data = await database.all(sqlQuery);
    response.send(
      data.map((each) => ({
        id: each.id,
        todo: each.todo,
        priority: each.priority,
        status: each.status,
        category: each.category,
        dueDate: each.due_date,
      }))
    );
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const data = await database.get(todoQuery);
  response.send({
    id: data.id,
    todo: data.todo,
    priority: data.priority,
    status: data.status,
    category: data.category,
    dueDate: data.due_date,
  });
});

//agenda
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const isDate = isValid(new Date(date));
  //console.log(isDate);
  if (isDate) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    //console.log(newDate);
    const dateQuery = `SELECT * FROM todo WHERE due_date = "${newDate}";`;
    const dateResponse = await database.all(dateQuery);
    response.send(
      dateResponse.map((each) => ({
        id: each.id,
        todo: each.todo,
        priority: each.priority,
        status: each.status,
        category: each.category,
        dueDate: each.due_date,
      }))
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//post a todo
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  //console.log(request.body);
  const { id, todo, priority, status, category, dueDate } = todoDetails;
  const isDate = isValid(new Date(dueDate));
  if (category === "WORK" || category === "HOME" || category === "LEARNING") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        if (isDate) {
          const newDate = format(new Date(dueDate), "yyyy-MM-dd");
          const sqlQuery = `INSERT INTO todo(id,todo,priority,status,category,due_date)
                                VALUES (
                                    ${id},
                                    "${todo}",
                                  "${priority}",
                                    "${status}",
                                    "${category}",
                                    "${newDate}");`;
          await database.run(sqlQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Category");
  }
});

//update todo
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { todo, priority, status, category, dueDate } = request.body;
  let updateQuery;
  let updatedOn;
  switch (true) {
    case status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateQuery = `UPDATE todo SET status = "${status}" WHERE id =${todoId};`;
        updatedOn = "Status";
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case priority !== undefined:
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        updateQuery = `UPDATE todo SET priority = "${priority}" WHERE id =${todoId};`;
        updatedOn = "Priority";
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateQuery = `UPDATE todo SET Category = "${category}" WHERE id =${todoId};`;
        updatedOn = "Category";
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case dueDate !== undefined:
      const isDate = isValid(new Date(dueDate));
      if (isDate) {
        const newDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateQuery = `UPDATE todo SET due_date = "${newDate}" WHERE id =${todoId};`;
        updatedOn = "Due Date";
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
    default:
      updateQuery = `UPDATE todo SET todo = "${todo}" WHERE id =${todoId};`;
      updatedOn = "Todo";
  }
  if (updateQuery !== undefined) {
    await database.run(updateQuery);
    response.send(`${updatedOn} Updated`);
  }
});

//delete todo
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const sqlQuery = `DELETE FROM todo WHERE id =${todoId};`;
  await database.run(sqlQuery);
  response.send("Todo Deleted");
});

module.exports = app;
