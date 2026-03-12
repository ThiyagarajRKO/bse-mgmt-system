"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("production_costing", {
      id: {
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      procurement_lot_id: {
        type: Sequelize.UUID,
        allowNull: false,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
        references: {
          model: { tableName: "procurement_lots" },
          key: "id",
        },
      },
      input_quantity: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
      },
      input_cost: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
      },
      output_quantity: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
      },
      cost_per_kg: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
      },
      processing_labour_cost: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0,
      },
      packaging_cost: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0,
      },
      cold_storage_cost: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0,
      },
      freight_cost: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0,
      },
      total_production_cost: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
      },
      byproduct_value: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0,
      },
      costing_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("now"),
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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

    // Add indexes
    await queryInterface.addIndex("production_costing", ["procurement_lot_id"]);
    await queryInterface.addIndex("production_costing", ["costing_date"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("production_costing");
  },
};
