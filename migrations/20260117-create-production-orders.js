"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create production_orders table
    await queryInterface.createTable("production_orders", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      order_no: {
        type: Sequelize.STRING(50),
        unique: true,
        allowNull: false,
      },
      order_type: {
        type: Sequelize.ENUM("PRIMARY", "SECONDARY", "VALUE_ADDED", "REWORK"),
        defaultValue: "PRIMARY",
      },
      plant_id: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      input_species_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "species_master",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      planned_quantity_kg: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      planned_start_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM(
          "PLANNED",
          "RAW_ISSUED",
          "IN_PRODUCTION",
          "COMPLETED",
          "CLOSED",
          "CANCELLED",
        ),
        defaultValue: "PLANNED",
      },
      issued_quantity_kg: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      produced_quantity_kg: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      wastage_quantity_kg: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      yield_variance_percent: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0,
      },
      created_by: {
        type: Sequelize.UUID,
      },
      approved_by: {
        type: Sequelize.UUID,
      },
      closed_by: {
        type: Sequelize.UUID,
      },
      closed_at: {
        type: Sequelize.DATE,
      },
      remarks: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Add indexes
    await queryInterface.addIndex("production_orders", ["order_no"], {
      name: "idx_production_orders_order_no",
    });
    await queryInterface.addIndex("production_orders", ["status"], {
      name: "idx_production_orders_status",
    });
    await queryInterface.addIndex("production_orders", ["input_species_id"], {
      name: "idx_production_orders_species_id",
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop the table
    await queryInterface.dropTable("production_orders");
  },
};
