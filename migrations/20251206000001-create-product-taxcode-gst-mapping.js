"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("product_taxcode_gst_mapping", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        primaryKey: true,
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "product_master",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      tax_code_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "tax_code_master",
          key: "tax_code_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      gst_master_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "consolidated_gst_master",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      supply_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: "Domestic / Export",
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_by: Sequelize.UUID,
      updated_by: Sequelize.UUID,
      deleted_by: Sequelize.UUID,
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("now"),
      },
      updated_at: Sequelize.DATE,
      deleted_at: Sequelize.DATE,
    });

    // Add unique constraint to prevent duplicate mappings
    // Includes product_id, tax_code_id, gst_master_id, and supply_type for uniqueness
    await queryInterface.addConstraint("product_taxcode_gst_mapping", {
      fields: ["product_id", "tax_code_id", "gst_master_id", "supply_type"],
      type: "unique",
      name: "uq_product_taxcode_gst_mapping_full",
    });

    // Add partial unique index to exclude soft-deleted records
    // This ensures only non-deleted records are considered for uniqueness
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX uq_product_taxcode_gst_mapping_active
      ON product_taxcode_gst_mapping(product_id, tax_code_id, gst_master_id, supply_type)
      WHERE deleted_at IS NULL
    `);

    // Add indexes for performance
    await queryInterface.addIndex(
      "product_taxcode_gst_mapping",
      ["product_id"],
      {
        name: "idx_product_taxcode_gst_mapping_product_id",
      }
    );

    await queryInterface.addIndex(
      "product_taxcode_gst_mapping",
      ["tax_code_id"],
      {
        name: "idx_product_taxcode_gst_mapping_tax_code_id",
      }
    );

    await queryInterface.addIndex(
      "product_taxcode_gst_mapping",
      ["gst_master_id"],
      {
        name: "idx_product_taxcode_gst_mapping_gst_master_id",
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("product_taxcode_gst_mapping");
  },
};
