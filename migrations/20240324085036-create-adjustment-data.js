"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("adjustment", {
      id: {
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      adjustment_adjusted_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      adjustment_adjusted_price: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      adjustment_price_difference: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      adjustment_quantity_difference: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      adjustment_reason: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      adjustment_surveyor: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      procurement_id: {
        type: Sequelize.UUID,
        allowNull: false,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
        references: {
          model: { tableName: "procurement" },
          key: "id",
        },
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
    await queryInterface.dropTable("adjustment");
  },
};
