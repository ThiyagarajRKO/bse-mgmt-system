"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create profitability_alerts table
    await queryInterface.createTable("profitability_alerts", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        allowNull: false,
      },
      profitability_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "profitability_fact",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      alert_type: {
        type: Sequelize.ENUM(
          "MARGIN_BELOW_MINIMUM",
          "MARGIN_DROP_WOW",
          "YIELD_LOSS_EXCESSIVE",
          "DISCOUNT_EXCEEDS_MARGIN",
          "NEGATIVE_MARGIN"
        ),
        allowNull: false,
      },
      severity: {
        type: Sequelize.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL"),
        allowNull: false,
        defaultValue: "MEDIUM",
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      threshold_value: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: true,
        comment: "The threshold that triggered the alert",
      },
      actual_value: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: true,
        comment: "The actual value that triggered the alert",
      },
      is_acknowledged: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      acknowledged_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "user_profiles",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      acknowledged_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Create indexes for alerts
    await queryInterface.addIndex("profitability_alerts", ["profitability_id"]);
    await queryInterface.addIndex("profitability_alerts", ["alert_type"]);
    await queryInterface.addIndex("profitability_alerts", ["severity"]);
    await queryInterface.addIndex("profitability_alerts", ["is_acknowledged"]);
    await queryInterface.addIndex("profitability_alerts", ["created_at"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("profitability_alerts");
  },
};
