"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create material_reservation table
    // Track inventory reserved for orders to prevent overselling
    await queryInterface.createTable("material_reservation", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      reservation_no: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      allocation_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "allocation_master",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      inventory_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "sales_inventory",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      reserved_quantity: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      reserved_unit: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      reservation_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      reservation_status: {
        type: Sequelize.ENUM(
          "RESERVED",
          "PARTIAL_FULFILLED",
          "FULFILLED",
          "CANCELLED",
          "EXPIRED"
        ),
        defaultValue: "RESERVED",
      },
      fulfilled_quantity: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      expiry_date: {
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
    await queryInterface.addIndex("material_reservation", ["reservation_no"]);
    await queryInterface.addIndex("material_reservation", ["allocation_id"]);
    await queryInterface.addIndex("material_reservation", ["inventory_id"]);
    await queryInterface.addIndex("material_reservation", [
      "reservation_status",
    ]);
    await queryInterface.addIndex("material_reservation", ["reservation_date"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("material_reservation");
  },
};
