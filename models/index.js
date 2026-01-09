"use strict";

const dotenv = require("dotenv");
dotenv.config();

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const basename = path.basename(__filename);

const config = require(process.cwd() + "/config/config.js");
const db = {};

let sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

// Do not automatically authenticate when this module is required.
// Some environments import models without needing an immediate DB connection
// (tests, quick controller imports, scripts). Expose an authenticate helper
// that the application can call at startup when it wants to verify the DB.
db.authenticate = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully!");
  } catch (err) {
    console.error("Unable to connect to the database:", err);
    throw err;
  }
};

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
    );
  })
  .forEach((file) => {
    const modelModule = require(path.join(__dirname, file));
    const model = modelModule(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    try {
      db[modelName].associate(db);
    } catch (err) {
      // Skip associations for models with missing dependencies
      console.warn(
        `⚠️  Skipping associations for ${modelName}: ${err.message}`
      );
    }
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
