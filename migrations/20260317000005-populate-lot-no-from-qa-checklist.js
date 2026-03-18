'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Update packing.lot_no from qa_checklist where a match exists
      const updateSQL = `
        UPDATE packing p
        SET lot_no = qc.lot_no
        FROM qa_checklist qc
        WHERE qc.order_id = p.order_id
          AND p.lot_no IS NULL 
          AND qc.lot_no IS NOT NULL
          AND p.is_active = true
          AND qc.is_active = true;
      `;

      console.log('🔄 Populating lot_no in packing from qa_checklist...');
      await queryInterface.sequelize.query(updateSQL);
      console.log('✅ Successfully populated lot_no in packing table');
      
    } catch (error) {
      console.error('Error populating lot_no in packing:', error.message);
      // Don't throw - this is best-effort
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Reverse: set lot_no back to NULL for records we populated
      const reverseSQL = `
        UPDATE packing p
        SET lot_no = NULL
        WHERE lot_no IS NOT NULL;
      `;
      
      await queryInterface.sequelize.query(reverseSQL);
      console.log('✅ Reversed lot_no population');
    } catch (error) {
      console.error('Error reversing lot_no population:', error.message);
      throw error;
    }
  }
};
