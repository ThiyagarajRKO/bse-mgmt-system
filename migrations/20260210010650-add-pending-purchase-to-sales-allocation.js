"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // PostgreSQL requires changing ENUM by creating new type, using it, and dropping old
    // For MySQL, we can just use changeColumn

    const dbDialect = queryInterface.sequelize.options.dialect;

    if (dbDialect === "postgres") {
      // For PostgreSQL: Create new ENUM type with added value
      await queryInterface.sequelize
        .query(
          `
        ALTER TYPE "enum_SalesAllocations_allocation_status" ADD VALUE 'PENDING_PURCHASE' 
        BEFORE 'PRODUCTION_IN_PROGRESS';
      `,
        )
        .catch((err) => {
          // If enum value already exists, this is fine
          if (err.message.includes("already exists")) {
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
