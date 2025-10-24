"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("sales_payments", {
      id: {
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      payment_date: {
        type: Sequelize.DATE,
      },
      transaction_id: {
        type: Sequelize.STRING,
      },
      customer_master_id: {
        type: Sequelize.UUID,
        allowNull: false,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
        references: {
          model: { tableName: "customer_master" },
          key: "id",
        },
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
      payment_method: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      discount: {
        type: Sequelize.FLOAT,
      },
      total_paid: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      net_amount: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      penalty: {
        type: Sequelize.FLOAT,
      },
      tax_percentage: {
        type: Sequelize.FLOAT,
      },
      tax_amount: {
        type: Sequelize.FLOAT,
      },
      due_amount: {
        type: Sequelize.FLOAT,
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
    await queryInterface.dropTable("sales_payments");
  },
};
