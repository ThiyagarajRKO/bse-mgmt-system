"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create tax_master table
    await queryInterface.createTable("tax_master", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        allowNull: false,
      },
      tax_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      tax_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      hsn_code: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      cgst_rate: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0,
      },
      sgst_rate: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0,
      },
      igst_rate: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0,
      },
      cess_rate: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0,
      },
      tax_type: {
        type: Sequelize.ENUM("GST", "ZERO_RATED", "EXEMPT", "NIL_RATED"),
        defaultValue: "GST",
      },
      is_reverse_charge: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      effective_from: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      effective_to: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
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

    // Create product_tax_mapping table
    await queryInterface.createTable("product_tax_mapping", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        allowNull: false,
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "species_master",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      tax_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: "tax_master",
          key: "tax_code",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      supply_type: {
        type: Sequelize.ENUM("DOMESTIC", "EXPORT"),
        allowNull: false,
      },
      effective_from: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      effective_to: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
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

    // Create packing_list table
    await queryInterface.createTable("packing_list", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        allowNull: false,
      },
      packing_list_no: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      sales_order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "orders",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      species: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      grade: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      size: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      primary_pack: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      units_per_carton: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      total_cartons: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      net_weight_kg: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      gross_weight_kg: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      cbm: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false,
      },
      pallets: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      market: {
        type: Sequelize.ENUM("DOMESTIC", "EXPORT"),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("DRAFT", "APPROVED", "LOCKED"),
        defaultValue: "DRAFT",
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      locked_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      locked_by: {
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
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
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

    // Create invoice table
    await queryInterface.createTable("invoice", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        allowNull: false,
      },
      invoice_no: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      invoice_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      packing_list_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "packing_list",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "customer_master",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      supply_type: {
        type: Sequelize.ENUM("DOMESTIC", "EXPORT"),
        allowNull: false,
      },
      place_of_supply: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      total_taxable_value: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      total_cgst: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      total_sgst: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      total_igst: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      total_cess: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      total_gst: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      invoice_value: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("DRAFT", "FINAL", "CANCELLED"),
        defaultValue: "DRAFT",
      },
      finalized_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      finalized_by: {
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
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
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

    // Create invoice_line_items table
    await queryInterface.createTable("invoice_line_items", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
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
        onDelete: "CASCADE",
      },
      product_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      hsn_code: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      qty_kg: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      rate_per_kg: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      taxable_value: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      cgst_rate: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0,
      },
      cgst_amount: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      sgst_rate: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0,
      },
      sgst_amount: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      igst_rate: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0,
      },
      igst_amount: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      cess_rate: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0,
      },
      cess_amount: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      total_gst: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      line_total: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      tax_code: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Create sales_register table
    await queryInterface.createTable("sales_register", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
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
      invoice_no: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      invoice_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      customer_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      hsn_code: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      taxable_value: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      cgst: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      sgst: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      igst: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      cess: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      total_gst: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      total_value: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      supply_type: {
        type: Sequelize.ENUM("DOMESTIC", "EXPORT"),
        allowNull: false,
      },
      place_of_supply: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Add indexes for performance
    await queryInterface.addIndex("tax_master", ["tax_code", "effective_from"]);
    await queryInterface.addIndex("product_tax_mapping", [
      "product_id",
      "supply_type",
      "effective_from",
    ]);
    await queryInterface.addIndex("packing_list", ["packing_list_no"]);
    await queryInterface.addIndex("packing_list", ["sales_order_id"]);
    await queryInterface.addIndex("packing_list", ["status"]);
    await queryInterface.addIndex("invoice", ["invoice_no"]);
    await queryInterface.addIndex("invoice", ["packing_list_id"]);
    await queryInterface.addIndex("invoice", ["customer_id"]);
    await queryInterface.addIndex("invoice", ["status"]);
    await queryInterface.addIndex("invoice_line_items", ["invoice_id"]);
    await queryInterface.addIndex("sales_register", ["invoice_id"]);
    await queryInterface.addIndex("sales_register", ["hsn_code"]);
    await queryInterface.addIndex("sales_register", ["invoice_date"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("sales_register");
    await queryInterface.dropTable("invoice_line_items");
    await queryInterface.dropTable("invoice");
    await queryInterface.dropTable("packing_list");
    await queryInterface.dropTable("product_tax_mapping");
    await queryInterface.dropTable("tax_master");
  },
};
