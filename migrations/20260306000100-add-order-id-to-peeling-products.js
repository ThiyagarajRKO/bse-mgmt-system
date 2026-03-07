"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // add new column (idempotent - ignore if already present)
      try {
        await queryInterface.addColumn(
          "peeling_products",
          "order_id",
          {
            type: Sequelize.UUID,
            allowNull: true,
            comment:
              "Denormalised reference to the sales order for this peeled product",
          },
          { transaction },
        );
      } catch (err) {
        if (err?.original?.code === "42701") {
          console.log("peeling_products.order_id already exists, skipping");
        } else {
          throw err;
        }
      }

      // backfill from parent peeling.join order_id
      await queryInterface.sequelize.query(
        `
          UPDATE peeling_products pp
          SET order_id = p.order_id
          FROM peeling p
          WHERE pp.peeling_id = p.id
            AND pp.order_id IS NULL
            AND p.order_id IS NOT NULL
        `,
        { transaction },
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn("peeling_products", "order_id", {
        transaction,
      });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
