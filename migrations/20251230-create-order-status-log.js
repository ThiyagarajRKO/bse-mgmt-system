"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create order_status_log table
    // Track state transitions for orders: DRAFT → CONFIRMED → ALLOCATED → IN_PRODUCTION → READY_FOR_QA → QA_APPROVED → PACKED → READY_FOR_DISPATCH → DISPATCHED → INVOICED → CLOSED
    await queryInterface.createTable("order_status_log", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "orders",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      from_status: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      to_status: {
        type: Sequelize.ENUM(
          "DRAFT",
          "CONFIRMED",
          "ALLOCATED",
          "IN_PRODUCTION",
          "READY_FOR_QA",
          "QA_APPROVED",
          "PACKED",
          "READY_FOR_DISPATCH",
          "DISPATCHED",
          "INVOICED",
          "CLOSED",
          "CANCELLED"
        ),
        allowNull: false,
      },
      transition_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      transition_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment:
          "Additional context: batch_id, allocation_id, invoice_id, dispatch_id, qa_record_id, etc.",
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
    await queryInterface.addIndex("order_status_log", ["order_id"]);
    await queryInterface.addIndex("order_status_log", ["to_status"]);
    await queryInterface.addIndex("order_status_log", ["transition_date"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("order_status_log");
  },
};
