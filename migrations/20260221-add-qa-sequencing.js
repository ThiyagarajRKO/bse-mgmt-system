/* eslint-disable no-unused-vars */
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Migration: QA Sequencing - Add peeled_product_id to QAChecklist
     * and qa_checklist_id to PeeledDispatches
     *
     * Date: 21 February 2026
     * Purpose: Position QA between PeelingProducts and PeeledDispatches
     */

    try {
      console.log("Starting QA sequencing migration...");

      // ============================================
      // Step 1: Add peeled_product_id to qa_checklist
      // ============================================
      console.log("Step 1: Adding peeled_product_id to qa_checklist...");

      try {
        await queryInterface.addColumn("qa_checklist", "peeled_product_id", {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: "peeling_products",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
          comment:
            "Reference to peeled product record (between PeelingProducts and PeeledDispatches)",
        });
        console.log("✓ Added peeled_product_id column to qa_checklist");
      } catch (err) {
        if (err.message.includes("already exists")) {
          console.log("✓ peeled_product_id column already exists");
        } else {
          throw err;
        }
      }

      // Create index for peeled_product_id
      try {
        await queryInterface.addIndex("qa_checklist", ["peeled_product_id"], {
          name: "idx_qa_checklist_peeled_product_id",
        });
        console.log("✓ Created index on qa_checklists.peeled_product_id");
      } catch (err) {
        if (err.message.includes("already exists")) {
          console.log("✓ Index on peeled_product_id already exists");
        } else {
          throw err;
        }
      }

      // ============================================
      // Step 2: Add qa_checklist_id to peeled_dispatches
      // ============================================
      console.log("\nStep 2: Adding qa_checklist_id to peeled_dispatches...");

      try {
        await queryInterface.addColumn("peeled_dispatches", "qa_checklist_id", {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: "qa_checklist",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
          comment:
            "Reference to QA Checklist (new position between PeelingProducts and PeeledDispatches)",
        });
        console.log("✓ Added qa_checklist_id column to peeled_dispatches");
      } catch (err) {
        if (err.message.includes("already exists")) {
          console.log("✓ qa_checklist_id column already exists");
        } else {
          throw err;
        }
      }

      // Create index for qa_checklist_id
      try {
        await queryInterface.addIndex(
          "peeled_dispatches",
          ["qa_checklist_id"],
          {
            name: "idx_peeled_dispatches_qa_checklist_id",
          },
        );
        console.log("✓ Created index on peeled_dispatches.qa_checklist_id");
      } catch (err) {
        if (err.message.includes("already exists")) {
          console.log("✓ Index on qa_checklist_id already exists");
        } else {
          throw err;
        }
      }

      console.log("\n✓ QA sequencing migration completed successfully!");
      return true;
    } catch (err) {
      console.error("Error during QA sequencing migration:", err.message);
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    /**
     * Rollback: Remove peeled_product_id from QAChecklist
     * and qa_checklist_id from PeeledDispatches
     */

    try {
      console.log("Rolling back QA sequencing migration...");

      // Remove peeled_dispatches.qa_checklist_id
      try {
        await queryInterface.removeColumn(
          "peeled_dispatches",
          "qa_checklist_id",
        );
        console.log("✓ Removed qa_checklist_id from peeled_dispatches");
      } catch (err) {
        if (err.message.includes("does not exist")) {
          console.log("✓ qa_checklist_id does not exist");
        } else {
          throw err;
        }
      }

      // Remove qa_checklist.peeled_product_id
      try {
        await queryInterface.removeColumn("qa_checklist", "peeled_product_id");
        console.log("✓ Removed peeled_product_id from qa_checklist");
      } catch (err) {
        if (err.message.includes("does not exist")) {
          console.log("✓ peeled_product_id does not exist");
        } else {
          throw err;
        }
      }

      console.log("\n✓ QA sequencing migration rollback completed!");
      return true;
    } catch (err) {
      console.error("Error during rollback:", err.message);
      throw err;
    }
  },
};
