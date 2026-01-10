#!/usr/bin/env node

/**
 * Product Master Migration Runner
 * Runs ONLY product master related migrations (not all migrations)
 * 
 * Usage: node scripts/migrate-product-master.js
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[36m',
};

// Product master migrations (in order)
const PRODUCT_MASTER_MIGRATIONS = [
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

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runMigration(migrationName) {
  return new Promise((resolve, reject) => {
    log(`\n▶️  Running: ${migrationName}...`, 'blue');
    
    // Use Sequelize CLI to run specific migration
    const cmd = `npx sequelize db:migrate --name ${migrationName}`;
    
    exec(cmd, { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
      if (error) {
        // Some migrations might already be run (SequelizeMigrationNotPendingError)
        if (stdout.includes('SequelizeMigrationNotPendingError') || 
            stdout.includes('already ran') ||
            stdout.includes('already executed')) {
          log(`✓ ${migrationName} - Already executed (skipped)`, 'yellow');
          resolve();
        } else {
          log(`✗ ${migrationName} - Failed`, 'red');
          log(`Error: ${stderr || stdout}`, 'red');
          reject(error);
        }
      } else {
        log(`✓ ${migrationName} - Success`, 'green');
        resolve();
      }
    });
  });
}

async function runAllMigrations() {
  log(`\n${'='.repeat(70)}`, 'bright');
  log('🚀 Product Master Migration Runner', 'bright');
  log(`${'='.repeat(70)}\n`, 'bright');
  
  log(`📋 Migrations to run: ${PRODUCT_MASTER_MIGRATIONS.length}`, 'blue');
  PRODUCT_MASTER_MIGRATIONS.forEach((m, i) => {
    log(`   ${i + 1}. ${m}`, 'blue');
  });
  
  log(`\n⏱️  Starting at: ${new Date().toLocaleString()}`, 'yellow');
  
  let completed = 0;
  let skipped = 0;
  
  for (const migration of PRODUCT_MASTER_MIGRATIONS) {
    try {
      await runMigration(migration);
      completed++;
    } catch (error) {
      log(`\n❌ Stopped at migration: ${migration}`, 'red');
      log(`Error details: ${error.message}`, 'red');
      process.exit(1);
    }
  }
  
  log(`\n${'='.repeat(70)}`, 'bright');
  log('✅ Migration Complete!', 'green');
  log(`${'='.repeat(70)}`, 'bright');
  log(`\n📊 Summary:`, 'green');
  log(`   • Completed: ${completed} migrations`, 'green');
  log(`   • Status: All product master migrations executed`, 'green');
  log(`   • Completed at: ${new Date().toLocaleString()}`, 'yellow');
  log(`\n`, 'reset');
}

// Run migrations
runAllMigrations().catch(error => {
  log(`\n❌ Fatal Error: ${error.message}`, 'red');
  process.exit(1);
});
