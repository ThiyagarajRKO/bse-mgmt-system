#!/usr/bin/env node

/**
 * Species Type Classification Script
 *
 * Maps all 123 species in the database to appropriate species types in the matrix.
 * This allows products from any species to use the correct derivative validation.
 */

const sequelize = require("../models").sequelize;

async function classifyAllSpecies() {
  try {
    console.log("\n" + "═".repeat(100));
    console.log("SPECIES TYPE CLASSIFICATION - All 123 Species");
    console.log("═".repeat(100) + "\n");

    // Get all active species
    const species = await sequelize.query(
      `SELECT id, species_code, species_name FROM species_master WHERE is_active = true ORDER BY species_name`,
      { type: sequelize.QueryTypes.SELECT },
    );

    console.log(`Found ${species.length} active species\n`);

    // Classification rules
    const classificationRules = [
      {
        type: "CRUSTACEAN_SHRIMP",
        patterns: [/shrimp/i, /prawn/i],
      },
      {
        type: "CRUSTACEAN_CRAB",
        patterns: [/crab/i],
      },
      {
        type: "CRUSTACEAN_LOBSTER",
        patterns: [/lobster/i],
      },
      {
        type: "CEPHALOPOD",
        patterns: [/squid/i, /cuttlefish/i, /octopus/i],
      },
      {
        type: "BIVALVE",
        patterns: [/clam/i, /mussel/i, /oyster/i, /scallop/i],
      },
      {
        type: "GASTROPOD",
        patterns: [
          /conch/i,
          /whelk/i,
          /snail/i,
          /abalone/i,
          /turban/i,
          /babylon/i,
        ],
      },
    ];

    // Classify species
    const classified = {};
    species.forEach((s) => {
      let type = "FINFISH"; // Default

      for (const rule of classificationRules) {
        const matches = rule.patterns.some((pattern) =>
          pattern.test(s.species_name),
        );
        if (matches) {
          type = rule.type;
          break;
        }
      }

      if (!classified[type]) {
        classified[type] = [];
      }
      classified[type].push(s);
    });

    // Display results
    Object.entries(classified)
      .sort((a, b) => b[1].length - a[1].length)
      .forEach(([type, species]) => {
        console.log(`\n📊 ${type} (${species.length} species):`);
        console.log("  " + "─".repeat(90));
        species.forEach((s) => {
          console.log(
            `  ${s.species_code.padEnd(10)} | ${s.species_name.padEnd(45)}`,
          );
        });
      });

    console.log("\n" + "═".repeat(100));
    console.log("SUMMARY");
    console.log("═".repeat(100) + "\n");

    let totalCovered = 0;
    Object.entries(classified)
      .sort((a, b) => b[1].length - a[1].length)
      .forEach(([type, speciesList]) => {
        console.log(`✅ ${type.padEnd(25)} : ${speciesList.length} species`);
        totalCovered += speciesList.length;
      });

    console.log(
      `\n✅ TOTAL SPECIES COVERED: ${totalCovered}/${species.length}\n`,
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

classifyAllSpecies();
