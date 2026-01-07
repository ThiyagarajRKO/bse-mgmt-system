"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create traceability_map table
    // Enable forward and backward traceability:
    // Fish batch -> Product batch -> Carton -> Customer
    // Customer <- Carton <- Batch <- Vessel/Supplier
    await queryInterface.createTable("traceability_map", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      trace_no: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      supplier_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "supplier_master",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      vessel_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      procurement_lot_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "procurement_lots",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      batch_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "batch_master",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      carton_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        references: {
          model: "carton_mapping",
          key: "carton_id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "customer_master",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "orders",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      invoice_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "invoice",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      delivery_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      quality_status: {
        type: Sequelize.ENUM(
          "DELIVERED",
          "ACCEPTED",
          "REJECTED",
          "DAMAGED",
          "RETURNED"
        ),
        defaultValue: "DELIVERED",
      },
      trace_direction: {
        type: Sequelize.ENUM("FORWARD", "BACKWARD", "BIDIRECTIONAL"),
        defaultValue: "BIDIRECTIONAL",
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });

    // Add indexes for efficient traceability queries
    await queryInterface.addIndex("traceability_map", ["trace_no"]);
    await queryInterface.addIndex("traceability_map", ["batch_id"]);
    await queryInterface.addIndex("traceability_map", ["carton_id"]);
    await queryInterface.addIndex("traceability_map", ["customer_id"]);
    await queryInterface.addIndex("traceability_map", ["order_id"]);
    await queryInterface.addIndex("traceability_map", ["supplier_id"]);
    await queryInterface.addIndex("traceability_map", ["procurement_lot_id"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("traceability_map");
  },
};
