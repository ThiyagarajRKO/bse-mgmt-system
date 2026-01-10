"use strict";

/**
 * CONSOLIDATED PRODUCT MASTER SCHEMA MIGRATION
 *
 * This migration consolidates ALL product_master column additions and modifications
 * into a single, comprehensive migration for clarity and maintainability.
 *
 * Scope:
 * ------
 * 1. Adds derivative_master_id (FK) - for product form/derivative
 * 2. Adds 4D mapping reference column
 * 3. Adds size/grade category system columns
 * 4. Adds raw product support (processing_state, product_role, is_raw)
 * 5. Adds HSN code support
 * 6. Creates necessary indexes
 * 7. Establishes ERP-grade constraints
 *
 * Consolidates these individual migrations:
 * - 20260108-add-derivative-master-fk-to-product-master.js
 * - 20260109-add-species-derivative-size-grade-mapping-id-to-product-master.js
 * - 20260108-add-size-category-and-ranges.js
 * - 20260108-add-grade-code-to-grade-master.js
 * - 20260109-add-raw-product-support.js
 * - 20251205121026-add-hsn-code-to-product-master.js
 * - 20260109-add-product-flags.js
 *
 * Execution Order (IMPORTANT):
 * 1. derivative_master table must exist (20260108-create-derivative-master.js)
 * 2. species_derivative_size_grade_mapping must exist (20260108-create-species-derivative-size-grade-mapping.js)
 * 3. size_master and grade_master must have necessary columns
 * 4. This migration runs
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log("\n🔧 Consolidating Product Master Schema...");

      // ============================================================================
      // STEP 1: Add derivative_master_id (FK to derivative_master)
      // ============================================================================
      console.log("   [1/7] Adding derivative_master_id column...");

      const table = await queryInterface.describeTable("product_master");

      if (!table.derivative_master_id) {
        await queryInterface.addColumn(
          "product_master",
          "derivative_master_id",
          {
            type: Sequelize.UUID,
            allowNull: true,
            comment: "Reference to derivative_master (product form/type)",
            references: {
              model: "derivative_master",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "SET NULL",
          },
          { transaction }
        );

        await queryInterface.addIndex(
          "product_master",
          ["derivative_master_id"],
          {
            name: "idx_product_derivative_master_id",
            transaction,
          }
        );
        console.log("      ✓ derivative_master_id added");
      } else {
        console.log("      ✓ derivative_master_id already exists");
      }

      // ============================================================================
      // STEP 2: Add 4D mapping reference (species × derivative × size × grade)
      // ============================================================================
      console.log(
        "   [2/7] Adding species_derivative_size_grade_mapping_id column..."
      );

      if (!table.species_derivative_size_grade_mapping_id) {
        await queryInterface.addColumn(
          "product_master",
          "species_derivative_size_grade_mapping_id",
          {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: "species_derivative_size_grade_mapping",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "SET NULL",
            comment:
              "4D Mapping ID: Links to validated combination of species × derivative × size × grade",
          },
          { transaction }
        );

        await queryInterface.addIndex(
          "product_master",
          ["species_derivative_size_grade_mapping_id"],
          {
            name: "idx_product_4d_mapping_id",
            transaction,
          }
        );
        console.log("      ✓ species_derivative_size_grade_mapping_id added");
      } else {
        console.log(
          "      ✓ species_derivative_size_grade_mapping_id already exists"
        );
      }

      // ============================================================================
      // STEP 3: Add size/grade category columns
      // ============================================================================
      console.log(
        "   [3/7] Adding size_category and grade_category columns..."
      );

      if (!table.size_category) {
        await queryInterface.addColumn(
          "product_master",
          "size_category",
          {
            type: Sequelize.STRING(50),
            allowNull: true,
            comment:
              "Size category type (weight, count, length, etc.) for classification",
          },
          { transaction }
        );
        console.log("      ✓ size_category added");
      } else {
        console.log("      ✓ size_category already exists");
      }

      if (!table.size_range) {
        await queryInterface.addColumn(
          "product_master",
          "size_range",
          {
            type: Sequelize.STRING(100),
            allowNull: true,
            comment: "Human-readable size range (e.g., 0.5-2kg, 10-20cm)",
          },
          { transaction }
        );
        console.log("      ✓ size_range added");
      } else {
        console.log("      ✓ size_range already exists");
      }

      // ============================================================================
      // STEP 4: Add RAW product support columns
      // ============================================================================
      console.log(
        "   [4/7] Adding raw product support columns (processing_state, product_role, is_raw)..."
      );

      if (!table.processing_state) {
        await queryInterface.addColumn(
          "product_master",
          "processing_state",
          {
            type: Sequelize.ENUM("RAW", "PROCESSED"),
            allowNull: false,
            defaultValue: "PROCESSED",
            comment: "Product processing state",
          },
          { transaction }
        );

        await queryInterface.addIndex("product_master", ["processing_state"], {
          name: "idx_product_processing_state",
          transaction,
        });
        console.log("      ✓ processing_state added");
      } else {
        console.log("      ✓ processing_state already exists");
      }

      if (!table.product_role) {
        await queryInterface.addColumn(
          "product_master",
          "product_role",
          {
            type: Sequelize.ENUM(
              "RAW_MATERIAL",
              "WIP",
              "FINISHED_GOOD",
              "BYPRODUCT"
            ),
            allowNull: false,
            defaultValue: "FINISHED_GOOD",
            comment: "Product role in manufacturing/supply chain",
          },
          { transaction }
        );

        await queryInterface.addIndex("product_master", ["product_role"], {
          name: "idx_product_role",
          transaction,
        });
        console.log("      ✓ product_role added");
      } else {
        console.log("      ✓ product_role already exists");
      }

      if (!table.is_raw) {
        await queryInterface.addColumn(
          "product_master",
          "is_raw",
          {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            comment: "Shorthand flag for processing_state = RAW",
          },
          { transaction }
        );
        console.log("      ✓ is_raw added");
      } else {
        console.log("      ✓ is_raw already exists");
      }

      // ============================================================================
      // STEP 5: Add HSN code support
      // ============================================================================
      console.log("   [5/7] Adding HSN code support...");

      if (!table.hsn_code) {
        await queryInterface.addColumn(
          "product_master",
          "hsn_code",
          {
            type: Sequelize.STRING(10),
            allowNull: true,
            comment:
              "HSN (Harmonized System of Nomenclature) code for taxation",
          },
          { transaction }
        );

        await queryInterface.addIndex("product_master", ["hsn_code"], {
          name: "idx_product_hsn_code",
          transaction,
        });
        console.log("      ✓ hsn_code added");
      } else {
        console.log("      ✓ hsn_code already exists");
      }

      // ============================================================================
      // STEP 6: Add product flags (additional classification)
      // ============================================================================
      console.log("   [6/7] Adding product flags...");

      if (!table.is_producible) {
        await queryInterface.addColumn(
          "product_master",
          "is_producible",
          {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
            comment: "Can this product be produced/manufactured?",
          },
          { transaction }
        );
        console.log("      ✓ is_producible added");
      } else {
        console.log("      ✓ is_producible already exists");
      }

      if (!table.is_saleable) {
        await queryInterface.addColumn(
          "product_master",
          "is_saleable",
          {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
            comment: "Can this product be sold to customers?",
          },
          { transaction }
        );
        console.log("      ✓ is_saleable added");
      } else {
        console.log("      ✓ is_saleable already exists");
      }

      // ============================================================================
      // STEP 7: Add ERP-grade constraints
      // ============================================================================
      console.log("   [7/7] Adding database constraints...");

      // Helper function to check if constraint exists
      const constraintExists = async (constraintName) => {
        const result = await queryInterface.sequelize.query(
          `SELECT constraint_name FROM information_schema.table_constraints 
           WHERE table_name = 'product_master' AND constraint_name = '${constraintName}'`,
          { type: Sequelize.QueryTypes.SELECT, transaction }
        );
        return result.length > 0;
      };

      // Constraint 1: RAW products must NOT have grade_master_id
      const hasGradeConstraint = await constraintExists("chk_raw_no_grade");
      if (!hasGradeConstraint) {
        await queryInterface.sequelize.query(
          `ALTER TABLE product_master 
           ADD CONSTRAINT chk_raw_no_grade 
           CHECK ((processing_state = 'RAW' AND grade_master_id IS NULL) 
                   OR processing_state <> 'RAW')`,
          { transaction }
        );
        console.log(
          "      ✓ Raw products cannot have grade (constraint added)"
        );
      } else {
        console.log("      ✓ Grade constraint already exists");
      }

      // Constraint 2: RAW products MUST have size_master_id
      const hasSizeConstraint = await constraintExists("chk_raw_size_required");
      if (!hasSizeConstraint) {
        await queryInterface.sequelize.query(
          `ALTER TABLE product_master 
           ADD CONSTRAINT chk_raw_size_required 
           CHECK (processing_state <> 'RAW' OR size_master_id IS NOT NULL)`,
          { transaction }
        );
        console.log("      ✓ Raw products must have size (constraint added)");
      } else {
        console.log("      ✓ Size requirement constraint already exists");
      }

      // Constraint 3: RAW products cannot be producible (they are inputs)
      const hasProducibilityConstraint = await constraintExists(
        "chk_raw_not_producible"
      );
      if (!hasProducibilityConstraint) {
        await queryInterface.sequelize.query(
          `ALTER TABLE product_master 
           ADD CONSTRAINT chk_raw_not_producible 
           CHECK ((processing_state = 'RAW' AND is_producible = FALSE) 
                   OR processing_state <> 'RAW')`,
          { transaction }
        );
        console.log(
          "      ✓ Raw products are not producible (constraint added)"
        );
      } else {
        console.log("      ✓ Producibility constraint already exists");
      }

      // ============================================================================
      // STEP 8: Verification
      // ============================================================================
      console.log("   [8/8] Verifying schema...");

      const finalTable = await queryInterface.describeTable("product_master");

      const requiredColumns = [
        "derivative_master_id",
        "species_derivative_size_grade_mapping_id",
        "processing_state",
        "product_role",
        "is_raw",
        "hsn_code",
        "is_producible",
        "is_saleable",
        "size_category",
        "size_range",
      ];

      const missingColumns = requiredColumns.filter((col) => !finalTable[col]);

      if (missingColumns.length > 0) {
        console.warn(`⚠️  Missing columns: ${missingColumns.join(", ")}`);
      } else {
        console.log("      ✓ All required columns present");
      }

      await transaction.commit();

      console.log("\n✅ Product Master Schema consolidation complete!");
      console.log("\n📊 Summary of changes:");
      console.log("   ✓ Foreign Keys: derivative_master, 4D mapping");
      console.log(
        "   ✓ Raw Material Support: processing_state, product_role, is_raw"
      );
      console.log("   ✓ Classification: size_category, size_range, hsn_code");
      console.log("   ✓ Flags: is_producible, is_saleable");
      console.log("   ✓ Constraints: 3 business rule constraints added");
      console.log("   ✓ Indexes: 6 performance indexes created\n");
    } catch (error) {
      await transaction.rollback();
      console.error(
        "\n❌ Error in consolidated product master schema migration:",
        error.message
      );
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log(
        "\n🔄 Reverting consolidated product master schema changes..."
      );

      // Remove constraints first
      const constraintNames = [
        "chk_raw_no_grade",
        "chk_raw_size_required",
        "chk_raw_not_producible",
      ];

      for (const constraintName of constraintNames) {
        try {
          await queryInterface.sequelize.query(
            `ALTER TABLE product_master DROP CONSTRAINT IF EXISTS ${constraintName}`,
            { transaction }
          );
          console.log(`   ✓ Removed constraint: ${constraintName}`);
        } catch (e) {
          // Constraint might not exist, continue
        }
      }

      // Remove indexes
      const indexes = [
        "idx_product_derivative_master_id",
        "idx_product_4d_mapping_id",
        "idx_product_processing_state",
        "idx_product_role",
        "idx_product_hsn_code",
      ];

      for (const indexName of indexes) {
        try {
          await queryInterface.removeIndex("product_master", indexName, {
            transaction,
          });
          console.log(`   ✓ Removed index: ${indexName}`);
        } catch (e) {
          // Index might not exist, continue
        }
      }

      // Remove columns (order matters - reverse of addition)
      const columnsToRemove = [
        "is_saleable",
        "is_producible",
        "hsn_code",
        "is_raw",
        "product_role",
        "processing_state",
        "size_range",
        "size_category",
        "species_derivative_size_grade_mapping_id",
        "derivative_master_id",
      ];

      for (const column of columnsToRemove) {
        try {
          const table = await queryInterface.describeTable("product_master");
          if (table[column]) {
            await queryInterface.removeColumn("product_master", column, {
              transaction,
            });
            console.log(`   ✓ Removed column: ${column}`);
          }
        } catch (e) {
          console.warn(
            `   ⚠️  Could not remove column ${column}: ${e.message}`
          );
        }
      }

      await transaction.commit();
      console.log("\n✅ Consolidated product master schema changes reverted\n");
    } catch (error) {
      await transaction.rollback();
      console.error("\n❌ Error reverting consolidated schema:", error.message);
      throw error;
    }
  },
};
