"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create batch_master table
    // Core batch tracking - links production runs to species/products
    await queryInterface.createTable("batch_master", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      batch_no: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      species_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "species_master",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      product_form: {
        type: Sequelize.ENUM("FROZEN", "COOKED", "RTE", "FRESH"),
        allowNull: false,
      },
      grade_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "grade_master",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      size_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "size_master",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      input_quantity_kg: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      input_unit: {
        type: Sequelize.STRING(50),
        defaultValue: "kg",
      },
      expected_yield_qty: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      actual_yield_qty: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      yield_variance_pct: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },
      batch_status: {
        type: Sequelize.ENUM(
          "CREATED",
          "IN_PRODUCTION",
          "YIELD_RECORDED",
          "QA_PENDING",
          "QA_APPROVED",
          "QA_REJECTED",
          "PACKED",
          "COMPLETED"
        ),
        defaultValue: "CREATED",
      },
      created_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      production_start_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      production_end_date: {
        type: Sequelize.DATE,
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
    await queryInterface.addIndex("batch_master", ["batch_no"]);
    await queryInterface.addIndex("batch_master", ["species_id"]);
    await queryInterface.addIndex("batch_master", ["batch_status"]);
    await queryInterface.addIndex("batch_master", ["created_date"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("batch_master");
  },
};
