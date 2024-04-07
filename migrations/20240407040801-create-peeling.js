"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("peeling", {
      id: {
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      dispatch_id: {
        type: Sequelize.UUID,
        allowNull: false,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
        references: {
          model: { tableName: "dispatches" },
          key: "id",
        },
      },
      product_master_id: {
        type: Sequelize.UUID,
        allowNull: false,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
        references: {
          model: { tableName: "product_master" },
          key: "id",
        },
      },
      unit_master_id: {
        type: Sequelize.UUID,
        allowNull: false,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
        references: {
          model: { tableName: "unit_master" },
          key: "id",
        },
      },
      peeling_quantity: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      yield_quantity: {
        type: Sequelize.FLOAT,
      },
      peeling_method: {
        type: Sequelize.ENUM("Manual", "Chemical"),
        allowNull: false,
      },
      peeling_status: {
        type: Sequelize.ENUM("In Progress", "Completed"),
        defaultValue: "In Progress",
      },
      peeling_notes: {
        type: Sequelize.TEXT,
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
          model: { tableName: "user_profiles" },
          key: "id",
        },
      },
      updated_by: {
        type: Sequelize.UUID,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
        references: {
          model: { tableName: "user_profiles" },
          key: "id",
        },
      },
      deleted_by: {
        type: Sequelize.UUID,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
        references: {
          model: { tableName: "user_profiles" },
          key: "id",
        },
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("peeling");
  },
};
