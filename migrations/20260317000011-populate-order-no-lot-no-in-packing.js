"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log("📝 Populating order_no in packing table...");

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

      // Verify the data
      const checkData = `
        SELECT COUNT(*) as total, 
               SUM(CASE WHEN order_no IS NOT NULL THEN 1 ELSE 0 END) as with_order_no
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
