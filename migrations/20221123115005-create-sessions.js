"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      { tableName: "sessions" },
      {
        sid: {
          type: Sequelize.STRING,
          primaryKey: true,
        },
        expires: {
          type: Sequelize.DATE,
        },
        data: {
          type: Sequelize.TEXT,
        },
        createdAt: {
          defaultValue: Sequelize.fn("now"),
          type: Sequelize.DATE,
        },
        updatedAt: {
          defaultValue: Sequelize.fn("now"),
          type: Sequelize.DATE,
        },
      }
    );
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("sessions");
  },
};
