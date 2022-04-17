const mysql = require("mysql2");

class SqlDb {
  constructor(params) {
    this.connection = mysql.createConnection(params);
  }
  query(sql, args) {
    return new Promise((resolve, reject) => {
      this.connection.query(sql, args, (err, rows) => {
        if (err) {
          console.log("ERROR", err.sql);
          return reject(err);
        }
        resolve(rows);
      });
    });
  }
  close() {
    return new Promise((resolve, reject) => {
      this.connection.end((err) => {
        if (err) {
          console.log("ERROR", err);
          return reject(err);
        }
        resolve();
      });
    });
  }
}

module.exports = SqlDb;
