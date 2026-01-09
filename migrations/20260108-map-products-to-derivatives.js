"use strict";
const { v4: uuidv4 } = require("uuid");

/**
 * Map Products to Derivatives Based on Species and Category
 *
 * This migration assigns derivative_master_id to all product_master records
 * based on the species type and product category mapping:
 *
 * Fish: Raw Whole, Raw Fillet, Semi-Minced, Cooked Boiled, Cooked Smoked, RTC Breaded, RTE Canned, Stock Base
 * Crustacean: Raw Whole, Raw Tail, Semi-PD, Cooked Boiled, RTC Breaded, RTE Canned, Stock Base, Byproduct Shell
 * Cephalopod: Raw Whole, Raw Tube, Semi-Minced, Cooked Boiled, RTC Breaded, RTE Canned, Stock Base
 * Bivalve: Raw Whole, Semi-Minced, Cooked Boiled, RTE Canned, Stock Base
 * Gastropod: Raw Whole, Cooked Boiled, RTE Canned, Stock Base
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Map of species types to their derivative codes by product category
      const speciesDerivativeMatrix = {
        Fish: {
          Whole: "RAW_WHOLE_ROUND",
          Fillet: "RAW_FILLET",
          Fillets: "RAW_FILLET",
          "Minced Meat": "SEMI_MINCED",
          Minced: "SEMI_MINCED",
          Cooked: "COOKED_BOILED",
          Boiled: "COOKED_BOILED",
          Smoked: "COOKED_SMOKED",
          Breaded: "RTC_BREADED",
          Canned: "RTE_CANNED",
          Stock: "STOCK_BASE",
        },
        Crustacean: {
          Whole: "RAW_WHOLE_ROUND",
          Tail: "RAW_TAIL",
          Peeled: "SEMI_PD",
          "Peeled & Deveined": "SEMI_PD",
          PD: "SEMI_PD",
          Cooked: "COOKED_BOILED",
          Boiled: "COOKED_BOILED",
          Breaded: "RTC_BREADED",
          Canned: "RTE_CANNED",
          Stock: "STOCK_BASE",
          Shell: "BYPRODUCT_SHELL",
        },
        Cephalopod: {
          Whole: "RAW_WHOLE_ROUND",
          Tube: "RAW_TUBE",
          "Minced Meat": "SEMI_MINCED",
          Minced: "SEMI_MINCED",
          Cooked: "COOKED_BOILED",
          Boiled: "COOKED_BOILED",
          Breaded: "RTC_BREADED",
          Canned: "RTE_CANNED",
          Stock: "STOCK_BASE",
        },
        Bivalve: {
          Whole: "RAW_WHOLE_ROUND",
          "Minced Meat": "SEMI_MINCED",
          Minced: "SEMI_MINCED",
          Cooked: "COOKED_BOILED",
          Boiled: "COOKED_BOILED",
          Canned: "RTE_CANNED",
          Stock: "STOCK_BASE",
        },
        Gastropod: {
          Whole: "RAW_WHOLE_ROUND",
          Cooked: "COOKED_BOILED",
          Boiled: "COOKED_BOILED",
          Canned: "RTE_CANNED",
          Stock: "STOCK_BASE",
        },
      };

      // Step 1: Get all products with their species and categories
      const products = await queryInterface.sequelize.query(
        `SELECT pm.id, pm.product_name, sm.species_code, sm.id as species_id, 
                pcm.product_category, pcm.id as category_id, dm.id as derivative_id, dm.derivative_code
         FROM product_master pm
         JOIN product_category_master pcm ON pm.product_category_master_id = pcm.id
         JOIN species_master sm ON pcm.species_master_id = sm.id
         LEFT JOIN derivative_master dm ON pm.derivative_master_id = dm.id
         WHERE pm.is_active = true AND pm.deleted_at IS NULL
         ORDER BY sm.species_code, pcm.product_category`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      console.log(
        `Found ${products.length} active products to map to derivatives`
      );

      // Step 2: Get all derivative masters keyed by derivative_code
      const derivatives = await queryInterface.sequelize.query(
        `SELECT id, derivative_code FROM derivative_master WHERE is_active = true`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      const derivativeMap = {};
      derivatives.forEach((d) => {
        derivativeMap[d.derivative_code] = d.id;
      });

      console.log(
        `Found ${Object.keys(derivativeMap).length} derivatives available`
      );

      // Step 3: Map each product to its derivative
      const updates = [];
      const unmapped = [];

      for (const product of products) {
        // Skip if already mapped
        if (product.derivative_id) {
          console.log(
            `✓ ${product.product_name} already mapped to ${product.derivative_code}`
          );
          continue;
        }

        // Get species type from code
        const speciesType = getSpeciesTypeFromCode(product.species_code);
        const categoryMapping = speciesDerivativeMatrix[speciesType];

        if (!categoryMapping) {
          console.warn(
            `✗ Unknown species type for: ${product.species_code} (${product.product_name})`
          );
          unmapped.push({
            id: product.id,
            name: product.product_name,
            reason: `Unknown species type: ${speciesType}`,
          });
          continue;
        }

        // Find derivative code from category
        const derivativeCode = categoryMapping[product.product_category];

        if (!derivativeCode) {
          console.warn(
            `✗ No mapping for ${speciesType} → ${product.product_category} (${product.product_name})`
          );
          unmapped.push({
            id: product.id,
            name: product.product_name,
            reason: `No derivative mapping for category: ${product.product_category}`,
          });
          continue;
        }

        // Get derivative ID
        const derivativeId = derivativeMap[derivativeCode];

        if (!derivativeId) {
          console.warn(
            `✗ Derivative not found: ${derivativeCode} for ${product.product_name}`
          );
          unmapped.push({
            id: product.id,
            name: product.product_name,
            reason: `Derivative not found: ${derivativeCode}`,
          });
          continue;
        }

        updates.push({
          id: product.id,
          derivativeId,
          derivativeCode,
          productName: product.product_name,
        });

        console.log(
          `→ ${product.product_name}: ${product.product_category} → ${derivativeCode}`
        );
      }

      // Step 4: Execute updates
      console.log(`\nApplying ${updates.length} derivative mappings...`);

      for (const update of updates) {
        await queryInterface.sequelize.query(
          `UPDATE product_master SET derivative_master_id = ? WHERE id = ?`,
          {
            replacements: [update.derivativeId, update.id],
            type: Sequelize.QueryTypes.UPDATE,
          }
        );
      }

      // Step 5: Log unmapped products
      if (unmapped.length > 0) {
        console.log(
          `\n⚠ ${unmapped.length} products could not be automatically mapped:`
        );
        unmapped.forEach((p) => {
          console.log(`  - ${p.name}: ${p.reason}`);
        });
      }

      console.log(
        `\n Successfully mapped ${updates.length} products to derivatives`
      );

      return {
        mapped: updates.length,
        unmapped: unmapped.length,
        details: {
          mapped: updates,
          unmapped: unmapped,
        },
      };
    } catch (error) {
      console.error("Error mapping products to derivatives:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // Clear all derivative_master_id mappings
      await queryInterface.sequelize.query(
        `UPDATE product_master SET derivative_master_id = NULL WHERE derivative_master_id IS NOT NULL`,
        { type: Sequelize.QueryTypes.UPDATE }
      );

      console.log("✅ Cleared all derivative mappings");
    } catch (error) {
      console.error("Error clearing derivative mappings:", error);
      throw error;
    }
  },
};

/**
 * Determine species type from species code
 * Examples: FISH_SALMON, CRUST_LOBSTER, CEPH_SQUID, BIV_OYSTER, GAST_CONCH
 */
function getSpeciesTypeFromCode(speciesCode) {
  if (!speciesCode) return null;

  const code = speciesCode.toUpperCase();

  if (code.includes("FISH") || code.startsWith("F")) {
    return "Fish";
  } else if (code.includes("CRUST") || code.startsWith("C")) {
    return "Crustacean";
  } else if (code.includes("CEPH") || code.startsWith("SQ")) {
    return "Cephalopod";
  } else if (
    code.includes("BIV") ||
    code.includes("SCALLOP") ||
    code.includes("OYSTER")
  ) {
    return "Bivalve";
  } else if (code.includes("GAST") || code.includes("CONCH")) {
    return "Gastropod";
  }

  return null;
}
