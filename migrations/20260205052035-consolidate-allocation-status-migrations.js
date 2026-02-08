"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Step 1: Check if allocation_master table already exists
    const tables = await queryInterface.showAllTables();

    if (!tables.includes("allocation_master")) {
      // Create allocation_master table (from the original create migration)
      await queryInterface.createTable("allocation_master", {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4,
          allowNull: false,
        },
        allocation_no: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true,
        },
        order_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: "orders",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
        },
        order_product_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: "order_products",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
        },
        packing_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: "packing",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
        },
        allocated_quantity: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
        },
        allocated_unit: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        allocation_date: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        status: {
          type: Sequelize.ENUM("ALLOCATED", "PENDING", "PENDING_PURCHASE"),
          defaultValue: "PENDING",
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        created_by: {
          type: Sequelize.UUID,
          allowNull: true,
        },
        updated_by: {
          type: Sequelize.UUID,
          allowNull: true,
        },
      });

      // Add indexes
      await queryInterface.addIndex("allocation_master", ["allocation_no"]);
      await queryInterface.addIndex("allocation_master", ["order_id"]);
      await queryInterface.addIndex("allocation_master", ["packing_id"]);
      await queryInterface.addIndex("allocation_master", ["status"]);
      await queryInterface.addIndex("allocation_master", ["allocation_date"]);
    }

    // Step 2: Ensure PENDING_PURCHASE exists in the enum
    await queryInterface.sequelize
      .query(
        `
      ALTER TYPE "allocation_status"
      ADD VALUE IF NOT EXISTS 'PENDING_PURCHASE';
    `,
      )
      .catch(() => {
        // Ignore error if enum doesn't exist yet
      });

    // Step 3: Add PENDING to the enum
    await queryInterface.sequelize
      .query(
        `
      ALTER TYPE "allocation_status"
      ADD VALUE IF NOT EXISTS 'PENDING';
    `,
      )
      .catch(() => {
        // Ignore error if enum doesn't exist yet
      });

    // Step 4: Map existing records to simplified statuses
    await queryInterface.sequelize
      .query(
        `
      UPDATE allocation_master
      SET status = CASE
        WHEN status IN ('RESERVED', 'CONFIRMED', 'IN_PRODUCTION', 'COMPLETED', 'CANCELLED', 'READY_FOR_DISPATCH', 'READY_FOR_PRODUCTION') THEN 'ALLOCATED'::allocation_status
        WHEN status = 'PENDING_PURCHASE' THEN 'PENDING_PURCHASE'::allocation_status
        ELSE 'PENDING'::allocation_status
      END;
    `,
      )
      .catch(() => {
        // Ignore error if this is the first migration
      });

    // Step 5: Recreate the enum with only ALLOCATED and PENDING_PURCHASE
    // First remove any existing default
    await queryInterface.sequelize
      .query(
        `
      ALTER TABLE allocation_master
      ALTER COLUMN status DROP DEFAULT;
    `,
      )
      .catch(() => {
        // Ignore error if column doesn't have default
      });

    // Change the column to text type temporarily
    await queryInterface
      .changeColumn("allocation_master", "status", {
        type: Sequelize.TEXT,
      })
      .catch(() => {
        // Ignore error if already done
      });

    // Drop the old enum
    await queryInterface.sequelize
      .query(
        `
      DROP TYPE IF EXISTS allocation_status;
    `,
      )
      .catch(() => {
        // Ignore error
      });

    // Create the new simplified enum type
    await queryInterface.sequelize
      .query(
        `
      CREATE TYPE allocation_status AS ENUM ('ALLOCATED', 'PENDING_PURCHASE');
    `,
      )
      .catch(() => {
        // Ignore error if already exists
      });

    // Change the column back to use the new enum
    await queryInterface
      .changeColumn("allocation_master", "status", {
        type: Sequelize.ENUM("ALLOCATED", "PENDING_PURCHASE"),
      })
      .catch(() => {
        // Ignore error if already done
      });

    // Set the default to PENDING_PURCHASE
    await queryInterface.sequelize
      .query(
        `
      ALTER TABLE allocation_master
      ALTER COLUMN status SET DEFAULT 'PENDING_PURCHASE';
    `,
      )
      .catch(() => {
        // Ignore error if already set
      });
  },

  async down(queryInterface, Sequelize) {
    // Drop the allocation_master table
    await queryInterface.dropTable("allocation_master");

    // Clean up the enum type if it exists
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS allocation_status;
    `);
  },
};
