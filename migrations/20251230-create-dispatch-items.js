"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create dispatch_items table
    // Line items within dispatches - tracks individual cartons being shipped
    await queryInterface.createTable("dispatch_items", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      dispatch_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "dispatches",
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
      carton_mapping_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "carton_mapping",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
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
      item_status: {
        type: Sequelize.ENUM(
          "READY",
          "LOADED",
          "IN_TRANSIT",
          "DELIVERED",
          "DAMAGED"
        ),
        defaultValue: "READY",
      },
      load_date: {
        type: Sequelize.DATE,
        allowNull: true,
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
    await queryInterface.addIndex("dispatch_items", ["dispatch_id"]);
    await queryInterface.addIndex("dispatch_items", ["carton_id"]);
    await queryInterface.addIndex("dispatch_items", ["batch_id"]);
    await queryInterface.addIndex("dispatch_items", ["item_status"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("dispatch_items");
  },
};
