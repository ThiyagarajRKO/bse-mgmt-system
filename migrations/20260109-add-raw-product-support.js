"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log("\n📦 Adding RAW product support to product_master...");

      // Step 1: Add new columns
      console.log(
        "   ➕ Adding processing_state, product_role, is_raw columns..."
      );
      await queryInterface.addColumn(
        "product_master",
        "processing_state",
        {
          type: Sequelize.ENUM("RAW", "PROCESSED"),
          allowNull: false,
          defaultValue: "PROCESSED",
        },
        { transaction }
      );

      await queryInterface.addColumn(
        "product_master",
        "product_role",
        {
          type: Sequelize.ENUM("RAW_MATERIAL", "WIP", "FINISHED_GOOD"),
          allowNull: false,
          defaultValue: "FINISHED_GOOD",
        },
        { transaction }
      );

      await queryInterface.addColumn(
        "product_master",
        "is_raw",
        {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        { transaction }
      );

      // Step 2: Create indexes for performance
      console.log("   🔍 Creating indexes...");
      await queryInterface.addIndex("product_master", ["processing_state"], {
        name: "idx_product_processing_state",
        transaction,
      });

      await queryInterface.addIndex("product_master", ["product_role"], {
        name: "idx_product_role",
        transaction,
      });

      // Step 3: Add constraints (ERP-grade enforcement)
      console.log("   🔒 Adding database constraints...");

      // RAW products must NOT have grade
      await queryInterface.sequelize.query(
        "ALTER TABLE product_master ADD CONSTRAINT chk_raw_no_grade CHECK ((processing_state = 'RAW' AND grade_master_id IS NULL) OR processing_state <> 'RAW')",
        { transaction }
      );

      // RAW products MUST have size_id
      await queryInterface.sequelize.query(
        "ALTER TABLE product_master ADD CONSTRAINT chk_raw_size_required CHECK (processing_state <> 'RAW' OR size_master_id IS NOT NULL)",
        { transaction }
      );

      // RAW products cannot be producible (they are inputs, not outputs)
      await queryInterface.sequelize.query(
        "ALTER TABLE product_master ADD CONSTRAINT chk_raw_not_producible CHECK ((processing_state = 'RAW' AND is_producible = FALSE) OR processing_state <> 'RAW')",
        { transaction }
      );

      await transaction.commit();
      console.log("✅ RAW product migration completed successfully\n");
    } catch (error) {
      await transaction.rollback();
      console.error("❌ Error in RAW product migration:", error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log("\n🔄 Reverting RAW product support...");

      // Remove constraints
      await queryInterface.sequelize.query(
        "ALTER TABLE product_master DROP CONSTRAINT IF EXISTS chk_raw_no_grade",
        { transaction }
      );
      await queryInterface.sequelize.query(
        "ALTER TABLE product_master DROP CONSTRAINT IF EXISTS chk_raw_size_required",
        { transaction }
      );
      await queryInterface.sequelize.query(
        "ALTER TABLE product_master DROP CONSTRAINT IF EXISTS chk_raw_not_producible",
        { transaction }
      );

      // Remove indexes
      await queryInterface.removeIndex(
        "product_master",
        "idx_product_processing_state",
        {
          transaction,
        }
      );
      await queryInterface.removeIndex("product_master", "idx_product_role", {
        transaction,
      });

      // Remove columns
      await queryInterface.removeColumn("product_master", "processing_state", {
        transaction,
      });
      await queryInterface.removeColumn("product_master", "product_role", {
        transaction,
      });
      await queryInterface.removeColumn("product_master", "is_raw", {
        transaction,
      });

      await transaction.commit();
      console.log("✅ RAW product rollback completed\n");
    } catch (error) {
      await transaction.rollback();
      console.error("❌ Error reverting RAW product migration:", error.message);
      throw error;
    }
  },
};
