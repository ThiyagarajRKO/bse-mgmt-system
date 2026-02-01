"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("production_execution", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      species_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "species_master",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      derivative_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "derivative_master",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      raw_input_weight_kg: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false,
      },
      finished_output_weight_kg: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false,
      },
      finished_output_count: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      expected_yield_pct: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },
      actual_yield_pct: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },
      yield_variance_pct: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("PASS", "HOLD", "FAIL"),
        allowNull: false,
        defaultValue: "PASS",
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
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
    await queryInterface.addIndex("production_execution", [
      "species_id",
      "derivative_id",
    ]);
    await queryInterface.addIndex("production_execution", ["status"]);
    await queryInterface.addIndex("production_execution", ["created_at"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("production_execution");
  },
};
