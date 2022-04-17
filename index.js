const inquirer = require("inquirer");

const SqlDb = require("./server");
const showTable = require("console.table");

let exit = false;

// Create db connection
const db = new SqlDb(
  {
    host: "localhost",
    user: "root",
    password: "mysqlPassword",
    database: "employerSystem_db",
  },
  console.log("Connection success to employerSystem_db database.")
);

async function showTableDepartments(showTable = false) {
  const query =
    "SELECT department.id, department.name as 'department' FROM department";
  const rows = await db.query(query);
  if (showTable) {
    return console.table(rows);
  } else {
    return rows.map((element) => {
      return `${element.id}| Department:${element.department}`;
    });
  }
}

async function showTableRoles(showTable = false) {
  const query =
    "SELECT roles.id, roles.title, roles.salary, department.name as 'department' FROM roles JOIN department ON roles.department_id = department.id";
  const rows = await db.query(query);
  if (showTable) {
    return console.table(rows);
  } else {
    return rows.map((element) => {
      return `${element.id}| Role:${element.title}`;
    });
  }
}

async function showTableEmployee(showTable = false) {
  const query =
    "SELECT employee.id, CONCAT(employee.last_name, ', ',employee.first_name) AS 'Employee', roles.title, employee.manager_id from employee JOIN roles on employee.role_id = roles.id";
  const rows = await db.query(query);
  if (showTable) {
    return console.table(rows);
  } else {
    return rows.map((element) => {
      return `${element.id}|${element.Employee}`;
    });
  }
}

async function addDepartment() {
  const department = await getNewDepartmentName();
  const args = [department.name];
  const query = "INSERT INTO department (name) VALUES (?)";
  await db.query(query, args);
  await showTableDepartments(true);
  console.log(`New Department "${department.name}" added!`);
}

async function addRole() {
  const role = await getNewRoleName();
  const departmentId = role.name.split("|")[0];
  const args = [role.title, role.salary, departmentId];
  const query =
    "INSERT INTO roles (title, salary, department_id) VALUES (?,?,?)";
  await db.query(query, args);
  await showTableRoles(true);
  console.log(
    `New Role "${role.title}" was added into department ${
      role.name.split(":")[1]
    }!`
  );
}

async function addEmployee() {
  const newEmployee = await getNewEmployee();
  const roleId = newEmployee.role.split("|")[0];
  const managerId =
    newEmployee.manager.split("|")[0] === "No Manager"
      ? null
      : newEmployee.manager.split("|")[0];
  const args = [
    newEmployee.first_name,
    newEmployee.last_name,
    roleId,
    managerId,
  ];
  const query =
    "INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?,?,?,?)";
  await db.query(query, args);
  await showTableEmployee(true);
  console.log(
    `New Employee "${newEmployee.first_name}, ${newEmployee.last_name}" added!`
  );
}

async function updateEmployee() {
  const EmployeeToUpdate = await getEmployeeToUpdate();
  const roleId = EmployeeToUpdate.role.split("|")[0];
  const employeeId = EmployeeToUpdate.fullname.split("|")[0];

  let managerId = await findManagerId(employeeId);
  if (EmployeeToUpdate.action === "Yes") {
    const newManager = await changeManager();
    managerId =
      newManager.manager.split("|")[0] === "No Manager"
        ? null
        : newManager.manager.split("|")[0];
  }
  const args = [roleId, managerId, employeeId];
  const query =
    "UPDATE employee SET role_id=?, manager_id=? WHERE employee.id=?";
  const rows = await db.query(query, args);
  await showTableEmployee(true);
  console.log(
    `The information for "${
      EmployeeToUpdate.fullname.split("|")[1]
    }" was saved correctly!`
  );
}

async function showAllManagers() {
  const query =
    "SELECT id, first_name, last_name FROM employee WHERE manager_id is null";
  const rows = await db.query(query);
  const manager = rows.map((element) => {
    return `${element.id}|${element.last_name}, ${element.first_name} `;
  });
  manager.push("No Manager");
  return manager;
}

async function findManagerId(id) {
  const query = "SELECT manager_id FROM employee WHERE employee.id = ?";
  const args = [id];
  const rows = await db.query(query, args);
  return rows[0].manager_id;
}

/**
 * Inquirer prompt functions:
 * menu()
 * main()
 * getNewDepartmentName()
 * getNewRoleName()
 * getNewEmployee()
 * getEmployeeToUpdate()
 * changeManager()
 * */

async function menu() {
  return inquirer.prompt([
    {
      type: "list",
      message: "What would you like to do?",
      name: "menu",
      choices: [
        "View All Employees",
        "Add Employee",
        "Update Employee Role",
        "View All Roles",
        "Add Role",
        "View All Departments",
        "Add Department",
        "Exit",
      ],
    },
  ]);
}

async function main() {
  while (!exit) {
    console.log(`
    ,---------------------------------,
    |                                 |
    |                                 |
    |     E  M  P  L  O  Y  E  E      |
    |                                 |
    |                                 |
    |     M   A   N   A   G   E   R   |
    |                                 |
    ,---------------------------------,
    `);
    const prompt = await menu();

    switch (prompt.menu) {
      case "View All Departments": {
        await showTableDepartments(true);
        break;
      }
      case "View All Roles": {
        await showTableRoles(true);
        break;
      }
      case "View All Employees": {
        await showTableEmployee(true);
        break;
      }
      case "Add Department": {
        await addDepartment();
        break;
      }
      case "Add Role": {
        await addRole();
        break;
      }
      case "Add Employee": {
        await addEmployee();
        break;
      }
      case "Update Employee Role": {
        await updateEmployee();
        break;
      }
      case "Exit": {
        exit = true;
        await db.close();
        break;
      }
    }
  }
}

async function getNewDepartmentName() {
  return inquirer.prompt([
    {
      message: "Department name: ",
      name: "name",
    },
  ]);
}

async function getNewRoleName() {
  const departmentInfo = await showTableDepartments();
  return inquirer.prompt([
    {
      type: "input",
      message: "Title: ",
      name: "title",
    },

    {
      type: "input",
      name: "salary",
      message: "Salary: ",
      validate(answer) {
        salaryRegex = /^[$]?\d[\d,]*$/;
        if (!salaryRegex.test(answer)) {
          return "Not a valid salary!";
        }
        return true;
      },
    },
    {
      type: "list",
      message: "Department: ",
      name: "name",
      choices: departmentInfo,
    },
  ]);
}

async function getNewEmployee() {
  const managerNames = await showAllManagers();
  const roleTitles = await showTableRoles();
  return inquirer.prompt([
    {
      message: "First Name: ",
      name: "first_name",
    },

    {
      message: "Last Name: ",
      name: "last_name",
    },

    {
      type: "list",
      message: "Role: ",
      name: "role",
      choices: roleTitles,
    },
    {
      type: "list",
      message: "Manager: ",
      name: "manager",
      choices: managerNames,
    },
  ]);
}

async function getEmployeeToUpdate() {
  const employeeNames = await showTableEmployee();
  const roleTitles = await showTableRoles();

  return inquirer.prompt([
    {
      type: "list",
      message: "Employee: ",
      name: "fullname",
      choices: employeeNames,
    },
    {
      type: "list",
      message: "New Role: ",
      name: "role",
      choices: roleTitles,
    },
    {
      type: "list",
      message: "Also need to assing a new Manager?",
      name: "action",
      choices: ["Yes", "No"],
    },
  ]);
}

async function changeManager() {
  const managerNames = await showAllManagers();
  return inquirer.prompt([
    {
      type: "list",
      message: "Manager: ",
      name: "manager",
      choices: managerNames,
    },
  ]);
}

main();
