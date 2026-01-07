"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create carton_mapping table
    // Map physical cartons to batches for traceability
    await queryInterface.createTable("carton_mapping", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      carton_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: "Physical carton ID/barcode",
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
      packing_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "packing",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "product_master",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      net_weight_kg: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      gross_weight_kg: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      units_per_carton: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      production_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      packing_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      best_before_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      carton_status: {
        type: Sequelize.ENUM(
          "CREATED",
          "PACKED",
          "READY_FOR_DISPATCH",
          "DISPATCHED",
          "DELIVERED",
          "RETURNED"
        ),
        defaultValue: "CREATED",
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "customer_master",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      delivery_date: {
        type: Sequelize.DATE,
        allowNull: true,
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

    // Add indexes
    await queryInterface.addIndex("carton_mapping", ["carton_id"]);
    await queryInterface.addIndex("carton_mapping", ["batch_id"]);
    await queryInterface.addIndex("carton_mapping", ["customer_id"]);
    await queryInterface.addIndex("carton_mapping", ["carton_status"]);
    await queryInterface.addIndex("carton_mapping", ["production_date"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("carton_mapping");
  },
};
