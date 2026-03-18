"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log("📝 Populating order_no and lot_no in packing table...");

      // Populate order_no from orders table via order_id
      const updateOrderNo = `
        UPDATE packing p
        SET order_no = o.order_no
        FROM orders o
        WHERE p.order_id = o.id
        AND p.order_no IS NULL
        AND p.is_active = true;
      `;

      await queryInterface.sequelize.query(updateOrderNo);
      console.log("✅ order_no populated from orders table");

      // Populate lot_no from procurement_lots via procurement_lot_id
      const updateLotNo = `
        UPDATE packing p
        SET lot_no = pl.procurement_lot
        FROM procurement_lots pl
        WHERE p.procurement_lot_id = pl.id
        AND p.lot_no IS NULL
        AND p.is_active = true;
      `;

      await queryInterface.sequelize.query(updateLotNo);
      console.log("✅ lot_no populated from procurement_lots table");

      // Verify the data
      const checkData = `
        SELECT COUNT(*) as total, 
               SUM(CASE WHEN order_no IS NOT NULL THEN 1 ELSE 0 END) as with_order_no,
               SUM(CASE WHEN lot_no IS NOT NULL THEN 1 ELSE 0 END) as with_lot_no
        FROM packing WHERE is_active = true;
      `;

      const result = await queryInterface.sequelize.query(checkData);
      console.log("✅ Data verification:", result[0][0]);
    } catch (err) {
      console.error("❌ Error in migration:", err.message);
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Clear populated data
      const clearData = `
        UPDATE packing 
        SET order_no = NULL, lot_no = NULL
        WHERE is_active = true;
      `;

      await queryInterface.sequelize.query(clearData);
      console.log("✅ Data cleared successfully");
    } catch (err) {
      console.error("❌ Error rolling back migration:", err.message);
      throw err;
    }
  },
};
