"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    try {
      // Add notes column
      await queryInterface
        .addColumn("qa_checklist", "notes", {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: "QA Notes",
        })
        .catch((err) => {
          if (
            err.message.includes("already exists") ||
            err.message.includes("duplicate")
          ) {
            console.log("✓ notes column already exists");
          } else {
            throw err;
          }
        });

      console.log("✓ Added notes column to qa_checklist");

      // Add foreign_matter_notes column
      await queryInterface
        .addColumn("qa_checklist", "foreign_matter_notes", {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: "Foreign matter notes",
        })
        .catch((err) => {
          if (
            err.message.includes("already exists") ||
            err.message.includes("duplicate")
          ) {
            console.log("✓ foreign_matter_notes column already exists");
          } else {
            throw err;
          }
        });

      console.log("✓ Added foreign_matter_notes column to qa_checklist");
    } catch (error) {
      console.error("Migration error:", error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    try {
      // Remove notes column
      await queryInterface
        .removeColumn("qa_checklist", "notes")
        .catch((err) => {
          if (
            err.message.includes("does not exist") ||
            err.message.includes("no such column")
          ) {
            console.log("✓ notes column does not exist, skipping removal");
          } else {
            throw err;
          }
        });

      // Remove foreign_matter_notes column
      await queryInterface
        .removeColumn("qa_checklist", "foreign_matter_notes")
        .catch((err) => {
          if (
            err.message.includes("does not exist") ||
            err.message.includes("no such column")
          ) {
            console.log(
              "✓ foreign_matter_notes column does not exist, skipping removal",
            );
          } else {
            throw err;
          }
        });
    } catch (error) {
      console.error("Rollback error:", error.message);
      throw error;
    }
  },
};
