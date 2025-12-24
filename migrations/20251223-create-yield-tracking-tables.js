"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create yield_reason_master table
    await queryInterface.createTable("yield_reason_master", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      reason_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      reason_description: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      category: {
        type: Sequelize.ENUM(
          "PROCESSING_LOSS",
          "HANDLING_DAMAGE",
          "QUALITY_ISSUE",
          "OVER_PROCESSING",
          "MIXED_BATCH"
        ),
        allowNull: false,
      },
      requires_supervisor_approval: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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

    // Create yield_standard_master table
    await queryInterface.createTable("yield_standard_master", {
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
        onDelete: "RESTRICT",
      },
      product_form: {
        type: Sequelize.ENUM("FROZEN", "COOKED", "RTE", "FRESH"),
        allowNull: false,
      },
      processing_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: "HOSO, HLSO, PUD, Cleaned, Cooked, etc.",
      },
      expected_yield_pct: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        comment: "Expected yield percentage (0-100)",
      },
      allowed_variance_pct: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 2.0,
        comment: "Allowed variance percentage",
      },
      min_yield_threshold: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment:
          "Minimum acceptable yield % (calculated as expected - allowed)",
      },
      max_yield_threshold: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment:
          "Maximum acceptable yield % (calculated as expected + allowed)",
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

    // Create yield_actual table
    await queryInterface.createTable("yield_actual", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      batch_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: "References procurement lot or packing list batch",
      },
      packing_list_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "packing_list",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
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
      processing_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      raw_input_kg: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false,
        comment: "Raw input weight in kg",
      },
      raw_cost_per_kg: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: "Raw material cost per kg",
      },
      saleable_output_kg: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false,
        comment: "Saleable output weight in kg",
      },
      actual_yield_pct: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        comment: "Actual yield percentage",
      },
      expected_yield_pct: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        comment: "Expected yield percentage from standards",
      },
      variance_pct: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        comment: "Variance from expected yield",
      },
      loss_kg: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false,
        comment: "Weight loss in kg",
      },
      loss_value: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        comment: "Value of weight loss",
      },
      status: {
        type: Sequelize.ENUM("OK", "WARNING", "BREACH"),
        allowNull: false,
        defaultValue: "OK",
      },
      reason_codes: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: "Array of reason codes for variance",
      },
      supervisor_approved: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      notes: {
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

    // Create margin_variance table
    await queryInterface.createTable("margin_variance", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      invoice_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "invoice",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      yield_actual_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "yield_actual",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      sale_quantity_kg: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false,
      },
      standard_cost_per_kg: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: "Raw cost / expected yield",
      },
      actual_cost_per_kg: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: "Raw cost / actual yield",
      },
      margin_variance_value: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        comment: "Margin variance amount",
      },
      reason_codes: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: "Array of reason codes",
      },
      accounting_treatment: {
        type: Sequelize.ENUM(
          "NORMAL_LOSS",
          "EXCESS_LOSS_EXPENSE",
          "MARGIN_OFFSET"
        ),
        allowNull: false,
        defaultValue: "NORMAL_LOSS",
      },
      gl_posted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      gl_entry_id: {
        type: Sequelize.UUID,
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

    // Create indexes
    await queryInterface.addIndex("yield_reason_master", ["reason_code"]);
    await queryInterface.addIndex("yield_reason_master", ["category"]);
    await queryInterface.addIndex("yield_reason_master", ["is_active"]);

    await queryInterface.addIndex("yield_standard_master", ["species_id"]);
    await queryInterface.addIndex("yield_standard_master", ["product_form"]);
    await queryInterface.addIndex("yield_standard_master", ["processing_type"]);
    await queryInterface.addIndex("yield_standard_master", ["is_active"]);

    await queryInterface.addIndex("yield_actual", ["batch_id"]);
    await queryInterface.addIndex("yield_actual", ["packing_list_id"]);
    await queryInterface.addIndex("yield_actual", ["species_id"]);
    await queryInterface.addIndex("yield_actual", ["status"]);
    await queryInterface.addIndex("yield_actual", ["created_at"]);

    await queryInterface.addIndex("margin_variance", ["invoice_id"]);
    await queryInterface.addIndex("margin_variance", ["yield_actual_id"]);
    await queryInterface.addIndex("margin_variance", ["accounting_treatment"]);
    await queryInterface.addIndex("margin_variance", ["gl_posted"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("margin_variance");
    await queryInterface.dropTable("yield_actual");
    await queryInterface.dropTable("yield_standard_master");
    await queryInterface.dropTable("yield_reason_master");
  },
};
