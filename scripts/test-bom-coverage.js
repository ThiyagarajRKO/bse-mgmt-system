#!/usr/bin/env node

/**
 * BOM Coverage Test Script
 *
 * Verifies that all finished products have corresponding BOM entries
 * and identifies any products missing raw material mappings
 */

const path = require("path");
require("@babel/register")({
  presets: ["@babel/preset-env"],
  ignore: [/node_modules/],
});

const models = require("../models");
const { Op } = require("sequelize");

async function testBOMCoverage() {
  console.log("\n");
  console.log(
    "═══════════════════════════════════════════════════════════════",
  );
  console.log("🧪 BOM COVERAGE TEST");
  console.log(
    "═══════════════════════════════════════════════════════════════\n",
  );

  try {
    // Step 1: Get all finished products
    console.log("Step 1️⃣  Loading finished products...");
    const finishedProducts = await models.ProductMaster.findAll({
      where: {
        is_active: true,
        processing_state: "PROCESSED",
        is_raw: false,
      },
      include: [
        {
          model: models.SpeciesMaster,
          as: "SpeciesMaster",
          attributes: ["id", "species_name"],
        },
        {
          model: models.ProductCategoryMaster,
          as: "ProductCategoryMaster",
          attributes: ["id", "product_category"],
        },
      ],
      raw: false,
    });

    console.log(`  ✅ Found ${finishedProducts.length} finished products\n`);

    // Step 2: Get all BOM entries
    console.log("Step 2️⃣  Loading BOM entries...");
    const bomEntries = await models.BillOfMaterials.findAll({
      where: { is_active: true },
      attributes: ["id", "product_master_id", "procurement_product_id"],
      raw: true,
    });

    console.log(`  ✅ Found ${bomEntries.length} BOM entries\n`);

    // Step 3: Analyze coverage
    console.log("Step 3️⃣  Analyzing BOM coverage...");
    const bomMap = new Map();
    const withProcurement = new Set();
    const withoutProcurement = new Set();

    for (const bom of bomEntries) {
      bomMap.set(bom.product_master_id, bom.id);
      if (bom.procurement_product_id) {
        withProcurement.add(bom.product_master_id);
      } else {
        withoutProcurement.add(bom.product_master_id);
      }
    }

    // Step 4: Identify gaps
    console.log("Step 4️⃣  Identifying coverage gaps...");
    const coverageBySpecies = new Map();
    const gapsBySpecies = new Map();
    let totalCovered = 0;
    let totalGaps = 0;

    for (const product of finishedProducts) {
      const speciesId = product.SpeciesMaster?.id || "UNKNOWN";
      const speciesName = product.SpeciesMaster?.species_name || "UNKNOWN";

      if (!coverageBySpecies.has(speciesId)) {
        coverageBySpecies.set(speciesId, {
          species_name: speciesName,
          total: 0,
          covered: 0,
          gaps: [],
        });
      }

      const stats = coverageBySpecies.get(speciesId);
      stats.total++;

      if (bomMap.has(product.id)) {
        stats.covered++;
        totalCovered++;
      } else {
        stats.gaps.push({
          id: product.id,
          name: product.product_name,
          category: product.ProductCategoryMaster?.product_category || "N/A",
        });
        totalGaps++;
      }
    }

    console.log(`  ✅ Analysis complete\n`);

    // Step 5: Generate coverage report
    console.log("Step 5️⃣  Generating coverage report...");
    console.log("\n📊 COVERAGE SUMMARY:");
    console.log(
      "─────────────────────────────────────────────────────────────",
    );
    console.log(`Total Finished Products: ${finishedProducts.length}`);
    console.log(
      `Covered by BOM:          ${totalCovered} (${((totalCovered / finishedProducts.length) * 100).toFixed(1)}%)`,
    );
    console.log(
      `Coverage Gaps:           ${totalGaps} (${((totalGaps / finishedProducts.length) * 100).toFixed(1)}%)`,
    );
    console.log(`With Procurement Link:   ${withProcurement.size}`);
    console.log(`Without Procurement:     ${withoutProcurement.size}`);
    console.log(
      "─────────────────────────────────────────────────────────────\n",
    );

    // Step 6: Detailed species breakdown
    console.log("📋 SPECIES BREAKDOWN:");
    console.log(
      "─────────────────────────────────────────────────────────────",
    );

    const sortedSpecies = Array.from(coverageBySpecies.values()).sort(
      (a, b) => b.total - a.total,
    );

    for (const species of sortedSpecies) {
      const coveragePercent = ((species.covered / species.total) * 100).toFixed(
        1,
      );
      const status = species.covered === species.total ? "✅" : "❌";

      console.log(
        `${status} ${species.species_name}: ${species.covered}/${species.total} (${coveragePercent}%)`,
      );

      // Show gaps if any
      if (species.gaps.length > 0 && species.gaps.length <= 5) {
        for (const gap of species.gaps) {
          console.log(`   • ${gap.name} [${gap.category}]`);
        }
      } else if (species.gaps.length > 5) {
        console.log(`   • ... and ${species.gaps.length} more products`);
      }
    }

    console.log(
      "─────────────────────────────────────────────────────────────\n",
    );

    // Step 7: Recommendations
    console.log("💡 RECOMMENDATIONS:");
    console.log(
      "─────────────────────────────────────────────────────────────",
    );

    if (totalCovered === finishedProducts.length) {
      console.log("✅ Excellent! All finished products have BOM coverage.");
    } else if (totalCovered / finishedProducts.length >= 0.95) {
      console.log("✅ Great! Coverage is 95%+. Only minor gaps remain.");
      console.log(`   Create BOM entries for ${totalGaps} remaining products.`);
    } else if (totalCovered / finishedProducts.length >= 0.8) {
      console.log(
        "⚠️  Good coverage (80%+), but ${totalGaps} products still need BOM entries.",
      );
    } else {
      console.log(
        `❌ Low coverage (${((totalCovered / finishedProducts.length) * 100).toFixed(1)}%)`,
      );
      console.log(`   ${totalGaps} products need BOM mapping urgently.`);
    }

    if (withoutProcurement.size > 0) {
      console.log(
        `\n📌 ${withoutProcurement.size} BOM entries are missing procurement product links.`,
      );
      console.log("   Run procurement product mapping to link them.");
    }

    console.log(
      "─────────────────────────────────────────────────────────────\n",
    );

    // Step 8: Export gap details if needed
    if (totalGaps > 0) {
      console.log("📄 PRODUCTS WITHOUT BOM COVERAGE:");
      console.log(
        "─────────────────────────────────────────────────────────────",
      );

      let gapCount = 0;
      for (const species of sortedSpecies) {
        if (species.gaps.length > 0) {
          console.log(`\n${species.species_name}:`);
          for (const gap of species.gaps) {
            gapCount++;
            console.log(
              `  ${gapCount}. ${gap.name} (${gap.category}) [ID: ${gap.id}]`,
            );
          }
        }
      }
      console.log(
        "─────────────────────────────────────────────────────────────\n",
      );
    }

    // Final summary
    console.log(
      "═══════════════════════════════════════════════════════════════",
    );
    if (totalCovered === finishedProducts.length) {
      console.log("✅ TEST RESULT: PASSED - All products covered!");
    } else {
      console.log(`⚠️  TEST RESULT: ${totalGaps} products need BOM entries`);
    }
    console.log(
      "═══════════════════════════════════════════════════════════════\n",
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error during BOM coverage test:", error);
    process.exit(1);
  }
}

// Run the test
testBOMCoverage();
