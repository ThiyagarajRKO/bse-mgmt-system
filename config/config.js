const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  username: process.env.DB_USERNAME,
  password: process.env.DB_SECRET,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  logging: false,
  dialect: "postgres",
};
