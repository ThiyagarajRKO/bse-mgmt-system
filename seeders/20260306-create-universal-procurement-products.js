"use strict";
const { v4: uuidv4 } = require("uuid");

/**
 * Create Procurement Products for ALL Species
 *
 * This seeder creates UNPROCESSED WHOLE ROUND procurement products
 * for EVERY species that has finished products but is missing raw materials.
 *
 * Then it creates BOM entries mapping all finished products to these
 * raw material sources.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log("\n🚀 Starting Universal Procurement Product Creator...\n");

    try {
      // Step 0: Create a master procurement lot for system-generated raw materials
      console.log("Step 0️⃣  Setting up master data...\n");

      const lotId = uuidv4();
      const supplierId = uuidv4();
      const now = new Date();

      try {
        await queryInterface.sequelize.query(
          `
          INSERT INTO procurement_lots 
          (id, lot_number, lot_date, quantity_received, unit_of_measure, 
           is_active, created_at, updated_at)
          VALUES (:id, :lot_number, :date, :qty, :uom, true, :now, :now)
          ON CONFLICT DO NOTHING
        `,
          {
            replacements: {
              id: lotId,
              lot_number: "SYSTEM-UNP-RAW-MATERIALS",
              date: now,
              qty: 0,
              uom: "KG",
              now: now,
            },
          },
        );
        console.log("  ✅ Master procurement lot created");
      } catch (error) {
        console.log(`  ⚠️  Lot creation note: ${error.message}`);
      }

      // Create or get a default supplier
      const [existingSupplier] = await queryInterface.sequelize.query(`
        SELECT id FROM supplier_master
        WHERE is_active = true
        LIMIT 1
      `);

      const finalSupplierId =
        existingSupplier.length > 0 ? existingSupplier[0].id : supplierId;

      if (existingSupplier.length === 0) {
        try {
          await queryInterface.sequelize.query(
            `
            INSERT INTO supplier_master 
            (id, supplier_name, is_active, created_at, updated_at)
            VALUES (:id, :name, true, :now, :now)
            ON CONFLICT DO NOTHING
          `,
            {
              replacements: {
                id: supplierId,
                name: "System Raw Materials Supplier",
                now: now,
              },
            },
          );
          console.log("  ✅ Default supplier created\n");
        } catch (error) {
          console.log(`  ⚠️  Supplier creation note: ${error.message}\n`);
        }
      } else {
        console.log("  ✅ Using existing supplier\n");
      }

      // Step 1: Get all species with finished products but no procurement products
      console.log("Step 1️⃣  Finding species without procurement products...\n");

      const [missingProcSpecies] = await queryInterface.sequelize.query(`
        SELECT DISTINCT sm.id, sm.species_name
        FROM species_master sm
        LEFT JOIN product_category_master pcm ON sm.id = pcm.species_master_id
        LEFT JOIN product_master pm ON pcm.id = pm.product_category_master_id
          AND pm.is_raw = false AND pm.is_producible = true AND pm.is_active = true
        LEFT JOIN (
          SELECT DISTINCT sm2.id
          FROM species_master sm2
          LEFT JOIN product_category_master pcm2 ON sm2.id = pcm2.species_master_id
          LEFT JOIN product_master pm2 ON pcm2.id = pm2.product_category_master_id
          LEFT JOIN procurement_products pp ON pm2.id = pp.product_master_id
          WHERE pp.id IS NOT NULL
        ) proc ON sm.id = proc.id
        WHERE sm.is_active = true
          AND proc.id IS NULL
          AND pm.id IS NOT NULL
        ORDER BY sm.species_name
      `);

      console.log(
        `  Found ${missingProcSpecies.length} species without procurement products\n`,
      );

      // Step 2: For each species, create UNPROCESSED WHOLE ROUND products
      console.log(
        "Step 2️⃣  Creating UNPROCESSED WHOLE ROUND procurement products...\n",
      );

      let procProductsCreated = 0;
      const createdProcProducts = {};

      for (const species of missingProcSpecies) {
        try {
          // Create UNPROCESSED WHOLE ROUND product for this species
          const productId = uuidv4();
          const productName = `${species.species_name} | UNP WHOLE ROUND | UNSIZED`;
          const now = new Date();

          // First, check if a product with this name already exists
          const [existingProduct] = await queryInterface.sequelize.query(
            `
            SELECT id FROM product_master
            WHERE product_name = :name
            LIMIT 1
          `,
            {
              replacements: { name: productName },
            },
          );

          let finalProductId =
            existingProduct.length > 0 ? existingProduct[0].id : productId;

          if (existingProduct.length === 0) {
            // Create new product if it doesn't exist
            await queryInterface.sequelize.query(
              `
              INSERT INTO product_master 
              (id, product_name, is_raw, is_producible, is_active, created_at, updated_at)
              VALUES (:id, :name, true, false, true, :now, :now)
              ON CONFLICT DO NOTHING
            `,
              {
                replacements: {
                  id: finalProductId,
                  name: productName,
                  now: now,
                },
              },
            );
          }

          // Create procurement product pointing to this product
          const procProdId = uuidv4();
          await queryInterface.sequelize.query(
            `
            INSERT INTO procurement_products 
            (id, product_master_id, procurement_lot_id, supplier_master_id, procurement_product_type, is_active, created_at, updated_at)
            VALUES (:id, :productId, :lotId, :supplierId, 'UNPROCESSED', true, :now, :now)
            ON CONFLICT DO NOTHING
          `,
            {
              replacements: {
                id: procProdId,
                productId: finalProductId,
                lotId: lotId,
                supplierId: finalSupplierId,
                now: now,
              },
            },
          );

          createdProcProducts[species.id] = procProdId;
          procProductsCreated++;

          if (procProductsCreated % 10 === 0) {
            console.log(
              `  ✅ Created ${procProductsCreated} procurement products...`,
            );
          }
        } catch (error) {
          console.log(
            `  ⚠️  Error for ${species.species_name}: ${error.message}`,
          );
        }
      }

      console.log(
        `\n  ✅ Created ${procProductsCreated} procurement products\n`,
      );

      // Step 3: Get all procurement products (including newly created ones)
      console.log(
        "Step 3️⃣  Creating BOM entries for all finished products...\n",
      );

      const [allProcProducts] = await queryInterface.sequelize.query(`
        SELECT 
          pp.id,
          pp.product_master_id,
          pm.species_master_id,
          pm.product_name
        FROM procurement_products pp
        JOIN product_master pm ON pp.product_master_id = pm.id
        WHERE pp.is_active = true
      `);

      // Group by species
      const procBySpecies = {};
      allProcProducts.forEach((p) => {
        if (!procBySpecies[p.species_master_id]) {
          procBySpecies[p.species_master_id] = [];
        }
        procBySpecies[p.species_master_id].push(p);
      });

      // Get all finished products
      const [finishedProducts] = await queryInterface.sequelize.query(`
        SELECT 
          pm.id,
          pm.product_name,
          pm.species_master_id
        FROM product_master pm
        LEFT JOIN product_category_master pcm ON pm.product_category_master_id = pcm.id
        LEFT JOIN species_master sm ON pcm.species_master_id = sm.id
        WHERE pm.is_raw = false 
          AND pm.is_producible = true
          AND pm.is_active = true
        ORDER BY pm.species_master_id, pm.product_name
      `);

      // Get existing BOM entries
      const [existingBOMs] = await queryInterface.sequelize.query(`
        SELECT product_master_id, procurement_product_id
        FROM bill_of_materials
        WHERE is_active = true
      `);

      const bomSet = new Set(
        existingBOMs.map(
          (b) => `${b.product_master_id}|${b.procurement_product_id}`,
        ),
      );

      // Create BOM entries
      let bomCreated = 0;
      let bomSkipped = 0;
      let finishedWithoutProc = 0;

      for (const finishedProduct of finishedProducts) {
        const procProds =
          procBySpecies[finishedProduct.species_master_id] || [];

        if (procProds.length === 0) {
          finishedWithoutProc++;
          continue;
        }

        // Create one BOM entry per procurement product
        for (const procProd of procProds) {
          const key = `${finishedProduct.id}|${procProd.id}`;

          if (bomSet.has(key)) {
            bomSkipped++;
            continue;
          }

          try {
            const bomId = uuidv4();
            const now = new Date();

            await queryInterface.sequelize.query(
              `
              INSERT INTO bill_of_materials 
              (id, product_master_id, procurement_product_id, quantity_required, unit_of_measure, is_active, created_at, updated_at)
              VALUES (:id, :finishedId, :procurementId, :quantity, :uom, true, :now, :now)
              ON CONFLICT DO NOTHING
            `,
              {
                replacements: {
                  id: bomId,
                  finishedId: finishedProduct.id,
                  procurementId: procProd.id,
                  quantity: 1.0,
                  uom: "KG",
                  now: now,
                },
              },
            );

            bomCreated++;

            if (bomCreated % 1000 === 0) {
              console.log(`  ✅ Created ${bomCreated} BOM entries...`);
            }
          } catch (error) {
            // Silently skip duplicates
          }
        }
      }

      console.log(`\n  ✅ Created ${bomCreated} new BOM entries`);
      console.log(`  ⏭️  Skipped ${bomSkipped} existing entries`);
      console.log(
        `  ⚠️  ${finishedWithoutProc} finished products still without procurement products\n`,
      );

      // Step 4: Verify final coverage
      console.log("Step 4️⃣  Verifying final BOM coverage...\n");

      const [finalStats] = await queryInterface.sequelize.query(`
        SELECT 
          COUNT(DISTINCT product_master_id) as products_with_bom,
          COUNT(*) as total_bom_entries
        FROM bill_of_materials
        WHERE is_active = true
      `);

      const [finalFinished] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as total
        FROM product_master
        WHERE is_raw = false AND is_producible = true AND is_active = true
      `);

      const coveragePercent = (
        (finalStats[0].products_with_bom / finalFinished[0].total) *
        100
      ).toFixed(1);

      console.log(
        "═══════════════════════════════════════════════════════════",
      );
      console.log(`📊 FINAL COVERAGE REPORT`);
      console.log(
        "═══════════════════════════════════════════════════════════",
      );
      console.log(`\n📦 PROCUREMENT PRODUCTS:`);
      console.log(`  Created: ${procProductsCreated}`);
      console.log(`\n🏭 FINISHED PRODUCTS:`);
      console.log(`  Total: ${finalFinished[0].total}`);
      console.log(`  With BOM: ${finalStats[0].products_with_bom}`);
      console.log(`  Coverage: ${coveragePercent}%`);
      console.log(`\n🔗 BOM ENTRIES:`);
      console.log(`  Total: ${finalStats[0].total_bom_entries}`);
      console.log(`  New: ${bomCreated}`);
      console.log(
        `\n═══════════════════════════════════════════════════════════\n`,
      );

      if (coveragePercent >= 99) {
        console.log("✅ COMPLETE BOM COVERAGE ACHIEVED!\n");
      } else {
        console.log(`⚠️  Coverage: ${coveragePercent}%\n`);
      }
    } catch (error) {
      console.error("\n❌ Error:", error.message);
      throw error;
    }
  },

  async down(queryInterface) {
    console.log("\n⚠️  Rollback not supported for this seeder.");
  },
};
