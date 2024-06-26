"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("order_products", {
      id: {
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
        references: {
          model: { tableName: "orders" },
          key: "id",
        },
      },
      packing_id: {
        type: Sequelize.UUID,
        allowNull: false,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
        references: {
          model: { tableName: "packing" },
          key: "id",
        },
      },
      unit: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      price: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      discount: {
        type: Sequelize.FLOAT,
      },
      total_price: {
        type: Sequelize.FLOAT,
      },
      description: {
        type: Sequelize.TEXT,
      },
      delivery_status: {
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
    await queryInterface.dropTable("order_products");
  },
};
