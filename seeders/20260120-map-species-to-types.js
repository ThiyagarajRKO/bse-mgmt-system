"use strict";

const { v4: uuidv4 } = require("uuid");

/**
 * Seeder: Map all 123 species to species types in the derivative matrix
 *
 * This seeder creates species_species_type_mapping records that link each species
 * to the appropriate species type (FINFISH, CRUSTACEAN_SHRIMP, CRUSTACEAN_CRAB, etc.)
 *
 * This enables:
 * - Products from any species to access allowed derivatives
 * - Validation of species-derivative combinations
 * - API endpoints to suggest allowed derivatives by species
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log("\n📊 Creating species-to-species-type mappings...\n");

      // Classification rules based on species names
      const classificationRules = [
        {
          type: "CRUSTACEAN_SHRIMP",
          patterns: [/shrimp/i, /prawn/i],
          description: "Shrimp/Prawn",
        },
        {
          type: "CRUSTACEAN_CRAB",
          patterns: [/crab/i],
          description: "Crab",
        },
        {
          type: "CRUSTACEAN_LOBSTER",
          patterns: [/lobster/i],
          description: "Lobster",
        },
        {
          type: "CEPHALOPOD",
          patterns: [/squid/i, /cuttlefish/i, /octopus/i],
          description: "Squid/Cuttlefish/Octopus",
        },
        {
          type: "BIVALVE",
          patterns: [/clam/i, /mussel/i, /oyster/i, /scallop/i],
          description: "Clam/Mussel/Oyster/Scallop",
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
          description: "Conch/Whelk/Snail/Abalone",
        },
      ];

      // Get all active species
      const species = await queryInterface.sequelize.query(
        "SELECT id, species_code, species_name FROM species_master WHERE is_active = true ORDER BY species_name",
        { type: Sequelize.QueryTypes.SELECT },
      );

      console.log(`Found ${species.length} active species to classify\n`);

      // Classify each species
      const rows = [];
      const stats = {
        total: 0,
        finfish: 0,
        crustacean_shrimp: 0,
        crustacean_crab: 0,
        crustacean_lobster: 0,
        cephalopod: 0,
        bivalve: 0,
        gastropod: 0,
      };

      species.forEach((s) => {
        let type = "FINFISH"; // Default
        let description = "Fish";

        // Check classification rules
        for (const rule of classificationRules) {
          const matches = rule.patterns.some((pattern) =>
            pattern.test(s.species_name),
          );
          if (matches) {
            type = rule.type;
            description = rule.description;
            break;
          }
        }

        rows.push({
          id: uuidv4(),
          species_id: s.id,
          species_code: s.species_code,
          species_name: s.species_name,
          species_type: type,
          species_type_description: description,
          created_at: new Date(),
          updated_at: new Date(),
        });

        stats[type.toLowerCase()] = (stats[type.toLowerCase()] || 0) + 1;
        stats.total++;

        // Log classification
        console.log(
          `  ${s.species_code.padEnd(10)} | ${s.species_name.padEnd(40)} → ${type}`,
        );
      });

      // Create table if it doesn't exist
      const tableExists = await queryInterface.sequelize.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'species_species_type_mapping'
        )`,
        { type: Sequelize.QueryTypes.SELECT },
      );

      if (!tableExists[0].exists) {
        console.log("\n📋 Creating species_species_type_mapping table...\n");

        await queryInterface.createTable("species_species_type_mapping", {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
            allowNull: false,
          },
          species_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: "species_master",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
          },
          species_code: {
            type: Sequelize.STRING(50),
            allowNull: false,
          },
          species_name: {
            type: Sequelize.STRING(255),
            allowNull: false,
          },
          species_type: {
            type: Sequelize.STRING(50),
            allowNull: false,
            comment:
              "Species type key (FINFISH, CRUSTACEAN_SHRIMP, CRUSTACEAN_CRAB, etc.)",
          },
          species_type_description: {
            type: Sequelize.STRING(255),
            allowNull: true,
            comment: "Human-readable species type description",
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
          },
        });

        // Add indexes
        await queryInterface.addIndex("species_species_type_mapping", [
          "species_id",
        ]);
        await queryInterface.addIndex("species_species_type_mapping", [
          "species_type",
        ]);
        await queryInterface.addIndex("species_species_type_mapping", [
          "species_code",
        ]);
      }

      // Bulk insert
      if (rows.length > 0) {
        await queryInterface.bulkInsert(
          "species_species_type_mapping",
          rows,
          {},
        );
        console.log(`\n✅ Inserted ${rows.length} species type mappings\n`);
      }

      // Display summary
      console.log("═".repeat(80));
      console.log("SPECIES TYPE MAPPING SUMMARY");
      console.log("═".repeat(80));
      console.log(`\n✅ FINFISH                : ${stats.finfish} species`);
      console.log(`✅ CEPHALOPOD             : ${stats.cephalopod} species`);
      console.log(
        `✅ CRUSTACEAN_CRAB        : ${stats.crustacean_crab} species`,
      );
      console.log(`✅ BIVALVE                : ${stats.bivalve} species`);
      console.log(`✅ GASTROPOD              : ${stats.gastropod} species`);
      console.log(
        `✅ CRUSTACEAN_LOBSTER     : ${stats.crustacean_lobster} species`,
      );
      console.log(
        `✅ CRUSTACEAN_SHRIMP      : ${stats.crustacean_shrimp} species`,
      );
      console.log(`\n✅ TOTAL: ${stats.total}/123 species mapped\n`);
      console.log("═".repeat(80) + "\n");
    } catch (error) {
      console.error("❌ Error seeding species type mappings:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      console.log("\n🔄 Reverting species type mappings...\n");

      // Check if table exists before trying to drop/delete
      const tableExists = await queryInterface.sequelize.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'species_species_type_mapping'
        )`,
        { type: Sequelize.QueryTypes.SELECT },
      );

      if (tableExists[0].exists) {
        await queryInterface.bulkDelete(
          "species_species_type_mapping",
          null,
          {},
        );
        console.log("✅ All species type mappings deleted\n");
      }
    } catch (error) {
      console.error("❌ Error reverting seeding:", error);
      throw error;
    }
  },
};
