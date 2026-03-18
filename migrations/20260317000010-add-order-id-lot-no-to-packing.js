"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const table = await queryInterface.describeTable("packing");

      // Add order_no if missing
      if (!table.order_no) {
        console.log("✅ Adding order_no column to packing table");
        await queryInterface.addColumn("packing", "order_no", {
          type: Sequelize.STRING(255),
          allowNull: true,
        });

        await queryInterface.addIndex("packing", ["order_no"], {
          name: "idx_packing_order_no",
        });
      }

      // Add order_id if missing
      if (!table.order_id) {
        console.log("✅ Adding order_id column to packing table");
        await queryInterface.addColumn("packing", "order_id", {
          type: Sequelize.UUID,
          allowNull: true,
        });

        await queryInterface.addIndex("packing", ["order_id"], {
          name: "idx_packing_order_id",
        });
      }

      // Add lot_no if missing
      if (!table.lot_no) {
        console.log("✅ Adding lot_no column to packing table");
        await queryInterface.addColumn("packing", "lot_no", {
          type: Sequelize.STRING(255),
          allowNull: true,
        });

        await queryInterface.addIndex("packing", ["lot_no"], {
          name: "idx_packing_lot_no",
        });
      }

      console.log("✅ All columns added successfully to packing table");
    } catch (err) {
      console.error("Error in migration:", err.message);
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      const table = await queryInterface.describeTable("packing");

      if (table.lot_no) {
        await queryInterface
          .removeIndex("packing", "idx_packing_lot_no")
          .catch(() => {});
        await queryInterface.removeColumn("packing", "lot_no");
      }

      if (table.order_id) {
        await queryInterface
          .removeIndex("packing", "idx_packing_order_id")
          .catch(() => {});
        await queryInterface.removeColumn("packing", "order_id");
      }

      if (table.order_no) {
        await queryInterface
          .removeIndex("packing", "idx_packing_order_no")
          .catch(() => {});
        await queryInterface.removeColumn("packing", "order_no");
      }

      console.log("✅ Migration rolled back successfully");
    } catch (err) {
      console.error("Error rolling back migration:", err.message);
      throw err;
    }
  },
};
