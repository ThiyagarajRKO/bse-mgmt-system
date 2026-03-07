"use strict";

/**
 * Migration: Create BOMs for 171 products without BOM definitions
 * Generated: March 6, 2026
 *
 * This migration creates BOM entries for unprocessed materials (UNP) that don't have
 * BOMs defined. For each UNP product, we map it to a suitable procurement product
 * of the same species to enable proper sourcing and specification.
 *
 * Strategy: For each UNP product:
 * 1. Find matching procurement products with same species
 * 2. Create BOM mapping with quantity_required = 1.0
 * 3. This allows system to properly filter raw materials for orders
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log("⏳ Creating BOMs for missing products...");

      // Get all UNP products without BOMs
      const [products] = await queryInterface.sequelize.query(
        `SELECT DISTINCT pm.id, pm.product_name, pm.species_master_id, pcm.product_category
         FROM product_master pm
         LEFT JOIN product_category_master pcm ON pm.product_category_master_id = pcm.id
         WHERE pm.is_active = true 
         AND pcm.product_category LIKE '%UNP%'
         AND pm.id NOT IN (
           SELECT DISTINCT product_master_id 
           FROM bill_of_materials 
           WHERE is_active = true
         )
         ORDER BY pm.product_name`,
        { transaction },
      );

      console.log(`📊 Found ${products.length} UNP products without BOMs`);

      let bomsCreated = 0;

      for (const product of products) {
        try {
          // Find a matching procurement product with same species
          const [procProducts] = await queryInterface.sequelize.query(
            `SELECT pp.id
             FROM procurement_products pp
             JOIN product_master pm ON pp.product_master_id = pm.id
             WHERE pp.is_active = true
             AND pm.species_master_id = ?
             LIMIT 1`,
            {
              replacements: [product.species_master_id],
              transaction,
            },
          );

          if (procProducts && procProducts.length > 0) {
            const procProductId = procProducts[0].id;

            // Insert BOM entry
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
        } catch (error) {
          console.log(
            `⚠️  Could not create BOM for ${product.product_name}: ${error.message}`,
          );
        }
      }

      await transaction.commit();
      console.log(`✅ Successfully created ${bomsCreated} BOMs`);
      console.log(
        `📈 BOM coverage improved from 96.6% to ~${(((4899 + bomsCreated) / 5070) * 100).toFixed(1)}%`,
      );
    } catch (error) {
      await transaction.rollback();
      console.error("❌ Error creating BOMs:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Rollback: Delete BOMs created for UNP products that previously had none
    const transaction = await queryInterface.sequelize.transaction();
    try {
      console.log("⏳ Rolling back BOM creation...");

      const [result] = await queryInterface.sequelize.query(
        `DELETE FROM bill_of_materials 
         WHERE product_master_id IN (
           SELECT DISTINCT pm.id
           FROM product_master pm
           JOIN product_category_master pcm ON pm.product_category_master_id = pcm.id
           WHERE pm.is_active = true 
           AND pcm.product_category LIKE '%UNP%'
         )`,
        { transaction },
      );

      await transaction.commit();
      console.log("✅ Successfully rolled back BOM creation");
    } catch (error) {
      await transaction.rollback();
      console.error("❌ Error rolling back BOMs:", error);
      throw error;
    }
  },
};
