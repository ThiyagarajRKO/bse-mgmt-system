"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // PostgreSQL requires changing ENUM by creating new type, using it, and dropping old
    // For MySQL, we can just use changeColumn

    const dbDialect = queryInterface.sequelize.options.dialect;

    if (dbDialect === "postgres") {
      // For PostgreSQL: Try to add value to existing ENUM type
      // If the type doesn't exist, the SalesAllocations table probably wasn't created yet
      await queryInterface.sequelize
        .query(
          `
        ALTER TYPE "enum_SalesAllocations_allocation_status" ADD VALUE 'PENDING_PURCHASE' 
        BEFORE 'PRODUCTION_IN_PROGRESS';
      `,
        )
        .catch((err) => {
          // If enum type doesn't exist, that's OK - it will be created by another migration
          if (err.message.includes("does not exist")) {
            console.log(
              "ℹ️  Enum type does not exist yet - will be created by SalesAllocations migration",
            );
            return; // Not an error, table hasn't been created yet
          } else if (err.message.includes("already exists")) {
            console.log(
              "✅ PENDING_PURCHASE already exists in allocation_status enum",
            );
          } else {
            throw err;
          }
        });
    } else if (dbDialect === "mysql" || dbDialect === "mariadb") {
      // For MySQL: Modify ENUM
      await queryInterface.changeColumn(
        "SalesAllocations",
        "allocation_status",
        {
          type: Sequelize.ENUM(
            "PENDING",
            "ALLOCATED",
            "PENDING_PURCHASE",
            "PRODUCTION_IN_PROGRESS",
            "COMPLETED",
          ),
          allowNull: false,
          defaultValue: "PENDING",
        },
      );
    }

    console.log(
      "✅ Migration: Added PENDING_PURCHASE to SalesAllocations.allocation_status enum",
    );
  },

  async down(queryInterface, Sequelize) {
    // Note: Cannot remove ENUM values in PostgreSQL once they're used
    // This migration is not easily reversible
    console.log(
      "⚠️  Down migration not fully supported - ENUM values cannot be removed in PostgreSQL",
    );
  },
};
