#!/usr/bin/env node

/**
 * Product Master Seeder Runner (Sequelize Direct)
 * 
 * Usage: npm run seed:product-master
 * Or:    node scripts/seed-product-master-sequelize.js
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

// Product Master Seeders (ordered)
const PRODUCT_SEEDERS = [
  '20251201-consolidated-product-master-seeder',
  '20260109-generate-products-from-mappings',
];

async function runSeeders() {
  try {
    log(`\n${'='.repeat(70)}`, 'bright');
    log('🌱 Product Master Seeder Runner', 'bright');
    log(`${'='.repeat(70)}\n`, 'bright');

    // Test connection
    log('🔗 Testing database connection...', 'blue');
    await sequelize.authenticate();
    log('✓ Connected to database\n', 'green');

    log(`📋 Running ${PRODUCT_SEEDERS.length} product master seeders:\n`, 'blue');

    let successful = 0;
    let skipped = 0;
    let failed = 0;

    const seedersDir = path.join(__dirname, '../seeders');

    for (const seederName of PRODUCT_SEEDERS) {
      const seederFile = path.join(seedersDir, `${seederName}.js`);

      if (!fs.existsSync(seederFile)) {
        log(`⚠️  ${seederName} - File not found (skipped)`, 'yellow');
        skipped++;
        continue;
      }

      try {
        log(`▶️  ${seederName}...`, 'blue');
        const seeder = require(seederFile);

        if (!seeder.up && !seeder.seed) {
          log(`⚠️  ${seederName} - No up() or seed() function (skipped)`, 'yellow');
          skipped++;
          continue;
        }

        // Run seeder (support both up() and seed() patterns)
        const seederFunction = seeder.up || seeder.seed;
        const result = await seederFunction(sequelize.getQueryInterface(), Sequelize);

        log(`✓ ${seederName} - Success`, 'green');
        if (result && result.message) {
          log(`   ${result.message}`, 'green');
        }
        successful++;

      } catch (error) {
        log(`✗ ${seederName} - Failed`, 'red');
        log(`   Error: ${error.message}`, 'red');
        failed++;
      }
    }

    // Summary
    log(`\n${'='.repeat(70)}`, 'bright');
    log('📊 Seeding Summary', 'bright');
    log(`${'='.repeat(70)}`, 'bright');
    log(`✓ Successful: ${successful}`, 'green');
    log(`⏭️  Skipped: ${skipped}`, 'yellow');
    log(`✗ Failed: ${failed}`, failed > 0 ? 'red' : 'green');
    log(`\n✅ Product Master Seeding Complete!\n`, 'green');

    await sequelize.close();
    process.exit(failed > 0 ? 1 : 0);

  } catch (error) {
    log(`\n❌ Fatal Error: ${error.message}`, 'red');
    log(`Stack: ${error.stack}`, 'red');
    await sequelize.close();
    process.exit(1);
  }
}

runSeeders();
