"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create production_schedule table
    // Track production runs linked to batches and allocations
    await queryInterface.createTable("production_schedule", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      production_order_no: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
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
      allocation_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "allocation_master",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      processing_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: "HOSO, HLSO, PUD, Cleaned, Cooked, etc.",
      },
      scheduled_start_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      scheduled_end_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      actual_start_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      actual_end_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      production_status: {
        type: Sequelize.ENUM(
          "SCHEDULED",
          "IN_PROGRESS",
          "ON_HOLD",
          "COMPLETED",
          "CANCELLED"
        ),
        defaultValue: "SCHEDULED",
      },
      unit_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "unit_master",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      assigned_to: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "user_profiles",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
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
    await queryInterface.addIndex("production_schedule", [
      "production_order_no",
    ]);
    await queryInterface.addIndex("production_schedule", ["batch_id"]);
    await queryInterface.addIndex("production_schedule", ["production_status"]);
    await queryInterface.addIndex("production_schedule", [
      "scheduled_start_date",
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("production_schedule");
  },
};
