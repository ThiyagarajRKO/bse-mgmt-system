"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable(
      "yield_standard_master",
    );

    // Add new derivative_id column if it doesn't exist
    if (!tableDescription.derivative_id) {
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
    await queryInterface.sequelize.query(`
      UPDATE yield_standard_master
      SET processing_type = 'RAW'
    `);

    // Create the ENUM type first (check if it doesn't exist)
    try {
      await queryInterface.sequelize.query(`
        CREATE TYPE "enum_yield_standard_master_processing_type" AS ENUM('RAW', 'COOKED')
      `);
    } catch (error) {
      // ENUM type might already exist, continue
      console.log("ENUM type might already exist:", error.message);
    }

    // Use raw SQL to change column to ENUM with proper handling
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
      await queryInterface.addColumn("yield_standard_master", "created_at", {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      });
    }
    if (!tableDescription.updated_at) {
      await queryInterface.addColumn("yield_standard_master", "updated_at", {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      });
    }

    // TODO: Data migration logic would go here
    // This requires mapping product_form to derivative_id
    // For now, we'll keep derivative_id nullable until proper data migration is implemented
    // In production, this would need careful data mapping from product_form to derivative_id

    // Remove product_form column if it exists
    if (tableDescription.product_form) {
      await queryInterface.removeColumn(
        "yield_standard_master",
        "product_form",
      );
    }

    // Keep derivative_id nullable for now - will be made NOT NULL after data migration
    // await queryInterface.changeColumn('yield_standard_master', 'derivative_id', {
    //   type: Sequelize.UUID,
    //   allowNull: false,
    //   references: {
    //     model: 'derivative_master',
    //     key: 'id',
    //   },
    //   onUpdate: 'CASCADE',
    //   onDelete: 'CASCADE',
    // });

    // Drop old indexes and create new ones
    try {
      await queryInterface.removeIndex("yield_standard_master", [
        "species_id",
        "product_form",
        "processing_type",
      ]);
    } catch (error) {
      // Index might not exist, continue
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
    } catch (error) {
      // Index might already exist, continue
    }
  },

  async down(queryInterface, Sequelize) {
    // Reverse the migration
    await queryInterface.removeIndex("yield_standard_master", [
      "species_id",
      "derivative_id",
      "processing_type",
    ]);

    await queryInterface.addColumn("yield_standard_master", "product_form", {
      type: Sequelize.ENUM("FROZEN", "COOKED", "RTE", "FRESH"),
      allowNull: true,
    });

    await queryInterface.changeColumn(
      "yield_standard_master",
      "processing_type",
      {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
    );

    await queryInterface.removeColumn("yield_standard_master", "derivative_id");

    await queryInterface.addIndex(
      "yield_standard_master",
      ["species_id", "product_form", "processing_type"],
      {
        unique: true,
      },
    );

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
  },
};
