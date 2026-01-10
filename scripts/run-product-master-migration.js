#!/usr/bin/env node

/**
 * Product Master Migration & Seeder Runner
 * Runs product master migrations directly via Sequelize without CLI
 * 
 * Usage: 
 *   node scripts/run-product-master-migration.js
 */

require('dotenv').config();
const path = require('path');
const Sequelize = require('sequelize');
const SequelizeMeta = require('sequelize').Model;

// Color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[36m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

// Database configuration
const dbConfig = {
  database: process.env.DB_NAME || 'bse_mgmt',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  dialect: 'mysql',
  logging: false,
};

// Product Master Migrations (in execution order)
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

async function runProductMasterMigration() {
  const sequelize = new Sequelize(dbConfig);

  try {
    log(`\n${'='.repeat(70)}`, 'bright');
    log('🚀 Product Master Migration Runner', 'bright');
    log(`${'='.repeat(70)}\n`, 'bright');

    // Test database connection
    log('🔗 Connecting to database...', 'blue');
    await sequelize.authenticate();
    log('✓ Database connected successfully', 'green');

    // Run migrations using Sequelize CLI
    log(`\n📋 Running ${PRODUCT_MIGRATIONS.length} product master migrations...`, 'blue');

    const migrateUp = require('sequelize-cli/lib/helpers/migrate-up');
    const path = require('path');

    const migrationsPath = path.join(__dirname, '../migrations');

    for (const migration of PRODUCT_MIGRATIONS) {
      log(`\n▶️  ${migration}...`, 'yellow');
      try {
        // Load and execute migration
        const migrationPath = path.join(migrationsPath, `${migration}.js`);
        const migrationModule = require(migrationPath);

        if (migrationModule.up) {
          await migrationModule.up(sequelize.queryInterface, Sequelize);
          log(`✓ ${migration} - Success`, 'green');
        } else {
          log(`⚠ ${migration} - No up() function found`, 'yellow');
        }
      } catch (error) {
        if (error.message.includes('already exists') || 
            error.message.includes('Duplicate column')) {
          log(`⚠ ${migration} - Already applied (skipped)`, 'yellow');
        } else {
          throw error;
        }
      }
    }

    log(`\n${'='.repeat(70)}`, 'bright');
    log('✅ Product Master Migrations Complete!', 'green');
    log(`${'='.repeat(70)}\n`, 'bright');

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    log(`Stack: ${error.stack}`, 'red');
    await sequelize.close();
    process.exit(1);
  }
}

// Run
runProductMasterMigration();
