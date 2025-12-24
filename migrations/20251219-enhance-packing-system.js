"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create product_packaging_mapping table
    await queryInterface.createTable("product_packaging_mapping", {
      id: {
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: { tableName: "product_master" },
          key: "id",
        },
      },
      packaging_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: { tableName: "packaging_master" },
          key: "id",
        },
      },
      market: {
        type: Sequelize.ENUM("RETAIL", "EXPORT"),
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        defaultValue: Sequelize.fn("now"),
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
      created_by: {
        type: Sequelize.UUID,
        references: {
          model: { tableName: "user_profiles" },
          key: "id",
        },
      },
      updated_by: {
        type: Sequelize.UUID,
        references: {
          model: { tableName: "user_profiles" },
          key: "id",
        },
      },
    });

    // Add unique constraint: no retail + export mix for same mapping
    await queryInterface.addConstraint("product_packaging_mapping", {
      fields: ["product_id", "packaging_id", "market"],
      type: "unique",
      name: "uq_product_market_pack",
    });

    // 2. Create packing_tax_snapshot table
    await queryInterface.createTable("packing_tax_snapshot", {
      id: {
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      packing_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: { tableName: "packing" },
          key: "id",
        },
      },
      gst_rate: {
        type: Sequelize.NUMERIC(5, 2),
        allowNull: false,
      },
      cgst: {
        type: Sequelize.NUMERIC(5, 2),
        allowNull: false,
      },
      sgst: {
        type: Sequelize.NUMERIC(5, 2),
        allowNull: false,
      },
      igst: {
        type: Sequelize.NUMERIC(5, 2),
        allowNull: false,
      },
      taxable_value: {
        type: Sequelize.NUMERIC(12, 2),
        allowNull: false,
      },
      tax_amount: {
        type: Sequelize.NUMERIC(12, 2),
        allowNull: false,
      },
      created_at: {
        defaultValue: Sequelize.fn("now"),
        type: Sequelize.DATE,
      },
    });

    // 3. Create packing_rule_config table (JSON rule engine)
    await queryInterface.createTable("packing_rule_config", {
      id: {
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      rule_name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      rule_config: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("now"),
      },
      updated_by: {
        type: Sequelize.UUID,
        references: {
          model: { tableName: "user_profiles" },
          key: "id",
        },
      },
    });

    // 4. Add columns to packing table for cost tracking
    await queryInterface.addColumn("packing", "total_cost", {
      type: Sequelize.NUMERIC(12, 2),
      allowNull: true,
    });

    await queryInterface.addColumn("packing", "raw_material_cost", {
      type: Sequelize.NUMERIC(12, 2),
      allowNull: true,
    });

    await queryInterface.addColumn("packing", "processing_cost", {
      type: Sequelize.NUMERIC(12, 2),
      allowNull: true,
    });

    await queryInterface.addColumn("packing", "packaging_material_cost", {
      type: Sequelize.NUMERIC(12, 2),
      allowNull: true,
    });

    await queryInterface.addColumn("packing", "overhead_cost", {
      type: Sequelize.NUMERIC(12, 2),
      allowNull: true,
    });

    await queryInterface.addColumn("packing", "market", {
      type: Sequelize.ENUM("RETAIL", "EXPORT"),
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("packing_rule_config");
    await queryInterface.dropTable("packing_tax_snapshot");
    await queryInterface.dropTable("product_packaging_mapping");

    await queryInterface.removeColumn("packing", "market");
    await queryInterface.removeColumn("packing", "overhead_cost");
    await queryInterface.removeColumn("packing", "packaging_material_cost");
    await queryInterface.removeColumn("packing", "processing_cost");
    await queryInterface.removeColumn("packing", "raw_material_cost");
    await queryInterface.removeColumn("packing", "total_cost");
  },
};
