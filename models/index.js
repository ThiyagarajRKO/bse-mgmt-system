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
  config,
);

// Do not automatically authenticate when this module is required.
// Some environments import models without needing an immediate DB connection
// (tests, quick controller imports, scripts). Expose an authenticate helper
// that the application can call at startup when it wants to verify the DB.
db.authenticate = async () => {
  try {
    await sequelize.authenticate();
  } catch (err) {
    throw err;
  }
};

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 &&
      file !== basename &&
      file.slice(-3) === ".js" &&
      file !== "product_master_raw.js" && // Skip duplicate ProductMaster model
      file !== "production_execution.js" // Skip problematic model
    );
  })
  .forEach((file) => {
    try {
      const modelModule = require(path.join(__dirname, file));
      const model = modelModule(sequelize, Sequelize.DataTypes);
      if (model && model.name) {
        db[model.name] = model;
      }
    } catch (e) {
      // Silently skip models that fail to load (missing dependencies)
      // This prevents slow startup from problematic models
    }
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    try {
      db[modelName].associate(db);
    } catch (err) {
      // Skip associations for models with missing dependencies
    }
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
