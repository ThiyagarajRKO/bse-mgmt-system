"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      { tableName: "users", schema: "auth" },
      {
        id: {
          primaryKey: true,
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
        },
        username: {
          type: Sequelize.STRING,
        },
        email: {
          type: Sequelize.STRING,
        },
        phone: {
          type: Sequelize.STRING,
        },
        country_code: {
          type: Sequelize.STRING,
        },
        password: {
          type: Sequelize.STRING,
        },
        is_email_verified: {
          defaultValue: false,
          type: Sequelize.BOOLEAN,
        },
        is_mobile_verified: {
          defaultValue: false,
          type: Sequelize.BOOLEAN,
        },
        is_password_forgot: {
          defaultValue: false,
          type: Sequelize.BOOLEAN,
        },
        user_status: {
          defaultValue: "0",
          type: Sequelize.ENUM("0", "1", "2", "3"),
        },
        is_active: {
          defaultValue: false,
          type: Sequelize.BOOLEAN,
        },
        created_at: {
          defaultValue: Sequelize.fn("now"),
          type: Sequelize.DATE,
        },
        updated_at: {
          defaultValue: Sequelize.fn("now"),
          type: Sequelize.DATE,
        },
        deactivated_at: {
          type: Sequelize.DATE,
        },
        deleted_at: {
          type: Sequelize.DATE,
        },
      }
    );
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("users");
  },
};
