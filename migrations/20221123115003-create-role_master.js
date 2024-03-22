"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      { tableName: "role_master" },
      {
        id: {
          primaryKey: true,
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
        },
        role_name: {
          type: Sequelize.STRING,
          allowNull: false,
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
      }
    );
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("role_master");
  },
};
