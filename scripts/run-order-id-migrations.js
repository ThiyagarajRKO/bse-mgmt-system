#!/usr/bin/env node

const path = require("path");
require("dotenv").config();
const { Sequelize } = require("sequelize");

// Database configuration
const config = {
  username: process.env.DB_USERNAME,
  password: process.env.DB_SECRET,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: "postgres",
  logging: (msg) => console.log("[SQL]", msg),
};

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: config.logging,
  }
);

// Migration functions
const migrations = [
  {
    name: "20260115-add-order-id-to-dispatches",
    up: async () => {
      console.log("Running: add order_id to dispatches...");
      await sequelize.query(`
        ALTER TABLE dispatches 
        ADD COLUMN IF NOT EXISTS order_id UUID
      `);
      await sequelize
        .query(
          `
        ALTER TABLE dispatches 
        ADD CONSTRAINT dispatches_order_id_fk 
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
      `
        )
        .catch((e) => console.log("FK already exists or error:", e.message));

      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS dispatches_order_id_idx 
        ON dispatches(order_id)
      `);
      console.log("✓ Added order_id to dispatches");
    },
  },
  {
    name: "20260115-add-order-id-to-procurement-lots",
    up: async () => {
      console.log("Running: add order_id to procurement_lots...");
      await sequelize.query(`
        ALTER TABLE procurement_lots 
        ADD COLUMN IF NOT EXISTS order_id UUID
      `);
      await sequelize
        .query(
          `
        ALTER TABLE procurement_lots 
        ADD CONSTRAINT procurement_lots_order_id_fk 
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
      `
        )
        .catch((e) => console.log("FK already exists or error:", e.message));

      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS procurement_lots_order_id_idx 
        ON procurement_lots(order_id)
      `);
      console.log("✓ Added order_id to procurement_lots");
    },
  },
  {
    name: "20260115-add-order-id-to-procurement-products",
    up: async () => {
      console.log("Running: add order_id to procurement_products...");
      await sequelize.query(`
        ALTER TABLE procurement_products 
        ADD COLUMN IF NOT EXISTS order_id UUID
      `);
      await sequelize
        .query(
          `
        ALTER TABLE procurement_products 
        ADD CONSTRAINT procurement_products_order_id_fk 
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
      `
        )
        .catch((e) => console.log("FK already exists or error:", e.message));

      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS procurement_products_order_id_idx 
        ON procurement_products(order_id)
      `);
      console.log("✓ Added order_id to procurement_products");
    },
  },
  {
    name: "20260115-add-order-id-to-peeling",
    up: async () => {
      console.log("Running: add order_id to peeling...");
      await sequelize.query(`
        ALTER TABLE peeling 
        ADD COLUMN IF NOT EXISTS order_id UUID
      `);
      await sequelize
        .query(
          `
        ALTER TABLE peeling 
        ADD CONSTRAINT peeling_order_id_fk 
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
      `
        )
        .catch((e) => console.log("FK already exists or error:", e.message));

      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS peeling_order_id_idx 
        ON peeling(order_id)
      `);
      console.log("✓ Added order_id to peeling");
    },
  },
  {
    name: "20260115-add-order-id-to-peeled-dispatches",
    up: async () => {
      console.log("Running: add order_id to peeled_dispatches...");
      await sequelize.query(`
        ALTER TABLE peeled_dispatches 
        ADD COLUMN IF NOT EXISTS order_id UUID
      `);
      await sequelize
        .query(
          `
        ALTER TABLE peeled_dispatches 
        ADD CONSTRAINT peeled_dispatches_order_id_fk 
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
      `
        )
        .catch((e) => console.log("FK already exists or error:", e.message));

      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS peeled_dispatches_order_id_idx 
        ON peeled_dispatches(order_id)
      `);
      console.log("✓ Added order_id to peeled_dispatches");
    },
  },
];

// Run migrations
async function runMigrations() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log("✓ Database connection successful\n");

    // Run all migrations
    for (const migration of migrations) {
      try {
        await migration.up();
      } catch (error) {
        console.error(`✗ Migration ${migration.name} failed:`, error.message);
      }
    }

    console.log("\n✓ All migrations completed!");
    process.exit(0);
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
}

runMigrations();
