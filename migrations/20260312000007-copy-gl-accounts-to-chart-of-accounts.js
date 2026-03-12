"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log(
      "Copying GL accounts from gl_account_master to chart_of_accounts...",
    );

    try {
      // Get all GL accounts that don't exist in chart_of_accounts
      // Only select columns that match chart_of_accounts schema
      const missingAccounts = await queryInterface.sequelize.query(
        `SELECT 
          gl.id, 
          NULL::uuid as company_id,
          gl.account_code, 
          gl.account_name, 
          NULL::uuid as parent_account_id,
          gl.account_type, 
          0 as level,
          gl.is_posting_account as is_posting, 
          gl.is_active, 
          gl.created_by,
          gl.updated_by, 
          gl.created_at,
          gl.updated_at
         FROM gl_account_master gl
         LEFT JOIN chart_of_accounts coa ON gl.id = coa.id
         WHERE coa.id IS NULL AND gl.is_active = true`,
        { type: Sequelize.QueryTypes.SELECT },
      );

      if (missingAccounts.length > 0) {
        // Insert missing GL accounts into chart_of_accounts
        await queryInterface.bulkInsert(
          "chart_of_accounts",
          missingAccounts,
          {},
        );
        console.log(
          `✓ Inserted ${missingAccounts.length} GL accounts to chart_of_accounts`,
        );
      } else {
        console.log("All GL accounts already exist in chart_of_accounts");
      }
    } catch (error) {
      console.warn(
        `Warning: Could not copy GL accounts: ${error.message}. Continuing...`,
      );
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Don't delete on rollback - these accounts may be in use
    console.log(
      "Skipping rollback of chart_of_accounts data to preserve existing data",
    );
  },
};
