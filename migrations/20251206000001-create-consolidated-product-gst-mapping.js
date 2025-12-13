"use strict";

/**
 * CONSOLIDATED MIGRATION: Product GST Mapping (Complete Schema)
 *
 * This comprehensive migration consolidates all product GST mapping functionality:
 *
 * 1. MAIN SCHEMA (create-product-gst-mapping.js):
 *    - Creates product_gst_mapping table with core columns
 *    - UUID primary key with proper foreign key relationships
 *    - Links to product_master, consolidated_gst_master, tax_code_master
 *
 * 2. TAX CODE ENHANCEMENT (alter-product-gst-mapping-add-tax-code.js):
 *    - Adds tax_code_id and supply_type columns
 *    - Updates constraints and indexes
 *    - Removes obsolete columns (company_id, override_gst_rate)
 *
 * 3. GST RATES (add-gst-rates-to-product-taxcode-gst-mapping.js):
 *    - Adds cgst_rate, sgst_rate, igst_rate columns
 *    - Stores individual GST components for detailed tracking
 *
 * 4. EFFECTIVE PERIODS & NOTES (add-missing-fields-to-product-taxcode-gst-mapping.js):
 *    - Adds effective_from, effective_to for rate change tracking
 *    - Adds note column for additional documentation
 *
 * SCHEMA DESIGN:
 * - Supports Domestic and Export supply types
 * - Stores both default GST rates and tax code references
 * - Tracks effective periods for tax rate changes across different dates
 * - Unique constraint: (product_id, tax_code_id, gst_master_id)
 * - Comprehensive indexing for performance
 * - Full audit trail (created_by, updated_by, deleted_by timestamps)
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table already exists
    const tableExists = await queryInterface.tableExists("product_gst_mapping");

    if (!tableExists) {
      // CREATE NEW TABLE: product_gst_mapping
      await queryInterface.createTable("product_gst_mapping", {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.literal("gen_random_uuid()"),
          primaryKey: true,
          comment: "Unique identifier for GST mapping",
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
          comment: "Reference to product",
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
          comment: "Reference to tax code (optional)",
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
          comment: "Reference to GST rate master",
        },
        supply_type: {
          type: Sequelize.STRING(50),
          allowNull: true,
          comment: "Supply type: Domestic / Export",
        },
        cgst_rate: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
          defaultValue: 0,
          comment: "Central GST rate percentage",
        },
        sgst_rate: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
          defaultValue: 0,
          comment: "State GST rate percentage",
        },
        igst_rate: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
          defaultValue: 0,
          comment: "Integrated GST rate percentage",
        },
        effective_from: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: "Date from which GST rate is effective",
        },
        effective_to: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: "Date until which GST rate is effective (null = ongoing)",
        },
        note: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: "Additional notes for GST mapping",
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          comment: "Active status of mapping",
        },
        created_by: {
          type: Sequelize.UUID,
          allowNull: true,
          comment: "User who created this record",
        },
        updated_by: {
          type: Sequelize.UUID,
          allowNull: true,
          comment: "User who last updated this record",
        },
        deleted_by: {
          type: Sequelize.UUID,
          allowNull: true,
          comment: "User who deleted this record",
        },
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.fn("now"),
          comment: "Record creation timestamp",
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: "Last update timestamp",
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: "Soft delete timestamp",
        },
      });

      // Add unique constraint: product + tax_code + gst_rate
      await queryInterface.addConstraint("product_gst_mapping", {
        fields: ["product_id", "tax_code_id", "gst_master_id"],
        type: "unique",
        name: "uq_product_gst_mapping_unique",
        comment:
          "Prevent duplicate GST mappings for same product/tax_code/rate",
      });

      // Add performance indexes
      await queryInterface.addIndex("product_gst_mapping", ["product_id"], {
        name: "idx_product_gst_mapping_product_id",
        comment: "Fast lookup by product",
      });

      await queryInterface.addIndex("product_gst_mapping", ["tax_code_id"], {
        name: "idx_product_gst_mapping_tax_code_id",
        comment: "Fast lookup by tax code",
      });

      await queryInterface.addIndex("product_gst_mapping", ["gst_master_id"], {
        name: "idx_product_gst_mapping_gst_master_id",
        comment: "Fast lookup by GST rate",
      });
    } else {
      // TABLE ALREADY EXISTS: Alter existing product_gst_mapping table

      // Check if columns already exist before adding
      const tableDescription = await queryInterface.describeTable(
        "product_gst_mapping"
      );

      // Add tax_code_id if not exists
      if (!tableDescription.tax_code_id) {
        await queryInterface.addColumn("product_gst_mapping", "tax_code_id", {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: "tax_code_master",
            key: "tax_code_id",
          },
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
          comment: "Reference to tax code (optional)",
        });
      }

      // Add supply_type if not exists
      if (!tableDescription.supply_type) {
        await queryInterface.addColumn("product_gst_mapping", "supply_type", {
          type: Sequelize.STRING(50),
          allowNull: true,
          comment: "Supply type: Domestic / Export",
        });
      }

      // Add GST rate columns if they don't exist
      if (!tableDescription.cgst_rate) {
        await queryInterface.addColumn("product_gst_mapping", "cgst_rate", {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
          defaultValue: 0,
          comment: "Central GST rate percentage",
        });
      }

      if (!tableDescription.sgst_rate) {
        await queryInterface.addColumn("product_gst_mapping", "sgst_rate", {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
          defaultValue: 0,
          comment: "State GST rate percentage",
        });
      }

      if (!tableDescription.igst_rate) {
        await queryInterface.addColumn("product_gst_mapping", "igst_rate", {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
          defaultValue: 0,
          comment: "Integrated GST rate percentage",
        });
      }

      // Add audit and tracking columns if they don't exist
      if (!tableDescription.effective_from) {
        await queryInterface.addColumn(
          "product_gst_mapping",
          "effective_from",
          {
            type: Sequelize.DATE,
            allowNull: true,
            comment: "Date from which GST rate is effective",
          }
        );
      }

      if (!tableDescription.effective_to) {
        await queryInterface.addColumn("product_gst_mapping", "effective_to", {
          type: Sequelize.DATE,
          allowNull: true,
          comment: "Date until which GST rate is effective (null = ongoing)",
        });
      }

      if (!tableDescription.note) {
        await queryInterface.addColumn("product_gst_mapping", "note", {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: "Additional notes for GST mapping",
        });
      }

      // Remove obsolete columns if they exist (that should not be in consolidated version)
      const columnsToRemove = ["company_id", "override_gst_rate"];

      for (const column of columnsToRemove) {
        if (tableDescription[column]) {
          try {
            await queryInterface.removeColumn("product_gst_mapping", column);
            console.log(`✓ Removed obsolete column: ${column}`);
          } catch (error) {
            console.log(
              `✗ Could not remove column ${column}: ${error.message}`
            );
          }
        }
      }

      // Remove old constraints
      const constraintsToRemove = [
        "uq_product_gst_company",
        "fk_pg_gst_master",
        "fk_pg_product",
      ];

      for (const constraint of constraintsToRemove) {
        try {
          await queryInterface.removeConstraint(
            "product_gst_mapping",
            constraint
          );
          console.log(`✓ Removed obsolete constraint: ${constraint}`);
        } catch (error) {
          console.log(
            `✗ Could not remove constraint ${constraint}: ${error.message}`
          );
        }
      }

      // Add new foreign key constraints if not exist
      try {
        await queryInterface.addConstraint("product_gst_mapping", {
          fields: ["product_id"],
          type: "foreign key",
          name: "fk_product_gst_mapping_product",
          references: {
            table: "product_master",
            field: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        });
        console.log("✓ Added FK constraint: product_id");
      } catch (error) {
        console.log(`✗ Could not add product FK: ${error.message}`);
      }

      try {
        await queryInterface.addConstraint("product_gst_mapping", {
          fields: ["gst_master_id"],
          type: "foreign key",
          name: "fk_product_gst_mapping_gst_master",
          references: {
            table: "consolidated_gst_master",
            field: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        });
        console.log("✓ Added FK constraint: gst_master_id");
      } catch (error) {
        console.log(`✗ Could not add GST master FK: ${error.message}`);
      }

      try {
        await queryInterface.addConstraint("product_gst_mapping", {
          fields: ["tax_code_id"],
          type: "foreign key",
          name: "fk_product_gst_mapping_tax_code",
          references: {
            table: "tax_code_master",
            field: "tax_code_id",
          },
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        });
        console.log("✓ Added FK constraint: tax_code_id");
      } catch (error) {
        console.log(`✗ Could not add tax code FK: ${error.message}`);
      }

      // Add unique constraint if not exists
      try {
        await queryInterface.addConstraint("product_gst_mapping", {
          fields: ["product_id", "tax_code_id", "gst_master_id"],
          type: "unique",
          name: "uq_product_gst_mapping_unique",
        });
        console.log("✓ Added unique constraint");
      } catch (error) {
        console.log(`✗ Could not add unique constraint: ${error.message}`);
      }

      // Add or update indexes
      try {
        await queryInterface.addIndex("product_gst_mapping", ["product_id"], {
          name: "idx_product_gst_mapping_product_id",
        });
        console.log("✓ Added index on product_id");
      } catch (error) {
        console.log(`✗ Could not add product index: ${error.message}`);
      }

      try {
        await queryInterface.addIndex("product_gst_mapping", ["tax_code_id"], {
          name: "idx_product_gst_mapping_tax_code_id",
        });
        console.log("✓ Added index on tax_code_id");
      } catch (error) {
        console.log(`✗ Could not add tax code index: ${error.message}`);
      }

      try {
        await queryInterface.addIndex(
          "product_gst_mapping",
          ["gst_master_id"],
          {
            name: "idx_product_gst_mapping_gst_master_id",
          }
        );
        console.log("✓ Added index on gst_master_id");
      } catch (error) {
        console.log(`✗ Could not add GST master index: ${error.message}`);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Drop the entire table on rollback
    const tableExists = await queryInterface.tableExists("product_gst_mapping");
    if (tableExists) {
      await queryInterface.dropTable("product_gst_mapping");
      console.log("✓ Dropped product_gst_mapping table");
    }
  },
};
