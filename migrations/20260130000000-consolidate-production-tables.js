"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log("Starting consolidated production tables migration...");

    const tableDescription = await queryInterface.describeTable(
      "yield_standard_master",
    );

    // Add new derivative_id column if it doesn't exist
    if (!tableDescription.derivative_id) {
      console.log("Adding derivative_id column to yield_standard_master...");
      await queryInterface.addColumn("yield_standard_master", "derivative_id", {
        type: Sequelize.UUID,
        allowNull: true, // Initially allow null for migration
        references: {
          model: "derivative_master",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
    }

    // First, update ALL existing processing_type values to 'RAW' as a safe default
    console.log("Updating processing_type values to RAW...");
    await queryInterface.sequelize.query(`
      UPDATE yield_standard_master
      SET processing_type = 'RAW'
    `);

    // Create the ENUM type first (check if it doesn't exist)
    try {
      await queryInterface.sequelize.query(`
        CREATE TYPE "enum_yield_standard_master_processing_type" AS ENUM('RAW', 'COOKED')
      `);
      console.log("Created ENUM type for processing_type");
    } catch (error) {
      // ENUM type might already exist, continue
      console.log("ENUM type might already exist:", error.message);
    }

    // Use raw SQL to change column to ENUM with proper handling
    console.log("Converting processing_type to ENUM...");
    await queryInterface.sequelize.query(`
      ALTER TABLE yield_standard_master
      ALTER COLUMN processing_type TYPE "enum_yield_standard_master_processing_type"
      USING processing_type::"enum_yield_standard_master_processing_type"
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE yield_standard_master
      ALTER COLUMN processing_type SET DEFAULT 'RAW'
    `);

    // Add timestamps if they don't exist
    if (!tableDescription.created_at) {
      console.log("Adding created_at timestamp...");
      await queryInterface.addColumn("yield_standard_master", "created_at", {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      });
    }
    if (!tableDescription.updated_at) {
      console.log("Adding updated_at timestamp...");
      await queryInterface.addColumn("yield_standard_master", "updated_at", {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      });
    }

    // Remove product_form column if it exists
    if (tableDescription.product_form) {
      console.log("Removing product_form column...");
      await queryInterface.removeColumn(
        "yield_standard_master",
        "product_form",
      );
    }

    // Update indexes - drop old and create new
    try {
      console.log("Updating indexes...");
      await queryInterface.removeIndex("yield_standard_master", [
        "species_id",
        "product_form",
        "processing_type",
      ]);
    } catch (error) {
      console.log("Old index might not exist:", error.message);
    }

    try {
      await queryInterface.addIndex(
        "yield_standard_master",
        ["species_id", "derivative_id", "processing_type"],
        {
          unique: true,
          where: {
            is_active: true,
          },
        },
      );
      console.log("Created new composite index");
    } catch (error) {
      console.log("New index might already exist:", error.message);
    }

    console.log(
      "✓ Consolidated production tables migration completed successfully",
    );
  },

  async down(queryInterface, Sequelize) {
    console.log("Rolling back consolidated production tables changes...");

    // Reverse the migration
    try {
      await queryInterface.removeIndex("yield_standard_master", [
        "species_id",
        "derivative_id",
        "processing_type",
      ]);
    } catch (error) {
      console.log("Index removal failed:", error.message);
    }

    // Add back product_form column
    await queryInterface.addColumn("yield_standard_master", "product_form", {
      type: Sequelize.ENUM("FROZEN", "COOKED", "RTE", "FRESH"),
      allowNull: true,
    });

    // Convert processing_type back to string
    await queryInterface.changeColumn(
      "yield_standard_master",
      "processing_type",
      {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
    );

    // Remove derivative_id column
    await queryInterface.removeColumn("yield_standard_master", "derivative_id");

    // Recreate old index
    try {
      await queryInterface.addIndex(
        "yield_standard_master",
        ["species_id", "product_form", "processing_type"],
        {
          unique: true,
        },
      );
    } catch (error) {
      console.log("Old index recreation failed:", error.message);
    }

    // Remove timestamps if they were added
    const tableDescription = await queryInterface.describeTable(
      "yield_standard_master",
    );
    if (tableDescription.created_at) {
      await queryInterface.removeColumn("yield_standard_master", "created_at");
    }
    if (tableDescription.updated_at) {
      await queryInterface.removeColumn("yield_standard_master", "updated_at");
    }

    console.log(
      "✓ Rollback of consolidated production tables changes completed",
    );
  },
};
