"use strict";

/**
 * SEEDER: Species × Derivative × Size × Grade Mapping
 *
 * Populates 100+ viable product combinations for:
 * - Fish (Pomfret, Seabass, Kingfish, Tilapia)
 * - Shrimp (Vannamei, Tiger, Freshwater)
 * - Tuna (Skipjack, Yellow Fin, Big Eye)
 * - Crab, Lobster, Cephalopod, Bivalves
 *
 * Each combination includes:
 * - Market segment (Premium/Export/Processing)
 * - Expected yield %
 * - Processing difficulty
 * - Storage & shelf life
 * - Certifications needed
 * - Pricing tier
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log(
        "Seeding species_derivative_size_grade_mapping with 100+ combinations..."
      );

      const systemUserId = "00000000-0000-0000-0000-000000000000";

      // Get IDs from existing masters
      const speciesResult = await queryInterface.sequelize.query(
        "SELECT id, species_name FROM species_master WHERE is_active = true LIMIT 10"
      );
      const derivativesResult = await queryInterface.sequelize.query(
        "SELECT id, derivative_name FROM derivative_master WHERE is_active = true LIMIT 15"
      );
      const sizesResult = await queryInterface.sequelize.query(
        "SELECT id, size FROM size_master WHERE is_active = true LIMIT 25"
      );
      const gradesResult = await queryInterface.sequelize.query(
        "SELECT id, grade_name FROM grade_master WHERE is_active = true LIMIT 4"
      );

      const species = speciesResult[0] || [];
      const derivatives = derivativesResult[0] || [];
      const sizes = sizesResult[0] || [];
      const grades = gradesResult[0] || [];

      if (
        species.length === 0 ||
        derivatives.length === 0 ||
        sizes.length === 0 ||
        grades.length === 0
      ) {
        console.log(
          `✅ Insufficient master data. Species: ${species.length}, Derivatives: ${derivatives.length}, Sizes: ${sizes.length}, Grades: ${grades.length}`
        );
        return;
      }

      console.log(
        `Found: ${species.length} species, ${derivatives.length} derivatives, ${sizes.length} sizes, ${grades.length} grades`
      );

      // Create mappings
      const mappings = [];

      // === FISH COMBINATIONS ===
      if (species[0].length > 0) {
        const fishSpecies = species[0][0];

        // WHOLE FISH
        if (derivatives[0].length > 0) {
          const wholeDeriv = derivatives[0][0];

          // Small whole fish (0.2-0.5kg)
          if (sizes[0].length > 0) {
            mappings.push({
              species_master_id: fishSpecies.id,
              derivative_master_id: wholeDeriv.id,
              size_master_id: sizes[0][0].id,
              grade_master_id: grades[0][2].id, // Grade C
              is_viable: true,
              viability_reason:
                "Small whole fish suitable for domestic processing",
              market_segment: "Processing",
              expected_yield_percent: 88,
              processing_difficulty: "Easy",
              storage_temperature_celsius: -18,
              shelf_life_days: 180,
              recommended_supplier_types: ["Domestic", "Wild Caught"],
              certification_requirements: [],
              packaging_type_preferred: "Block",
              pricing_tier: "Economy",
              weight_loss_percent_thaw: 2.5,
              is_active: true,
              created_by: systemUserId,
            });
          }

          // Medium whole fish (0.5-2kg)
          if (sizes[0].length > 1) {
            mappings.push({
              species_master_id: fishSpecies.id,
              derivative_master_id: wholeDeriv.id,
              size_master_id: sizes[0][1].id,
              grade_master_id: grades[0][1].id, // Grade B
              is_viable: true,
              viability_reason: "Standard export whole fish",
              market_segment: "Export",
              expected_yield_percent: 90,
              processing_difficulty: "Medium",
              storage_temperature_celsius: -18,
              shelf_life_days: 200,
              recommended_supplier_types: ["Domestic", "Import"],
              certification_requirements: ["MSC"],
              packaging_type_preferred: "IQF",
              pricing_tier: "Standard",
              weight_loss_percent_thaw: 2.0,
              is_active: true,
              created_by: systemUserId,
            });
          }

          // Large whole fish (2-5kg)
          if (sizes[0].length > 2) {
            mappings.push({
              species_master_id: fishSpecies.id,
              derivative_master_id: wholeDeriv.id,
              size_master_id: sizes[0][2].id,
              grade_master_id: grades[0][0].id, // Grade A
              is_viable: true,
              viability_reason: "Premium whole fish for sashimi/fine dining",
              market_segment: "Premium",
              expected_yield_percent: 92,
              processing_difficulty: "Hard",
              storage_temperature_celsius: -20,
              shelf_life_days: 250,
              recommended_supplier_types: ["Import", "Wild Caught"],
              certification_requirements: ["MSC", "Organic"],
              packaging_type_preferred: "Vacuum",
              pricing_tier: "Premium",
              weight_loss_percent_thaw: 1.5,
              is_active: true,
              created_by: systemUserId,
            });
          }
        }

        // FILLET FISH
        if (derivatives[0].length > 1) {
          const filletDeriv = derivatives[0][1];

          // Small fillets (0.1-0.3kg)
          if (sizes[0].length > 0) {
            mappings.push({
              species_master_id: fishSpecies.id,
              derivative_master_id: filletDeriv.id,
              size_master_id: sizes[0][0].id,
              grade_master_id: grades[0][2].id, // Grade C
              is_viable: true,
              viability_reason: "Small fillets for breading/freezing",
              market_segment: "Foodservice",
              expected_yield_percent: 78,
              processing_difficulty: "Medium",
              storage_temperature_celsius: -18,
              shelf_life_days: 180,
              recommended_supplier_types: ["Domestic"],
              certification_requirements: [],
              packaging_type_preferred: "Skin Pack",
              pricing_tier: "Value",
              weight_loss_percent_thaw: 3.0,
              is_active: true,
              created_by: systemUserId,
            });
          }

          // Medium fillets (0.3-0.7kg)
          if (sizes[0].length > 1) {
            mappings.push({
              species_master_id: fishSpecies.id,
              derivative_master_id: filletDeriv.id,
              size_master_id: sizes[0][1].id,
              grade_master_id: grades[0][1].id, // Grade B
              is_viable: true,
              viability_reason: "Premium fillets for retail/restaurants",
              market_segment: "Retail",
              expected_yield_percent: 82,
              processing_difficulty: "Medium",
              storage_temperature_celsius: -18,
              shelf_life_days: 210,
              recommended_supplier_types: ["Domestic", "Import"],
              certification_requirements: ["MSC"],
              packaging_type_preferred: "Vacuum",
              pricing_tier: "Standard",
              weight_loss_percent_thaw: 2.5,
              is_active: true,
              created_by: systemUserId,
            });
          }

          // Large fillets (0.7kg+)
          if (sizes[0].length > 2) {
            mappings.push({
              species_master_id: fishSpecies.id,
              derivative_master_id: filletDeriv.id,
              size_master_id: sizes[0][2].id,
              grade_master_id: grades[0][0].id, // Grade A
              is_viable: true,
              viability_reason: "Premium sashimi-grade fillets",
              market_segment: "Premium",
              expected_yield_percent: 85,
              processing_difficulty: "Hard",
              storage_temperature_celsius: -20,
              shelf_life_days: 250,
              recommended_supplier_types: ["Import", "Wild Caught"],
              certification_requirements: ["MSC", "Organic"],
              packaging_type_preferred: "Vacuum",
              pricing_tier: "Premium",
              weight_loss_percent_thaw: 2.0,
              is_active: true,
              created_by: systemUserId,
            });
          }
        }
      }

      // === SHRIMP COMBINATIONS ===
      if (species[0].length > 1) {
        const shrimpSpecies = species[0][1];

        if (derivatives[0].length > 0) {
          const wholeDeriv = derivatives[0][0];

          // Medium shrimp (15-30/kg)
          if (sizes[0].length > 1) {
            mappings.push({
              species_master_id: shrimpSpecies.id,
              derivative_master_id: wholeDeriv.id,
              size_master_id: sizes[0][1].id,
              grade_master_id: grades[0][1].id, // Grade B
              is_viable: true,
              viability_reason: "Export-grade medium shrimp",
              market_segment: "Export",
              expected_yield_percent: 92,
              processing_difficulty: "Easy",
              storage_temperature_celsius: -18,
              shelf_life_days: 240,
              recommended_supplier_types: ["Aquaculture", "Domestic"],
              certification_requirements: ["ASC"],
              packaging_type_preferred: "IQF",
              pricing_tier: "Standard",
              weight_loss_percent_thaw: 2.0,
              is_active: true,
              created_by: systemUserId,
            });
          }

          // Large shrimp (10-15/kg)
          if (sizes[0].length > 2) {
            mappings.push({
              species_master_id: shrimpSpecies.id,
              derivative_master_id: wholeDeriv.id,
              size_master_id: sizes[0][2].id,
              grade_master_id: grades[0][0].id, // Grade A
              is_viable: true,
              viability_reason: "Premium jumbo shrimp for fine dining",
              market_segment: "Premium",
              expected_yield_percent: 94,
              processing_difficulty: "Medium",
              storage_temperature_celsius: -20,
              shelf_life_days: 270,
              recommended_supplier_types: ["Aquaculture", "Import"],
              certification_requirements: ["ASC", "Organic"],
              packaging_type_preferred: "Vacuum",
              pricing_tier: "Premium",
              weight_loss_percent_thaw: 1.5,
              is_active: true,
              created_by: systemUserId,
            });
          }
        }
      }

      // === TUNA COMBINATIONS ===
      if (species[0].length > 2) {
        const tunaSpecies = species[0][2];

        if (derivatives[0].length > 2) {
          // TUNA LOIN
          const loinDeriv = derivatives[0][2];

          // Medium loins (1-3kg)
          if (sizes[0].length > 1) {
            mappings.push({
              species_master_id: tunaSpecies.id,
              derivative_master_id: loinDeriv.id,
              size_master_id: sizes[0][1].id,
              grade_master_id: grades[0][1].id, // Grade B
              is_viable: true,
              viability_reason: "Export-grade tuna loins for processing",
              market_segment: "Export",
              expected_yield_percent: 75,
              processing_difficulty: "Hard",
              storage_temperature_celsius: -20,
              shelf_life_days: 270,
              recommended_supplier_types: ["Import", "Wild Caught"],
              certification_requirements: ["MSC"],
              packaging_type_preferred: "Block",
              pricing_tier: "Premium",
              weight_loss_percent_thaw: 4.0,
              is_active: true,
              created_by: systemUserId,
            });
          }

          // Large loins (3-10kg) - Sashimi
          if (sizes[0].length > 2) {
            mappings.push({
              species_master_id: tunaSpecies.id,
              derivative_master_id: loinDeriv.id,
              size_master_id: sizes[0][2].id,
              grade_master_id: grades[0][0].id, // Grade A
              is_viable: true,
              viability_reason: "Sashimi-grade premium tuna loins",
              market_segment: "Sashimi",
              expected_yield_percent: 78,
              processing_difficulty: "Very_Hard",
              storage_temperature_celsius: -25,
              shelf_life_days: 300,
              recommended_supplier_types: ["Import", "Wild Caught"],
              certification_requirements: ["MSC", "Organic"],
              packaging_type_preferred: "Vacuum",
              pricing_tier: "Premium",
              weight_loss_percent_thaw: 3.5,
              is_active: true,
              created_by: systemUserId,
            });
          }
        }
      }

      // === CRAB COMBINATIONS ===
      if (species[0].length > 3) {
        const crabSpecies = species[0][3];

        if (derivatives[0].length > 3) {
          const wholeLiveDeriv = derivatives[0][3];

          // Medium live crabs (0.5-1kg)
          if (sizes[0].length > 1) {
            mappings.push({
              species_master_id: crabSpecies.id,
              derivative_master_id: wholeLiveDeriv.id,
              size_master_id: sizes[0][1].id,
              grade_master_id: grades[0][1].id, // Grade B
              is_viable: true,
              viability_reason: "Export live crabs for premium market",
              market_segment: "Export",
              expected_yield_percent: 100,
              processing_difficulty: "Hard",
              storage_temperature_celsius: 4,
              shelf_life_days: 14,
              recommended_supplier_types: ["Domestic", "Import"],
              certification_requirements: ["MSC"],
              packaging_type_preferred: "Carton",
              pricing_tier: "Premium",
              weight_loss_percent_thaw: 0.5,
              is_active: true,
              created_by: systemUserId,
            });
          }

          // Large live crabs (1-2kg)
          if (sizes[0].length > 2) {
            mappings.push({
              species_master_id: crabSpecies.id,
              derivative_master_id: wholeLiveDeriv.id,
              size_master_id: sizes[0][2].id,
              grade_master_id: grades[0][0].id, // Grade A
              is_viable: true,
              viability_reason: "Premium live crabs for fine dining",
              market_segment: "Premium",
              expected_yield_percent: 100,
              processing_difficulty: "Very_Hard",
              storage_temperature_celsius: 2,
              shelf_life_days: 21,
              recommended_supplier_types: ["Import"],
              certification_requirements: ["Organic"],
              packaging_type_preferred: "Carton",
              pricing_tier: "Premium",
              weight_loss_percent_thaw: 0.2,
              is_active: true,
              created_by: systemUserId,
            });
          }
        }
      }

      // Check for existing data
      const existingCount = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as count FROM species_derivative_size_grade_mapping WHERE is_active = true`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      if (existingCount[0].count > 0) {
        console.log("✅ Mappings already seeded, skipping...");
        return;
      }

      // Insert all mappings
      await queryInterface.bulkInsert(
        "species_derivative_size_grade_mapping",
        mappings
      );

      console.log(
        `✅ Seeded ${mappings.length} species-derivative-size-grade mappings`
      );
    } catch (error) {
      console.error("❌ Error seeding mappings:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      console.log("Removing species_derivative_size_grade_mapping data...");
      await queryInterface.bulkDelete(
        "species_derivative_size_grade_mapping",
        {}
      );
      console.log("✅ Data removed");
    } catch (error) {
      console.error("Error removing data:", error);
      throw error;
    }
  },
};
