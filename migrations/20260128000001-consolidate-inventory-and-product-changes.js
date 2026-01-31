"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log("Starting consolidated inventory and product changes migration...");

    // 1. Add derivative_master_id to product_master
    console.log("Adding derivative_master_id to product_master...");
    const productTable = await queryInterface.describeTable('product_master');

    if (!productTable.derivative_master_id) {
      await queryInterface.addColumn('product_master', 'derivative_master_id', {
        type: Sequelize.UUID,
        allowNull: true,
        comment: "Reference to derivative_master",
        references: {
          model: 'derivative_master',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });

      await queryInterface.addIndex('product_master', ['derivative_master_id'], {
        name: 'idx_product_derivative_master_id'
      });

      console.log("✅ derivative_master_id column added successfully");
    } else {
      console.log("✅ derivative_master_id column already exists");
    }

    // 2. Add product_id to product_master (if not exists)
    console.log("Checking product_id column in product_master...");
    if (!productTable.product_id) {
      await queryInterface.addColumn('product_master', 'product_id', {
        type: Sequelize.UUID,
        allowNull: true,
        comment: "Reference to product_master itself for product variants",
        references: {
          model: 'product_master',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      console.log("✅ product_id column added successfully");
    } else {
      console.log("✅ product_id column already exists");
    }

    // 3. Add species_master_id to product_master
    console.log("Adding species_master_id to product_master...");
    if (!productTable.species_master_id) {
      await queryInterface.addColumn('product_master', 'species_master_id', {
        type: Sequelize.UUID,
        allowNull: true,
        comment: "Reference to species_master",
        references: {
          model: 'species_master',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });

      await queryInterface.addIndex('product_master', ['species_master_id'], {
        name: 'idx_product_species_master_id'
      });

      console.log("✅ species_master_id column added successfully");
    } else {
      console.log("✅ species_master_id column already exists");
    }

    console.log("✓ Consolidated inventory and product changes migration completed successfully");
  },

  async down(queryInterface, Sequelize) {
    console.log("Rolling back consolidated inventory and product changes...");

    const productTable = await queryInterface.describeTable('product_master');

    // Reverse in opposite order
    if (productTable.species_master_id) {
      try {
        await queryInterface.removeIndex('product_master', 'idx_product_species_master_id');
      } catch (error) {
        console.log("Index might not exist:", error.message);
      }
      await queryInterface.removeColumn('product_master', 'species_master_id');
    }

    if (productTable.product_id) {
      await queryInterface.removeColumn('product_master', 'product_id');
    }

    if (productTable.derivative_master_id) {
      try {
        await queryInterface.removeIndex('product_master', 'idx_product_derivative_master_id');
      } catch (error) {
        console.log("Index might not exist:", error.message);
      }
      await queryInterface.removeColumn('product_master', 'derivative_master_id');
    }

    console.log("✓ Rollback of consolidated inventory and product changes completed");
  },
};