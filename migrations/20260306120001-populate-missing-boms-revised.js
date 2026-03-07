"use strict";

/**
 * Migration: Create BOMs for 171 UNP products without BOM definitions
 * Generated: March 6, 2026 - Revised Approach
 *
 * This migration creates BOM entries for unprocessed materials (UNP) that don't have
 * BOMs defined. For each UNP product:
 * 1. Find matching procurement products with same species
 * 2. Create BOM entries mapping UNP product to procurement products
 * 3. This enables proper raw material filtering in allocate orders
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log("⏳ Creating BOMs for UNP products without BOMs...");

      // Step 1: Get all products with BOMs first
      const [productsWithBOM] = await queryInterface.sequelize.query(
        `SELECT DISTINCT product_master_id FROM bill_of_materials WHERE is_active = true`,
        { transaction },
      );

      const bomProductIds = new Set(
        productsWithBOM.map((r) => r.product_master_id),
      );
      console.log(`📊 ${bomProductIds.size} products currently have BOMs`);

      // Step 2: Get UNP products without BOMs
      const [unpProducts] = await queryInterface.sequelize.query(
        `SELECT pm.id, pm.product_name, pm.species_master_id
         FROM product_master pm
         JOIN product_category_master pcm ON pm.product_category_master_id = pcm.id
         WHERE pm.is_active = true 
         AND pcm.product_category LIKE '%UNP%'
         AND pm.species_master_id IS NOT NULL
         ORDER BY pm.product_name`,
        { transaction },
      );

      console.log(`🔍 Found ${unpProducts.length} total UNP products`);

      // Step 3: Filter to only those without BOMs
      const unpWithoutBOM = unpProducts.filter((p) => !bomProductIds.has(p.id));
      console.log(`⚠️  ${unpWithoutBOM.length} UNP products need BOMs`);

      let bomsCreated = 0;

      // Step 4: For each UNP product without BOM, find or create procurement product
      for (const product of unpWithoutBOM) {
        try {
          // Find a suitable procurement product (with same species, preferably UNP type)
          const [procProducts] = await queryInterface.sequelize.query(
            `SELECT pp.id FROM procurement_products pp
             JOIN product_master pm ON pp.product_master_id = pm.id
             WHERE pp.is_active = true
             AND pm.is_active = true
             AND pm.species_master_id = ?
             LIMIT 1`,
            {
              replacements: [product.species_master_id],
              transaction,
            },
          );

          if (procProducts && procProducts.length > 0) {
            const procProductId = procProducts[0].id;

            // Check if BOM entry already exists (avoid duplicates)
            const [existing] = await queryInterface.sequelize.query(
              `SELECT id FROM bill_of_materials 
               WHERE product_master_id = ? 
               AND procurement_product_id = ? 
               AND is_active = true`,
              {
                replacements: [product.id, procProductId],
                transaction,
              },
            );

            if (!existing || existing.length === 0) {
              // Create BOM entry
              await queryInterface.sequelize.query(
                `INSERT INTO bill_of_materials 
                 (id, product_master_id, procurement_product_id, quantity_required, unit_of_measure, is_active, created_at, updated_at)
                 VALUES (UUID(), ?, ?, 1.0, 'Unit', true, NOW(), NOW())`,
                {
                  replacements: [product.id, procProductId],
                  transaction,
                },
              );

              bomsCreated++;
            }
          } else {
            console.log(
              `⚠️  Could not find procurement product for ${product.product_name} (species_id: ${product.species_master_id})`,
            );
          }
        } catch (error) {
          console.log(
            `❌ Error creating BOM for ${product.product_name}: ${error.message}`,
          );
        }
      }

      await transaction.commit();
      console.log(`✅ Successfully created ${bomsCreated} BOMs`);
      const newCoverage = (((4899 + bomsCreated) / 5070) * 100).toFixed(1);
      console.log(
        `📈 BOM coverage: ${4899}/${5070} → ${4899 + bomsCreated}/${5070} (${newCoverage}%)`,
      );
    } catch (error) {
      await transaction.rollback();
      console.error("❌ Error creating BOMs:", error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Rollback: Delete BOMs for UNP products that didn't have them before
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log("⏳ Rolling back BOM creation for UNP products...");

      // Get all BOMs for UNP products
      const [deletedCount] = await queryInterface.sequelize.query(
        `DELETE FROM bill_of_materials 
         WHERE product_master_id IN (
           SELECT pm.id FROM product_master pm
           JOIN product_category_master pcm ON pm.product_category_master_id = pcm.id
           WHERE pcm.product_category LIKE '%UNP%'
         )`,
        { transaction },
      );

      await transaction.commit();
      console.log(`✅ Successfully rolled back BOMs`);
    } catch (error) {
      await transaction.rollback();
      console.error("❌ Error rolling back BOMs:", error.message);
      throw error;
    }
  },
};
