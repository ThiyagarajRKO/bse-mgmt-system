"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Check if column exists
      const table = await queryInterface.describeTable("packing", {
        transaction,
      });

      if (!table.qa_checklist_id) {
        await queryInterface.addColumn(
          "packing",
          "qa_checklist_id",
          {
            type: Sequelize.UUID,
            allowNull: true,
            comment: "Reference to QA Checklist",
          },
          { transaction },
        );
        console.log("✅ Added qa_checklist_id column to packing table");
      } else {
        console.log(
          "ℹ️  qa_checklist_id column already exists in packing table",
        );
      }

      // Add foreign key constraint
      const indexNames = await queryInterface.sequelize.query(
        `SELECT indexname FROM pg_indexes WHERE tablename = 'packing' AND indexname LIKE '%qa_checklist%'`,
        { transaction },
      );

      if (!indexNames[0] || indexNames[0].length === 0) {
        await queryInterface.sequelize.query(
          `ALTER TABLE packing ADD CONSTRAINT fk_packing_qa_checklist_id 
           FOREIGN KEY (qa_checklist_id) REFERENCES qa_checklist(id) ON UPDATE CASCADE ON DELETE SET NULL`,
          { transaction },
        );
        console.log("✅ Added foreign key constraint for qa_checklist_id");
      } else {
        console.log("ℹ️  Foreign key constraint already exists");
      }

      // Create index
      await queryInterface
        .addIndex("packing", ["qa_checklist_id"], {
          name: "idx_packing_qa_checklist_id",
          transaction,
        })
        .catch(() => {
          console.log("ℹ️  Index already exists or could not be created");
        });

      await transaction.commit();
      console.log("✅ Migration completed successfully");
    } catch (err) {
      await transaction.rollback();
      console.error("❌ Migration failed:", err.message || err);
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Drop index
      try {
        await queryInterface.removeIndex(
          "packing",
          "idx_packing_qa_checklist_id",
          { transaction },
        );
      } catch (e) {
        console.log("ℹ️  Index did not exist");
      }

      // Drop foreign key constraint
      try {
        await queryInterface.sequelize.query(
          "ALTER TABLE packing DROP CONSTRAINT IF EXISTS fk_packing_qa_checklist_id",
          { transaction },
        );
      } catch (e) {
        console.log("ℹ️  Foreign key constraint did not exist");
      }

      // Remove column
      await queryInterface.removeColumn("packing", "qa_checklist_id", {
        transaction,
      });

      await transaction.commit();
      console.log("✅ Rollback completed successfully");
    } catch (err) {
      await transaction.rollback();
      console.error("❌ Rollback failed:", err.message || err);
      throw err;
    }
  },
};
