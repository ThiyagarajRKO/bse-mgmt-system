"use strict";
const { v4: uuidv4 } = require("uuid");

/**
 * BOM Setup and Consolidation Seeder
 *
 * Handles all Bill of Materials related setup:
 * 1. Creates BOM entries for processed products
 * 2. Creates missing procurement products
 * 3. Initializes inventory records with proper available_stock
 *
 * Run once during database setup
 */

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    try {
      console.log("\n📋 BOM Setup and Consolidation Starting...\n");

      // Step 1: Populate BOM entries
      console.log("Step 1: Populating Bill of Materials...");
      await populateBOM(queryInterface);

      // Step 2: Create missing procurement products
      console.log("\nStep 2: Creating missing procurement products...");
      await createMissingProcurementProducts(queryInterface);

      // Step 3: Initialize inventory records
      console.log("\nStep 3: Initializing inventory records...");
      await initializeInventoryRecords(queryInterface);

      console.log("\n✅ BOM Setup Complete!\n");
    } catch (error) {
      console.error("\n❌ Error in BOM Setup:", error.message);
      throw error;
    }
  },

  async down(queryInterface) {
    console.log("\n⚠️  Note: This is a setup seeder. Manual cleanup may be required.");
  },
};

/**
 * Populate Bill of Materials
 * Links RAW products to PROCESSED products
 */
async function populateBOM(queryInterface) {
  try {
    // Get all PROCESSED products
    const [processedProducts] = await queryInterface.sequelize.query(`
      SELECT 
        pm.id,
        pm.product_name,
        pm.species_master_id,
        pm.expected_yield_percent
      FROM product_master pm
      WHERE pm.is_raw = false 
        AND pm.is_active = true
        AND pm.is_producible = true
    `);

    console.log(`Found ${processedProducts.length} processed products`);

    let bomsCreated = 0;

    for (const processedProduct of processedProducts) {
      // Find matching RAW product (same species)
      const [rawProducts] = await queryInterface.sequelize.query(`
        SELECT 
          pm.id,
          pm.product_name
        FROM product_master pm
        WHERE pm.species_master_id = :speciesId
          AND pm.is_raw = true
          AND pm.is_active = true
        LIMIT 1
      `, {
        replacements: { speciesId: processedProduct.species_master_id },
        type: queryInterface.sequelize.QueryTypes.SELECT
      });

      if (rawProducts.length > 0) {
        const rawProduct = rawProducts[0];

        // Check if BOM already exists
        const [existingBom] = await queryInterface.sequelize.query(`
          SELECT id FROM bill_of_materials
          WHERE product_master_id = :processedId
            AND raw_material_id = :rawId
            AND is_active = true
        `, {
          replacements: {
            processedId: processedProduct.id,
            rawId: rawProduct.id
          },
          type: queryInterface.sequelize.QueryTypes.SELECT
        });

        if (existingBom.length === 0) {
          // Calculate quantity required based on yield
          const yieldPercent = parseFloat(processedProduct.expected_yield_percent) || 60;
          const quantityRequired = 100 / yieldPercent; // If 60% yield, need 1.67 kg raw for 1 kg processed

          // Create BOM entry
          await queryInterface.sequelize.query(`
            INSERT INTO bill_of_materials 
            (id, product_master_id, raw_material_id, quantity_required, is_active, created_at, created_by)
            VALUES (:id, :processedId, :rawId, :quantity, true, :now, :by)
          `, {
            replacements: {
              id: uuidv4(),
              processedId: processedProduct.id,
              rawId: rawProduct.id,
              quantity: quantityRequired,
              now: new Date(),
              by: "seeder"
            }
          });

          bomsCreated++;
        }
      }
    }

    console.log(`✅ Created ${bomsCreated} BOM entries`);
  } catch (error) {
    console.error("Error populating BOM:", error.message);
    throw error;
  }
}

/**
 * Create Missing Procurement Products
 * Ensures every species has at least one procurement product
 */
async function createMissingProcurementProducts(queryInterface) {
  try {
    // Get all species
    const [allSpecies] = await queryInterface.sequelize.query(`
      SELECT DISTINCT sm.id, sm.species_name
      FROM species_master sm
      WHERE sm.is_active = true
    `, {
      type: queryInterface.sequelize.QueryTypes.SELECT
    });

    console.log(`Found ${allSpecies.length} species`);

    let productsCreated = 0;

    for (const species of allSpecies) {
      // Check if species has any procurement products
      const [existingProducts] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as count
        FROM procurement_products pp
        JOIN product_master pm ON pp.product_master_id = pm.id
        WHERE pm.species_master_id = :speciesId
          AND pp.is_active = true
      `, {
        replacements: { speciesId: species.id },
        type: queryInterface.sequelize.QueryTypes.SELECT
      });

      if (existingProducts[0].count === 0) {
        // Find a raw product for this species
        const [rawProduct] = await queryInterface.sequelize.query(`
          SELECT id, product_name
          FROM product_master
          WHERE species_master_id = :speciesId
            AND is_raw = true
            AND is_active = true
          LIMIT 1
        `, {
          replacements: { speciesId: species.id },
          type: queryInterface.sequelize.QueryTypes.SELECT
        });

        if (rawProduct.length > 0) {
          // Create procurement product
          const procId = uuidv4();
          await queryInterface.sequelize.query(`
            INSERT INTO procurement_products 
            (id, product_master_id, procurement_product_type, quantity, is_active, created_at)
            VALUES (:id, :productId, :type, :qty, true, :now)
          `, {
            replacements: {
              id: procId,
              productId: rawProduct[0].id,
              type: "RAW",
              qty: 0,
              now: new Date()
            }
          });

          // Create inventory record
          await queryInterface.sequelize.query(`
            INSERT INTO purchase_inventory 
            (id, procurement_product_id, product_master_id, quantity, available_stock, reserved_quantity, is_active, created_at)
            VALUES (:id, :procId, :productId, 0, 0, 0, true, :now)
          `, {
            replacements: {
              id: uuidv4(),
              procId: procId,
              productId: rawProduct[0].id,
              now: new Date()
            }
          });

          productsCreated++;
        }
      }
    }

    console.log(`✅ Created ${productsCreated} missing procurement products`);
  } catch (error) {
    console.error("Error creating procurement products:", error.message);
    throw error;
  }
}

/**
 * Initialize Inventory Records
 * Ensures all purchase_inventory records have proper available_stock values
 */
async function initializeInventoryRecords(queryInterface) {
  try {
    // Update records where available_stock is NULL or 0
    const result = await queryInterface.sequelize.query(`
      UPDATE purchase_inventory
      SET available_stock = quantity, 
          reserved_quantity = COALESCE(reserved_quantity, 0)
      WHERE (available_stock IS NULL OR available_stock = 0)
        AND quantity > 0
        AND is_active = true
    `);

    console.log(`✅ Initialized inventory records`);
  } catch (error) {
    console.error("Error initializing inventory:", error.message);
    throw error;
  }
}
