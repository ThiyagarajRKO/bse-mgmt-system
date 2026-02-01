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
    console.log("Connection has been established successfully!");
  } catch (err) {
    console.error("Unable to connect to the database:", err);
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
    console.log("Processing model file:", file);
    try {
      const modelModule = require(path.join(__dirname, file));
      console.log("Required module for", file, ":", typeof modelModule);
      const model = modelModule(sequelize, Sequelize.DataTypes);
      console.log(
        "Created model for",
        file,
        ":",
        typeof model,
        "name:",
        model?.name,
      );
      if (model && model.name) {
        db[model.name] = model;
        console.log("Added model to db:", model.name);
        if (file.includes("inventory_stock")) {
          console.log("Successfully loaded inventory_stock as:", model.name);
        }
      } else {
        console.log(
          "Model creation failed for:",
          file,
          "model:",
          typeof model,
          "name:",
          model?.name,
        );
      }
    } catch (e) {
      console.log("Error loading model", file, ":", e.message);
      console.log("Stack:", e.stack);
    }
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    try {
      db[modelName].associate(db);
    } catch (err) {
      // Skip associations for models with missing dependencies
      console.warn(
        `⚠️  Skipping associations for ${modelName}: ${err.message}`,
      );
    }
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
