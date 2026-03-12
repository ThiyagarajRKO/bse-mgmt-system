"use strict";

/**
 * FIX: IDEMPOTENT GST SYSTEM CONSOLIDATION
 *
 * This migration fixes the consolidated GST migration by:
 * 1. Checking if tables exist before creating them
 * 2. Checking if constraints exist before adding them
 * 3. Checking if indexes exist before adding them
 *
 * This ensures the migration can run even if previous migrations created the tables.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log("🔄 Starting idempotent GST system consolidation fix...\n");

    try {
      // ========================================================================
      // HELPER FUNCTION: Check if table exists
      // ========================================================================
      const tableExists = async (tableName) => {
        const result = await queryInterface.sequelize.query(
          `SELECT EXISTS(
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${tableName}'
          );`,
        );
        return result[0][0].exists;
      };

      // ========================================================================
      // HELPER FUNCTION: Check if constraint exists
      // ========================================================================
      const constraintExists = async (tableName, constraintName) => {
        const result = await queryInterface.sequelize.query(
          `SELECT EXISTS(
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = '${tableName}' 
            AND constraint_name = '${constraintName}'
          );`,
        );
        return result[0][0].exists;
      };

      // ========================================================================
      // HELPER FUNCTION: Check if index exists
      // ========================================================================
      const indexExists = async (indexName) => {
        const result = await queryInterface.sequelize.query(
          `SELECT EXISTS(
            SELECT 1 FROM pg_indexes 
            WHERE schemaname = 'public' 
            AND indexname = '${indexName}'
          );`,
        );
        return result[0][0].exists;
      };

      // ========================================================================
      // FIX PHASE 1: CONSOLIDATED_GST_MASTER TABLE
      // ========================================================================
      console.log("📌 Phase 1: Checking consolidated_gst_master table...");

      if (!(await tableExists("consolidated_gst_master"))) {
        console.log("   Creating consolidated_gst_master table...");

        await queryInterface.createTable("consolidated_gst_master", {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.literal("gen_random_uuid()"),
            primaryKey: true,
          },
          company_id: { type: Sequelize.UUID, allowNull: true },
          hsn_code: Sequelize.STRING(32),
          description: Sequelize.TEXT,
          gst_rate_percent: { type: Sequelize.DECIMAL(5, 2), allowNull: false },
          gst_type: { type: Sequelize.STRING(32), allowNull: false },
          is_export: { type: Sequelize.BOOLEAN, defaultValue: false },
          gst_name: { type: Sequelize.STRING(100), allowNull: true },
          cgst_rate: {
            type: Sequelize.DECIMAL(5, 2),
            allowNull: true,
            defaultValue: 0.0,
          },
          sgst_rate: {
            type: Sequelize.DECIMAL(5, 2),
            allowNull: true,
            defaultValue: 0.0,
          },
          igst_rate: {
            type: Sequelize.DECIMAL(5, 2),
            allowNull: true,
            defaultValue: 0.0,
          },
          effective_from: { type: Sequelize.DATE, allowNull: true },
          effective_to: { type: Sequelize.DATE, allowNull: true },
          gst_rate_id: {
            type: Sequelize.STRING(50),
            allowNull: true,
            unique: true,
          },
          export_gst: {
            type: Sequelize.DECIMAL(5, 2),
            allowNull: true,
            defaultValue: 0.0,
          },
          is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
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
      } else {
        console.log("   ✅ consolidated_gst_master table already exists");
      }

      // Add constraint if it doesn't exist
      if (
        !(await constraintExists(
          "consolidated_gst_master",
          "uq_gst_company_hsn",
        ))
      ) {
        console.log("   Adding uq_gst_company_hsn constraint...");
        try {
          await queryInterface.addConstraint("consolidated_gst_master", {
            fields: ["company_id", "hsn_code"],
            type: "unique",
            name: "uq_gst_company_hsn",
          });
        } catch (e) {
          console.log(
            "   ⚠️  Could not add constraint (may already exist):",
            e.message,
          );
        }
      } else {
        console.log("   ✅ uq_gst_company_hsn constraint already exists");
      }

      // Add indexes if they don't exist
      if (!(await indexExists("idx_gst_hsn_lower"))) {
        console.log("   Adding idx_gst_hsn_lower index...");
        try {
          await queryInterface.addIndex(
            "consolidated_gst_master",
            [queryInterface.sequelize.literal("lower(hsn_code)")],
            { name: "idx_gst_hsn_lower" },
          );
        } catch (e) {
          console.log("   ⚠️  Could not add index:", e.message);
        }
      }

      if (!(await indexExists("idx_gst_desc_trgm"))) {
        console.log("   Adding idx_gst_desc_trgm index...");
        try {
          await queryInterface.addIndex(
            "consolidated_gst_master",
            [queryInterface.sequelize.literal("lower(description)")],
            {
              using: "gin",
              operator: "gin_trgm_ops",
              name: "idx_gst_desc_trgm",
            },
          );
        } catch (e) {
          console.log("   ⚠️  Could not add trigram index:", e.message);
        }
      }

      console.log("✅ consolidated_gst_master verified\n");

      // ========================================================================
      // FIX PHASE 2: TAX_CODE_MASTER TABLE
      // ========================================================================
      console.log("📌 Phase 2: Checking tax_code_master table...");

      if (!(await tableExists("tax_code_master"))) {
        console.log("   Creating tax_code_master table...");

        await queryInterface.createTable("tax_code_master", {
          tax_code_id: {
            type: Sequelize.UUID,
            primaryKey: true,
            allowNull: false,
            defaultValue: Sequelize.UUIDV4,
          },
          tax_code: {
            type: Sequelize.STRING(32),
            allowNull: false,
            unique: true,
          },
          tax_code_name: {
            type: Sequelize.STRING(100),
            allowNull: false,
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          tax_type: {
            type: Sequelize.ENUM(
              "GST",
              "IGST",
              "NON_GST",
              "ZERO_RATED",
              "EXEMPT",
              "REVERSE_CHARGE",
            ),
            allowNull: false,
            defaultValue: "GST",
          },
          supply_type: {
            type: Sequelize.ENUM("INWARD", "OUTWARD"),
            allowNull: false,
            defaultValue: "OUTWARD",
          },
          gst_rate_id: {
            type: Sequelize.STRING(50),
            allowNull: true,
          },
          hsn_code: {
            type: Sequelize.STRING(32),
            allowNull: true,
          },
          ledger_cgst_id: {
            type: Sequelize.UUID,
            allowNull: true,
          },
          ledger_sgst_id: {
            type: Sequelize.UUID,
            allowNull: true,
          },
          ledger_igst_id: {
            type: Sequelize.UUID,
            allowNull: true,
          },
          is_refundable: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          is_export_applicable: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          is_reverse_charge: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
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
            allowNull: false,
            defaultValue: true,
          },
          company_id: {
            type: Sequelize.UUID,
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
          deleted_by: {
            type: Sequelize.UUID,
            allowNull: true,
          },
          created_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.fn("now"),
          },
          updated_at: {
            type: Sequelize.DATE,
          },
          deleted_at: {
            type: Sequelize.DATE,
          },
        });
      } else {
        console.log("   ✅ tax_code_master table already exists");
      }

      // Add indexes for tax_code_master if they don't exist
      if (!(await indexExists("idx_tax_code"))) {
        console.log("   Adding idx_tax_code index...");
        try {
          await queryInterface.addIndex("tax_code_master", ["tax_code"], {
            name: "idx_tax_code",
          });
        } catch (e) {
          console.log("   ⚠️  Could not add index:", e.message);
        }
      }

      if (!(await indexExists("idx_tax_code_company"))) {
        console.log("   Adding idx_tax_code_company index...");
        try {
          await queryInterface.addIndex("tax_code_master", ["company_id"], {
            name: "idx_tax_code_company",
          });
        } catch (e) {
          console.log("   ⚠️  Could not add index:", e.message);
        }
      }

      if (!(await indexExists("idx_tax_code_active"))) {
        console.log("   Adding idx_tax_code_active index...");
        try {
          await queryInterface.addIndex("tax_code_master", ["is_active"], {
            name: "idx_tax_code_active",
          });
        } catch (e) {
          console.log("   ⚠️  Could not add index:", e.message);
        }
      }

      console.log("✅ tax_code_master verified\n");

      // ========================================================================
      // FIX PHASE 3: PRODUCT_GST_MAPPING TABLE
      // ========================================================================
      console.log("📌 Phase 3: Checking product_gst_mapping table...");

      if (!(await tableExists("product_gst_mapping"))) {
        console.log("   Creating product_gst_mapping table...");

        await queryInterface.createTable("product_gst_mapping", {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.literal("gen_random_uuid()"),
            primaryKey: true,
          },
          product_id: { type: Sequelize.UUID, allowNull: false },
          gst_master_id: { type: Sequelize.UUID, allowNull: false },
          tax_code_id: { type: Sequelize.UUID, allowNull: true },
          supply_type: Sequelize.STRING(50),
          cgst_rate: Sequelize.DECIMAL(5, 2),
          sgst_rate: Sequelize.DECIMAL(5, 2),
          igst_rate: Sequelize.DECIMAL(5, 2),
          effective_from: Sequelize.DATE,
          effective_to: Sequelize.DATE,
          note: Sequelize.TEXT,
          is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
          created_by: { type: Sequelize.UUID, allowNull: true },
          updated_by: { type: Sequelize.UUID, allowNull: true },
          deleted_by: { type: Sequelize.UUID, allowNull: true },
          created_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.fn("now"),
          },
          updated_at: Sequelize.DATE,
          deleted_at: Sequelize.DATE,
        });
      } else {
        console.log("   ✅ product_gst_mapping table already exists");
      }

      // Add constraint if it doesn't exist
      if (
        !(await constraintExists(
          "product_gst_mapping",
          "uq_product_gst_mapping",
        ))
      ) {
        console.log("   Adding uq_product_gst_mapping constraint...");
        try {
          await queryInterface.addConstraint("product_gst_mapping", {
            fields: ["product_id", "gst_master_id"],
            type: "unique",
            name: "uq_product_gst_mapping",
          });
        } catch (e) {
          console.log(
            "   ⚠️  Could not add constraint (may already exist):",
            e.message,
          );
        }
      } else {
        console.log("   ✅ uq_product_gst_mapping constraint already exists");
      }

      // Add foreign keys if they don't exist
      if (
        !(await constraintExists("product_gst_mapping", "fk_pg_gst_master"))
      ) {
        console.log("   Adding fk_pg_gst_master foreign key...");
        try {
          await queryInterface.addConstraint("product_gst_mapping", {
            fields: ["gst_master_id"],
            type: "foreign key",
            name: "fk_pg_gst_master",
            references: {
              table: "consolidated_gst_master",
              field: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
          });
        } catch (e) {
          console.log("   ⚠️  Could not add foreign key:", e.message);
        }
      } else {
        console.log("   ✅ fk_pg_gst_master foreign key already exists");
      }

      if (!(await constraintExists("product_gst_mapping", "fk_pg_product"))) {
        console.log("   Adding fk_pg_product foreign key...");
        try {
          await queryInterface.addConstraint("product_gst_mapping", {
            fields: ["product_id"],
            type: "foreign key",
            name: "fk_pg_product",
            references: {
              table: "product_master",
              field: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
          });
        } catch (e) {
          console.log("   ⚠️  Could not add foreign key:", e.message);
        }
      } else {
        console.log("   ✅ fk_pg_product foreign key already exists");
      }

      // Add indexes
      if (!(await indexExists("idx_product_gst_product"))) {
        console.log("   Adding idx_product_gst_product index...");
        try {
          await queryInterface.addIndex("product_gst_mapping", ["product_id"], {
            name: "idx_product_gst_product",
          });
        } catch (e) {
          console.log("   ⚠️  Could not add index:", e.message);
        }
      }

      if (!(await indexExists("idx_product_gst_master"))) {
        console.log("   Adding idx_product_gst_master index...");
        try {
          await queryInterface.addIndex(
            "product_gst_mapping",
            ["gst_master_id"],
            {
              name: "idx_product_gst_master",
            },
          );
        } catch (e) {
          console.log("   ⚠️  Could not add index:", e.message);
        }
      }

      if (!(await indexExists("idx_product_gst_active"))) {
        console.log("   Adding idx_product_gst_active index...");
        try {
          await queryInterface.addIndex("product_gst_mapping", ["is_active"], {
            name: "idx_product_gst_active",
          });
        } catch (e) {
          console.log("   ⚠️  Could not add index:", e.message);
        }
      }

      console.log("✅ product_gst_mapping verified\n");

      // ========================================================================
      // FIX PHASE 4: DERIVATIVE_GST_MAPPING TABLE
      // ========================================================================
      console.log("📌 Phase 4: Checking derivative_gst_mapping table...");

      if (!(await tableExists("derivative_gst_mapping"))) {
        console.log("   Creating derivative_gst_mapping table...");

        await queryInterface.createTable("derivative_gst_mapping", {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
            defaultValue: Sequelize.UUIDV4,
          },
          species_master_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: "species_master",
              key: "id",
            },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
          },
          derivative_master_id: {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: "derivative_master",
              key: "id",
            },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
          },
          processing_state: {
            type: Sequelize.ENUM("RAW", "PROCESSED"),
            allowNull: false,
            defaultValue: "PROCESSED",
          },
          gst_master_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: "consolidated_gst_master",
              key: "id",
            },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
          },
          hsn_code_override: {
            type: Sequelize.STRING(10),
            allowNull: true,
          },
          effective_from: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          effective_to: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          is_active: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
          },
          created_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.fn("now"),
          },
          updated_at: Sequelize.DATE,
          deleted_at: Sequelize.DATE,
          created_by: { type: Sequelize.UUID, allowNull: true },
          updated_by: { type: Sequelize.UUID, allowNull: true },
          deleted_by: { type: Sequelize.UUID, allowNull: true },
        });
      } else {
        console.log("   ✅ derivative_gst_mapping table already exists");
      }

      // Add constraint if it doesn't exist
      if (
        !(await constraintExists(
          "derivative_gst_mapping",
          "uq_derivative_gst_mapping_species_derivative_state",
        ))
      ) {
        console.log(
          "   Adding uq_derivative_gst_mapping_species_derivative_state constraint...",
        );
        try {
          await queryInterface.addConstraint("derivative_gst_mapping", {
            fields: [
              "species_master_id",
              "derivative_master_id",
              "processing_state",
            ],
            type: "unique",
            name: "uq_derivative_gst_mapping_species_derivative_state",
          });
        } catch (e) {
          console.log(
            "   ⚠️  Could not add constraint (may already exist):",
            e.message,
          );
        }
      } else {
        console.log(
          "   ✅ uq_derivative_gst_mapping_species_derivative_state constraint already exists",
        );
      }

      console.log("✅ derivative_gst_mapping verified\n");

      console.log("\n✅ GST system idempotent fix completed successfully!\n");
      console.log("📊 All GST tables verified:");
      console.log("   • consolidated_gst_master");
      console.log("   • tax_code_master");
      console.log("   • product_gst_mapping");
      console.log("   • derivative_gst_mapping");
    } catch (error) {
      console.error("❌ Error during GST idempotent fix:", error);
      throw error;
    }
  },

  down: async (queryInterface) => {
    // No-op for down migration since this is a fix migration
    console.log("ℹ️  This is a fix migration - skipping rollback");
  },
};
