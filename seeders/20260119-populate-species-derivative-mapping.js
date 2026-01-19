"use strict";

const { v4: uuidv4 } = require("uuid");
const speciesDerivativeMatrix = require("../config/species-derivative-matrix");

/**
 * Seeder: Populate species_derivative_mapping table
 *
 * Seeds the database with allowed and blocked derivatives for each species type
 * based on the species-derivative-matrix configuration.
 *
 * This enables:
 * - Database-level validation of species-derivative combinations
 * - API endpoints to query allowed derivatives by species
 * - Product master validation during creation/update
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log("\n📊 Seeding species_derivative_mapping...\n");

      // Get all derivatives from database
      const derivatives = await queryInterface.sequelize.query(
        "SELECT id, derivative_code FROM derivative_master WHERE is_active = true",
        { type: Sequelize.QueryTypes.SELECT },
      );

      const derivativeMap = {};
      derivatives.forEach((d) => {
        derivativeMap[d.derivative_code] = d.id;
      });

      console.log(
        `Found ${Object.keys(derivativeMap).length} active derivatives`,
      );

      // Prepare rows for bulk insert
      const rows = [];
      const stats = {
        total: 0,
        allowed: 0,
        blocked: 0,
        skipped: 0,
      };

      // Process each species type from the matrix
      Object.entries(speciesDerivativeMatrix).forEach(
        ([speciesType, config]) => {
          // Skip non-species entries (like the helper function)
          if (typeof config !== "object" || !config.description) {
            return;
          }

          // Process allowed derivatives
          if (
            config.allowed_derivatives &&
            Array.isArray(config.allowed_derivatives)
          ) {
            config.allowed_derivatives.forEach((derivativeCode) => {
              const derivativeId = derivativeMap[derivativeCode];

              if (!derivativeId) {
                console.warn(
                  `⚠️  Skipping: Derivative ${derivativeCode} not found in database`,
                );
                stats.skipped++;
                return;
              }

              rows.push({
                id: uuidv4(),
                species_type: speciesType,
                species_description: config.description,
                derivative_id: derivativeId,
                is_allowed: true,
                reason: null,
                created_at: new Date(),
                updated_at: new Date(),
              });

              stats.allowed++;
              stats.total++;
            });
          }

          // Process blocked derivatives
          if (
            config.blocked_derivatives &&
            Array.isArray(config.blocked_derivatives)
          ) {
            config.blocked_derivatives.forEach((derivativeCode) => {
              const derivativeId = derivativeMap[derivativeCode];

              if (!derivativeId) {
                console.warn(
                  `⚠️  Skipping: Derivative ${derivativeCode} not found in database`,
                );
                stats.skipped++;
                return;
              }

              // Determine reason for blocking
              let reason = null;
              if (speciesType === "CRUSTACEAN_SHRIMP") {
                if (derivativeCode === "PRC_CLAWS_KNUCKLES") {
                  reason = "Claws/Knuckles are for crabs and lobsters only";
                } else if (derivativeCode === "CKD_CRAB_MEAT") {
                  reason = "Crab meat is crab-specific";
                } else if (derivativeCode === "CKD_LOBSTER_MEAT") {
                  reason = "Lobster meat is lobster-specific";
                }
              } else if (speciesType === "CRUSTACEAN_CRAB") {
                if (
                  derivativeCode === "PRC_EZPEEL" ||
                  derivativeCode === "PRC_PUD" ||
                  derivativeCode === "PRC_PD" ||
                  derivativeCode === "PRC_PTO"
                ) {
                  reason = "Peeling methods are for shrimp only";
                } else if (derivativeCode === "PRC_TAILS") {
                  reason = "Shrimp/Lobster tails, not applicable to crabs";
                } else if (derivativeCode === "CKD_SHRIMP_BOILED") {
                  reason = "Shrimp-specific product";
                } else if (derivativeCode === "CKD_LOBSTER_MEAT") {
                  reason = "Lobster-specific product";
                }
              } else if (speciesType === "CRUSTACEAN_LOBSTER") {
                if (
                  derivativeCode === "PRC_EZPEEL" ||
                  derivativeCode === "PRC_PUD" ||
                  derivativeCode === "PRC_PD" ||
                  derivativeCode === "PRC_PTO"
                ) {
                  reason = "Peeling methods are for shrimp only";
                } else if (derivativeCode === "CKD_SHRIMP_BOILED") {
                  reason = "Shrimp-specific product";
                } else if (derivativeCode === "CKD_CRAB_MEAT") {
                  reason = "Crab-specific product";
                }
              }

              rows.push({
                id: uuidv4(),
                species_type: speciesType,
                species_description: config.description,
                derivative_id: derivativeId,
                is_allowed: false,
                reason: reason,
                created_at: new Date(),
                updated_at: new Date(),
              });

              stats.blocked++;
              stats.total++;
            });
          }
        },
      );

      // Bulk insert all rows
      if (rows.length > 0) {
        await queryInterface.bulkInsert("species_derivative_mapping", rows, {});
        console.log(`✅ Inserted ${rows.length} species-derivative mappings`);
      }

      console.log("\n📊 Seeding Summary:");
      console.log(`  Total mappings: ${stats.total}`);
      console.log(`  Allowed: ${stats.allowed}`);
      console.log(`  Blocked: ${stats.blocked}`);
      console.log(`  Skipped: ${stats.skipped}\n`);
    } catch (error) {
      console.error("❌ Error seeding species_derivative_mapping:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      console.log("\n🔄 Reverting species_derivative_mapping seeding...\n");
      await queryInterface.bulkDelete("species_derivative_mapping", null, {});
      console.log("✅ All species_derivative_mapping records deleted\n");
    } catch (error) {
      console.error("❌ Error reverting seeding:", error);
      throw error;
    }
  },
};
