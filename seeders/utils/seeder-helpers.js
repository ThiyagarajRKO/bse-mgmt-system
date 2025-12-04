"use strict";

/**
 * Seeder Utilities
 *
 * Common helper functions for all seeders:
 * - User ID management
 * - Logging with consistent formatting
 * - Error handling
 * - Data validation
 * - Idempotency checks
 *
 * Usage in seeders:
 * const { getOrCreateUser, logSection, logSuccess, logError } = require('./seeders/utils/seeder-helpers');
 */

const { v4: uuidv4 } = require("uuid");

/**
 * Get first admin user or create a system user
 * @param {Object} queryInterface - Sequelize query interface
 * @returns {Promise<string>} User ID
 */
async function getOrCreateUser(queryInterface) {
  try {
    // Try to get admin user
    const adminUsers = await queryInterface.sequelize.query(
      `SELECT id FROM user_profiles 
       WHERE deleted_at IS NULL 
       ORDER BY created_at ASC 
       LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (adminUsers && adminUsers.length > 0) {
      return adminUsers[0].id;
    }

    // If no users exist, create a default system user
    const systemUserId = uuidv4();
    const now = new Date();

    // Create auth.users entry first
    try {
      await queryInterface.sequelize.query(
        `INSERT INTO auth.users (id, username, email, phone, country_code, password, is_active, user_status)
         VALUES (:id, :username, :email, :phone, :country_code, :password, true, '1')
         ON CONFLICT (id) DO NOTHING`,
        {
          replacements: {
            id: systemUserId,
            username: "SYSTEM_SEEDER",
            email: "system@bse-mgmt.local",
            phone: "0000000000",
            country_code: "+91",
            password:
              "$2a$10$qTJM6LkwTm1pxJSfa6FaS.Q.Z1rQLLrNaLhZK219c8VHa5DIHh8mC", // bcrypt hash of "password"
          },
        }
      );
    } catch (err) {
      // Could not create auth user (may already exist)
    }

    // Create user_profiles entry
    await queryInterface.sequelize.query(
      `INSERT INTO user_profiles (id, user_id, first_name, last_name, is_active, created_at, updated_at)
       VALUES (:id, :userId, :firstName, :lastName, true, :now, :now)
       ON CONFLICT (id) DO NOTHING`,
      {
        replacements: {
          id: systemUserId,
          userId: systemUserId,
          firstName: "System",
          lastName: "Seeder",
          now: now,
        },
      }
    );

    return systemUserId;
  } catch (error) {
    console.error(error.message);
    throw error;
  }
}

/**
 * Format log section header
 * @param {string} title - Section title
 * @param {string} emoji - Emoji prefix (default: 🔧)
 */
function logSection(title, emoji = "🔧") {
  console.log(`\n${title}`);
  console.log("─".repeat(60));
}

/**
 * Log success message
 * @param {string} message - Success message
 */
function logSuccess(message) {
  console.log(`  ${message}`);
}

/**
 * Log warning message
 * @param {string} message - Warning message
 */
function logWarning(message) {
  console.log(`  ${message}`);
}

/**
 * Log error message
 * @param {string} message - Error message
 */
function logError(message) {
  console.error(`  ${message}`);
}

/**
 * Log info message
 * @param {string} message - Info message
 */
function logInfo(message) {
  console.log(`  ${message}`);
}

/**
 * Check if data already exists in table
 * @param {Object} queryInterface - Sequelize query interface
 * @param {string} tableName - Table name
 * @param {Object} where - WHERE clause conditions
 * @returns {Promise<number>} Count of existing records
 */
async function countExisting(queryInterface, tableName, where = {}) {
  try {
    const whereClause = Object.entries(where)
      .map(([key, value]) => {
        if (value === null) return `${key} IS NULL`;
        if (typeof value === "string")
          return `${key} = '${value.replace(/'/g, "''")}'`;
        return `${key} = ${value}`;
      })
      .join(" AND ");

    const query =
      whereClause.length > 0
        ? `SELECT COUNT(*) as count FROM ${tableName} WHERE ${whereClause}`
        : `SELECT COUNT(*) as count FROM ${tableName}`;

    const result = await queryInterface.sequelize.query(query, {
      type: queryInterface.sequelize.QueryTypes.SELECT,
    });

    return result[0]?.count || 0;
  } catch (error) {
    console.warn(`⚠️  Could not count existing records in ${tableName}`);
    return 0;
  }
}

/**
 * Bulk insert with duplicate checking
 * @param {Object} queryInterface - Sequelize query interface
 * @param {string} tableName - Table name
 * @param {Array} records - Records to insert
 * @param {Object} options - Options (ignoreDuplicates, etc.)
 * @returns {Promise<void>}
 */
async function safeBulkInsert(
  queryInterface,
  tableName,
  records,
  options = {}
) {
  try {
    const count = await countExisting(queryInterface, tableName);

    if (count > 0 && !options.force) {
      logWarning(
        `${tableName} already has ${count} records. Skipping insert (use force:true to override).`
      );
      return;
    }

    await queryInterface.bulkInsert(tableName, records, {
      ignoreDuplicates: true,
      ...options,
    });

    logSuccess(`${records.length} records inserted into ${tableName}`);
  } catch (error) {
    logError(`Failed to insert into ${tableName}: ${error.message}`);
    throw error;
  }
}

/**
 * Safe bulk delete with protection
 * @param {Object} queryInterface - Sequelize query interface
 * @param {string} tableName - Table name
 * @param {Object} where - WHERE clause
 * @returns {Promise<void>}
 */
async function safeBulkDelete(queryInterface, tableName, where = {}) {
  try {
    const count = await countExisting(queryInterface, tableName, where);
    logWarning(`Deleting ${count} records from ${tableName}`);

    await queryInterface.bulkDelete(tableName, where);
    logSuccess(`Deleted records from ${tableName}`);
  } catch (error) {
    logError(`Failed to delete from ${tableName}: ${error.message}`);
    throw error;
  }
}

/**
 * Generate completion summary
 * @param {string} name - Seeder name
 * @param {Object} stats - Statistics object
 */
function logCompletion(name, stats = {}) {
  console.log("\n" + "═".repeat(60));
  console.log(`${name} COMPLETE`);
  console.log("═".repeat(60));

  if (Object.keys(stats).length > 0) {
    console.log("Summary:");
    Object.entries(stats).forEach(([key, value]) => {
      console.log(`  • ${key}: ${value}`);
    });
  }
  console.log("");
}

module.exports = {
  getOrCreateUser,
  logSection,
  logSuccess,
  logWarning,
  logError,
  logInfo,
  countExisting,
  safeBulkInsert,
  safeBulkDelete,
  logCompletion,
  uuidv4,
};
