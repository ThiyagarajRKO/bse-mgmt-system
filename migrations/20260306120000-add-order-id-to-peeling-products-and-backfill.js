"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // add order_id column to peeling_products (skip if it already exists)
    try {
      await queryInterface.addColumn("peeling_products", "order_id", {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: { tableName: "orders" },
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        comment: "cached order reference copied from procurement lot/dispatch",
      });
    } catch (err) {
      if (err?.original?.code === "42701") {
        console.log("peeling_products.order_id already exists, skipping");
      } else {
        throw err;
      }
    }

    // backfill procurement_lots.order_id using existing relationships
    // choose the first order id found via order_products -> procurement_products path
    await queryInterface.sequelize.query(`
      UPDATE procurement_lots pl
      SET order_id = sub.order_id
      FROM (
        SELECT DISTINCT ON (prp.procurement_lot_id) prp.procurement_lot_id,
          op.order_id
        FROM procurement_products prp
        JOIN dispatches d ON d.procurement_product_id = prp.id AND d.is_active = true
        JOIN peeling p ON p.dispatch_id = d.id AND p.is_active = true
        JOIN order_products op ON op.product_master_id = d.procurement_product_id
        WHERE op.order_id IS NOT NULL
        ORDER BY prp.procurement_lot_id, op.order_id
      ) AS sub
      WHERE pl.id = sub.procurement_lot_id
        AND pl.order_id IS NULL;
    `);

    // backfill newly added peeling_products.order_id from its lot via dispatch
    try {
      await queryInterface.sequelize.query(`
        UPDATE peeling_products pp
        SET order_id = pl.order_id
        FROM dispatches d
        JOIN procurement_products prp ON prp.id = d.procurement_product_id AND prp.is_active = true
        JOIN procurement_lots pl ON pl.id = prp.procurement_lot_id
        WHERE pp.dispatch_id = d.id
          AND pp.order_id IS NULL
          AND pl.order_id IS NOT NULL;
      `);
    } catch (err) {
      // column may not exist (older schema); safe to skip backfill
      console.log(
        "Skipping peeling_products.order_id backfill via dispatch (column may not exist):",
        err.message,
      );
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("peeling_products", "order_id");
    // we do not revert the backfilled procurement_lots.order_id; manual cleanup if required
  },
};
