#!/usr/bin/env node

/**
 * Product Master Migration Runner (Sequelize Direct)
 * 
 * Usage: npm run migrate:product-master
 * Or:    node scripts/migrate-product-master-sequelize.js
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const Sequelize = require('sequelize');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[36m',
};

const log = (msg, color = 'reset') => {
  console.log(`${colors[color]}${msg}${colors.reset}`);
};

// Database config
const sequelize = new Sequelize(
  process.env.DB_NAME || 'bse_mgmt',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.DEBUG === 'true' ? console.log : false,
  }
);

// Product Master Migrations (ordered by date)
const PRODUCT_MIGRATIONS = [
  '20251202-consolidated-product-master',
  '20251206000000-consolidated-species-product-master',
  '20260108-align-product-categories-with-derivatives',
  '20260108-map-products-to-derivatives',
  '20260109-add-species-derivative-size-grade-mapping-id-to-product-master',
  '20260109081212-add-derivative-master-id-to-product-master',
  '20260109-add-product-flags',
  '20260109-add-raw-product-support',
  '20260110-fix-product-species-mapping',
];

async function runMigrations() {
  try {
    log(`\n${'='.repeat(70)}`, 'bright');
    log('🚀 Product Master Migration Runner', 'bright');
    log(`${'='.repeat(70)}\n`, 'bright');

    // Test connection
    log('🔗 Testing database connection...', 'blue');
    await sequelize.authenticate();
    log('✓ Connected to database\n', 'green');

    // Create SequelizeMeta table if it doesn't exist
    const queryInterface = sequelize.getQueryInterface();
    await queryInterface.createTable('SequelizeMeta', {
      name: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
    }).catch(() => {
      // Table already exists
    });

    log(`📋 Running ${PRODUCT_MIGRATIONS.length} product master migrations:\n`, 'blue');

    let successful = 0;
    let skipped = 0;
    let failed = 0;

    const migrationsDir = path.join(__dirname, '../migrations');

    for (const migrationName of PRODUCT_MIGRATIONS) {
      const migrationFile = path.join(migrationsDir, `${migrationName}.js`);

      if (!fs.existsSync(migrationFile)) {
        log(`⚠️  ${migrationName} - File not found (skipped)`, 'yellow');
        skipped++;
        continue;
      }

      try {
        // Check if migration already ran
        const [result] = await sequelize.query(
          `SELECT name FROM SequelizeMeta WHERE name = ?`,
          { replacements: [migrationName] }
        );

        if (result.length > 0) {
          log(`⏭️  ${migrationName} - Already executed (skipped)`, 'yellow');
          skipped++;
          continue;
        }

        // Run migration
        log(`▶️  ${migrationName}...`, 'blue');
        const migration = require(migrationFile);

        if (!migration.up) {
          log(`⚠️  ${migrationName} - No up() function (skipped)`, 'yellow');
          skipped++;
          continue;
        }

        await migration.up(queryInterface, Sequelize);

        // Record migration
        await sequelize.query(
          `INSERT INTO SequelizeMeta (name) VALUES (?)`,
          { replacements: [migrationName] }
        );

        log(`✓ ${migrationName} - Success`, 'green');
        successful++;

      } catch (error) {
        log(`✗ ${migrationName} - Failed`, 'red');
        log(`   Error: ${error.message}`, 'red');
        failed++;
      }
    }

    // Summary
    log(`\n${'='.repeat(70)}`, 'bright');
    log('📊 Migration Summary', 'bright');
    log(`${'='.repeat(70)}`, 'bright');
    log(`✓ Successful: ${successful}`, 'green');
    log(`⏭️  Skipped: ${skipped}`, 'yellow');
    log(`✗ Failed: ${failed}`, failed > 0 ? 'red' : 'green');
    log(`\n✅ Product Master Migrations Complete!\n`, 'green');

    await sequelize.close();
    process.exit(failed > 0 ? 1 : 0);

  } catch (error) {
    log(`\n❌ Fatal Error: ${error.message}`, 'red');
    log(`Stack: ${error.stack}`, 'red');
    await sequelize.close();
    process.exit(1);
  }
}

runMigrations();
