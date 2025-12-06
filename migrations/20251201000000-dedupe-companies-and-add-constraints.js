"use strict";

/**
 * Migration: Deduplicate companies and add unique constraints
 *
 * This migration:
 * 1. Identifies duplicate companies by normalized GSTIN
 * 2. For each duplicate group, keeps the earliest created_at, merges references
 * 3. Updates all foreign key references to point to the keeper company
 * 4. Soft-deletes duplicate company rows
 * 5. Adds a UNIQUE constraint on company_gstin to prevent future duplicates
 *
 * Idempotency: Safe to run multiple times. Checks if constraint already exists.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Helper to normalize GSTIN for comparison
      const normGstin = (s) => (s || "").toString().toLowerCase().trim();

      // Step 1: Fetch all companies (including soft-deleted for now)
      const companies = await queryInterface.sequelize.query(
        `SELECT id, company_name, company_gstin, created_at FROM company_master WHERE is_active = true ORDER BY created_at ASC`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (!companies || companies.length === 0) {
        await transaction.commit();
        return;
      }

      // Step 2: Group companies by normalized GSTIN
      const gstinGroups = {};
      companies.forEach((c) => {
        const key = normGstin(c.company_gstin);
        if (!key) {
          // Skip companies with no GSTIN (can't dedupe reliably)
          return;
        }
        if (!gstinGroups[key]) {
          gstinGroups[key] = [];
        }
        gstinGroups[key].push(c);
      });

      let totalDuplicatesRemoved = 0;

      // Step 3: For each group, keep the earliest, delete the rest
      for (const [gstin, group] of Object.entries(gstinGroups)) {
        if (group.length <= 1) {
          // No duplicates in this group
          continue;
        }

        // Sort by created_at (earliest first)
        group.sort((a, b) => {
          const ta = new Date(a.created_at).getTime();
          const tb = new Date(b.created_at).getTime();
          return ta - tb;
        });

        const keeper = group[0];
        const duplicates = group.slice(1);

        // Step 3a: Update all foreign key references for each duplicate
        for (const dup of duplicates) {
          // Update supplier_master
          await queryInterface.sequelize.query(
            `UPDATE supplier_master SET company_id = :keeperId WHERE company_id = :dupId`,
            {
              replacements: { keeperId: keeper.id, dupId: dup.id },
              transaction,
            }
          );

          // Update customer_master
          await queryInterface.sequelize.query(
            `UPDATE customer_master SET company_id = :keeperId WHERE company_id = :dupId`,
            {
              replacements: { keeperId: keeper.id, dupId: dup.id },
              transaction,
            }
          );

          // Update carrier_master
          await queryInterface.sequelize.query(
            `UPDATE carrier_master SET company_id = :keeperId WHERE company_id = :dupId`,
            {
              replacements: { keeperId: keeper.id, dupId: dup.id },
              transaction,
            }
          );

          // Update division_master
          await queryInterface.sequelize.query(
            `UPDATE division_master SET company_id = :keeperId WHERE company_id = :dupId`,
            {
              replacements: { keeperId: keeper.id, dupId: dup.id },
              transaction,
            }
          );

          // Update unit_master
          await queryInterface.sequelize.query(
            `UPDATE unit_master SET company_id = :keeperId WHERE company_id = :dupId`,
            {
              replacements: { keeperId: keeper.id, dupId: dup.id },
              transaction,
            }
          );

          // Update ledger_master (if exists)
          await queryInterface.sequelize.query(
            `UPDATE ledger_master SET company_id = :keeperId WHERE company_id = :dupId`,
            {
              replacements: { keeperId: keeper.id, dupId: dup.id },
              transaction,
            }
          );

          // Soft-delete the duplicate company (set is_active = false, deleted_at = NOW)
          await queryInterface.sequelize.query(
            `UPDATE company_master SET is_active = false, deleted_at = NOW() WHERE id = :dupId`,
            { replacements: { dupId: dup.id }, transaction }
          );

          totalDuplicatesRemoved++;
        }
      }

      // Step 4: Add UNIQUE constraint on company_gstin to prevent future duplicates
      // Check if constraint already exists to ensure idempotency
      const constraints = await queryInterface.sequelize.query(
        `SELECT constraint_name FROM information_schema.table_constraints
         WHERE table_name = 'company_master' AND constraint_type = 'UNIQUE' AND constraint_name = 'uq_company_gstin'`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (constraints.length === 0) {
        await queryInterface.addConstraint("company_master", {
          fields: ["company_gstin"],
          type: "unique",
          name: "uq_company_gstin",
          transaction,
        });
      }

      // Optional: Add UNIQUE constraint on company_name as well (more aggressive)
      // Uncomment if you want to prevent duplicate names too
      // const nameConstraints = await queryInterface.sequelize.query(
      //   `SELECT constraint_name FROM information_schema.table_constraints
      //    WHERE table_name = 'company_master' AND constraint_type = 'UNIQUE' AND constraint_name = 'uq_company_name'`,
      //   { type: Sequelize.QueryTypes.SELECT, transaction }
      // );
      // if (nameConstraints.length === 0) {
      //   console.log("[Dedupe] Adding UNIQUE constraint on company_name...");
      //   await queryInterface.addConstraint("company_master", {
      //     fields: ["company_name"],
      //     type: "unique",
      //     name: "uq_company_name",
      //     transaction,
      //   });
      // }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error("[Dedupe] Migration failed. Rolled back.", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Remove the UNIQUE constraint
      const constraints = await queryInterface.sequelize.query(
        `SELECT constraint_name FROM information_schema.table_constraints
         WHERE table_name = 'company_master' AND constraint_type = 'UNIQUE' AND constraint_name = 'uq_company_gstin'`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (constraints.length > 0) {
        await queryInterface.removeConstraint(
          "company_master",
          "uq_company_gstin",
          { transaction }
        );
      }

      // Note: The down migration does NOT restore deleted duplicates.
      // If you need to restore duplicates, you must have a backup of the DB before running this migration.
      // This is intentional: duplicates should not be restored.

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error("[Dedupe] Rollback failed.", error);
      throw error;
    }
  },
};
