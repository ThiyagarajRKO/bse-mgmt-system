"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add tax_code_id column with foreign key
    await queryInterface.addColumn(
      "product_taxcode_gst_mapping",
      "tax_code_id",
      {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "tax_code_master",
          key: "tax_code_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      }
    );

    // Add effective_from column
    await queryInterface.addColumn(
      "product_taxcode_gst_mapping",
      "effective_from",
      {
        type: Sequelize.DATEONLY,
        allowNull: true,
      }
    );

    // Add effective_to column
    await queryInterface.addColumn(
      "product_taxcode_gst_mapping",
      "effective_to",
      {
        type: Sequelize.DATEONLY,
        allowNull: true,
      }
    );

    // Add note column
    await queryInterface.addColumn("product_taxcode_gst_mapping", "note", {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // Add index on tax_code_id for performance
    await queryInterface.addIndex(
      "product_taxcode_gst_mapping",
      ["tax_code_id"],
      {
        name: "idx_product_taxcode_gst_mapping_tax_code_id",
      }
    );
  },

  async down(queryInterface, Sequelize) {
    // Remove the columns in reverse order
    await queryInterface.removeIndex(
      "product_taxcode_gst_mapping",
      "idx_product_taxcode_gst_mapping_tax_code_id"
    );

    await queryInterface.removeColumn("product_taxcode_gst_mapping", "note");
    await queryInterface.removeColumn(
      "product_taxcode_gst_mapping",
      "effective_to"
    );
    await queryInterface.removeColumn(
      "product_taxcode_gst_mapping",
      "effective_from"
    );
    await queryInterface.removeColumn(
      "product_taxcode_gst_mapping",
      "tax_code_id"
    );
  },
};
