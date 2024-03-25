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
          type: Sequelize.DATE,
        },
        deleted_at: {
          type: Sequelize.DATE,
        },
        created_by: {
          type: Sequelize.UUID,
          allowNull: false,
          onDelete: "RESTRICT",
          onUpdate: "CASCADE",
          references: {
            model: { schema: "auth", tableName: "users" },
            key: "id",
          },
        },
        updated_by: {
          type: Sequelize.UUID,
          onDelete: "RESTRICT",
          onUpdate: "CASCADE",
          references: {
            model: { schema: "auth", tableName: "users" },
            key: "id",
          },
        },
        deleted_by: {
          type: Sequelize.UUID,
          onDelete: "RESTRICT",
          onUpdate: "CASCADE",
          references: {
            model: { schema: "auth", tableName: "users" },
            key: "id",
          },
        },
      }
    );
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("role_master");
  },
};
