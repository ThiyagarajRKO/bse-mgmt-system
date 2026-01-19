"use strict";
const { v4: uuidv4 } = require("uuid");

/**
 * Populate Species-Derivative-Size-Grade Mapping
 *
 * Creates valid combinations for all species based on:
 * 1. Species type → Allowed derivatives (from species_derivative_mapping)
 * 2. Derivative → Allowed sizes (from derivative_size_matrix)
 * 3. Derivative + Grade + Size rules (from grade_size_compatibility_rule)
 *
 * This creates the complete 4-dimensional mapping: Species × Derivative × Size × Grade
 */

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    console.log("\n📊 Populating species_derivative_size_grade_mapping...\n");

    // Fetch all required data
    const species = await queryInterface.sequelize.query(
      `SELECT s.id, s.species_code, sstm.species_type
       FROM species_master s
       LEFT JOIN species_species_type_mapping sstm ON s.id = sstm.species_id
       WHERE s.is_active = true`,
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );

    const derivatives = await queryInterface.sequelize.query(
      `SELECT id, derivative_code, processing_type FROM derivative_master WHERE is_active = true`,
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );

    const sizes = await queryInterface.sequelize.query(
      `SELECT id, size, size_category FROM size_master WHERE is_active = true`,
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );

    const grades = await queryInterface.sequelize.query(
      `SELECT id, grade_code FROM grade_master WHERE is_active = true`,
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );

    // Get allowed derivatives per species type
    const speciesDerivativeAllowed = await queryInterface.sequelize.query(
      `SELECT sdm.species_type, d.id as derivative_id
       FROM species_derivative_mapping sdm
       JOIN derivative_master d ON sdm.derivative_id = d.id
       WHERE sdm.is_allowed = true`,
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );

    // Get system user for audit trail
    const adminUser = await queryInterface.sequelize.query(
      `SELECT id FROM user_profiles LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );

    const systemUserId = adminUser[0]?.id || uuidv4();

    // Create lookup maps
    const speciesById = {};
    const derivativeById = {};
    const sizeById = {};
    const gradeById = {};
    const allowedDerivBySpeciesType = {};

    for (const s of species) speciesById[s.id] = s;
    for (const d of derivatives) derivativeById[d.id] = d;
    for (const sz of sizes) sizeById[sz.id] = sz;
    for (const g of grades) gradeById[g.id] = g;

    console.log(`\nLoaded data:`);
    console.log(`  - ${Object.keys(speciesById).length} species`);
    console.log(`  - ${Object.keys(derivativeById).length} derivatives`);
    console.log(`  - ${Object.keys(sizeById).length} sizes`);
    console.log(`  - ${Object.keys(gradeById).length} grades`);

    // Build allowed derivatives per species type
    for (const mapping of speciesDerivativeAllowed) {
      const speciesType = mapping.species_type;
      if (!allowedDerivBySpeciesType[speciesType]) {
        allowedDerivBySpeciesType[speciesType] = [];
      }
      allowedDerivBySpeciesType[speciesType].push(mapping.derivative_id);
    }

    console.log("\n✓ Allowed derivatives by species type:");
    for (const [speciesType, derivIds] of Object.entries(
      allowedDerivBySpeciesType,
    )) {
      console.log(
        `  ${speciesType}: ${derivIds.length} derivatives (first 3: ${derivIds.slice(0, 3).join(", ")})`,
      );
    }

    // Get compatibility rules for size/grade combinations
    const compatRules = await queryInterface.sequelize.query(
      `SELECT species_type, product_form, min_size, max_size, unit, 
              grade_a, grade_b, grade_c, grade_d, is_blocked
       FROM grade_size_compatibility_rule 
       WHERE is_active = true AND is_blocked = false`,
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );

    // Map compatibility rules by species type and product form
    const ruleMap = {};
    for (const rule of compatRules) {
      const key = `${rule.species_type}|${rule.product_form}`;
      if (!ruleMap[key]) ruleMap[key] = [];
      ruleMap[key].push(rule);
    }

    // Define market segments and operational parameters by derivative
    const derivativeConfig = {
      UNP_WHOLE_ROUND: {
        market_segment: "Export",
        pricing_tier: "Standard",
        processing_difficulty: "Easy",
        expected_yield_percent: 100,
        storage_temperature: -18,
        shelf_life_days: 180,
      },
      UNP_INSHELL: {
        market_segment: "Export",
        pricing_tier: "Standard",
        processing_difficulty: "Easy",
        expected_yield_percent: 100,
        storage_temperature: -18,
        shelf_life_days: 180,
      },
      UNP_HEADON_SHELLON: {
        market_segment: "Export",
        pricing_tier: "Standard",
        processing_difficulty: "Easy",
        expected_yield_percent: 100,
        storage_temperature: -18,
        shelf_life_days: 180,
      },
      PRC_GUTTED: {
        market_segment: "Export",
        pricing_tier: "Standard",
        processing_difficulty: "Medium",
        expected_yield_percent: 80,
        storage_temperature: -18,
        shelf_life_days: 180,
      },
      PRC_GG: {
        market_segment: "Export",
        pricing_tier: "Standard",
        processing_difficulty: "Medium",
        expected_yield_percent: 75,
        storage_temperature: -18,
        shelf_life_days: 180,
      },
      PRC_HEADED: {
        market_segment: "Export",
        pricing_tier: "Standard",
        processing_difficulty: "Medium",
        expected_yield_percent: 75,
        storage_temperature: -18,
        shelf_life_days: 180,
      },
      PRC_HG: {
        market_segment: "Export",
        pricing_tier: "Standard",
        processing_difficulty: "Medium",
        expected_yield_percent: 70,
        storage_temperature: -18,
        shelf_life_days: 180,
      },
      PRC_DRESSED: {
        market_segment: "Retail",
        pricing_tier: "Standard",
        processing_difficulty: "Medium",
        expected_yield_percent: 70,
        storage_temperature: -18,
        shelf_life_days: 180,
      },
      PRC_FILLET_SKINON: {
        market_segment: "Fine_Dining",
        pricing_tier: "Premium",
        processing_difficulty: "Hard",
        expected_yield_percent: 60,
        storage_temperature: -20,
        shelf_life_days: 120,
      },
      PRC_FILLET_SKINLESS: {
        market_segment: "Fine_Dining",
        pricing_tier: "Premium",
        processing_difficulty: "Hard",
        expected_yield_percent: 55,
        storage_temperature: -20,
        shelf_life_days: 120,
      },
      PRC_LOIN: {
        market_segment: "Sashimi",
        pricing_tier: "Premium",
        processing_difficulty: "Very_Hard",
        expected_yield_percent: 50,
        storage_temperature: -20,
        shelf_life_days: 90,
      },
      PRC_PORTION: {
        market_segment: "Foodservice",
        pricing_tier: "Standard",
        processing_difficulty: "Medium",
        expected_yield_percent: 65,
        storage_temperature: -18,
        shelf_life_days: 120,
      },
      PRC_STEAKS_SLICES: {
        market_segment: "Foodservice",
        pricing_tier: "Standard",
        processing_difficulty: "Medium",
        expected_yield_percent: 65,
        storage_temperature: -18,
        shelf_life_days: 120,
      },
      PRC_HEADLESS: {
        market_segment: "Export",
        pricing_tier: "Standard",
        processing_difficulty: "Medium",
        expected_yield_percent: 85,
        storage_temperature: -18,
        shelf_life_days: 180,
      },
      PRC_TAILS: {
        market_segment: "Foodservice",
        pricing_tier: "Standard",
        processing_difficulty: "Easy",
        expected_yield_percent: 90,
        storage_temperature: -18,
        shelf_life_days: 180,
      },
      PRC_PD: {
        market_segment: "Retail",
        pricing_tier: "Standard",
        processing_difficulty: "Hard",
        expected_yield_percent: 75,
        storage_temperature: -18,
        shelf_life_days: 150,
      },
      PRC_PUD: {
        market_segment: "Foodservice",
        pricing_tier: "Value",
        processing_difficulty: "Medium",
        expected_yield_percent: 80,
        storage_temperature: -18,
        shelf_life_days: 150,
      },
      PRC_PTO: {
        market_segment: "Retail",
        pricing_tier: "Standard",
        processing_difficulty: "Hard",
        expected_yield_percent: 78,
        storage_temperature: -18,
        shelf_life_days: 150,
      },
      PRC_EZPEEL: {
        market_segment: "Retail",
        pricing_tier: "Premium",
        processing_difficulty: "Hard",
        expected_yield_percent: 72,
        storage_temperature: -18,
        shelf_life_days: 150,
      },
      PRC_CLAWS_KNUCKLES: {
        market_segment: "Fine_Dining",
        pricing_tier: "Premium",
        processing_difficulty: "Medium",
        expected_yield_percent: 90,
        storage_temperature: -18,
        shelf_life_days: 180,
      },
      PRC_TUBES: {
        market_segment: "Export",
        pricing_tier: "Standard",
        processing_difficulty: "Medium",
        expected_yield_percent: 85,
        storage_temperature: -18,
        shelf_life_days: 180,
      },
      PRC_TENTACLES: {
        market_segment: "Foodservice",
        pricing_tier: "Standard",
        processing_difficulty: "Medium",
        expected_yield_percent: 88,
        storage_temperature: -18,
        shelf_life_days: 180,
      },
      PRC_RINGS: {
        market_segment: "Foodservice",
        pricing_tier: "Value",
        processing_difficulty: "Easy",
        expected_yield_percent: 95,
        storage_temperature: -18,
        shelf_life_days: 180,
      },
      PRC_SHUCKED_MEAT: {
        market_segment: "Processing",
        pricing_tier: "Standard",
        processing_difficulty: "Hard",
        expected_yield_percent: 15,
        storage_temperature: -18,
        shelf_life_days: 120,
      },
      PRC_WHOLE_SHELL: {
        market_segment: "Retail",
        pricing_tier: "Standard",
        processing_difficulty: "Easy",
        expected_yield_percent: 100,
        storage_temperature: -18,
        shelf_life_days: 180,
      },
      PRC_MEAT_ONLY: {
        market_segment: "Processing",
        pricing_tier: "Value",
        processing_difficulty: "Hard",
        expected_yield_percent: 20,
        storage_temperature: -18,
        shelf_life_days: 120,
      },
      CKD_FISH_COOKED: {
        market_segment: "Foodservice",
        pricing_tier: "Standard",
        processing_difficulty: "Medium",
        expected_yield_percent: 70,
        storage_temperature: -18,
        shelf_life_days: 60,
      },
      CKD_BREADED_BATTERED: {
        market_segment: "Foodservice",
        pricing_tier: "Standard",
        processing_difficulty: "Hard",
        expected_yield_percent: 65,
        storage_temperature: -18,
        shelf_life_days: 90,
      },
      CKD_MARINATED_RTE: {
        market_segment: "Retail",
        pricing_tier: "Standard",
        processing_difficulty: "Hard",
        expected_yield_percent: 68,
        storage_temperature: -18,
        shelf_life_days: 45,
      },
      CKD_CANNED_RETORT: {
        market_segment: "Domestic",
        pricing_tier: "Value",
        processing_difficulty: "Medium",
        expected_yield_percent: 75,
        storage_temperature: 15,
        shelf_life_days: 730,
      },
      CKD_SHRIMP_COOKED: {
        market_segment: "Retail",
        pricing_tier: "Standard",
        processing_difficulty: "Medium",
        expected_yield_percent: 70,
        storage_temperature: -18,
        shelf_life_days: 60,
      },
      CKD_CRAB_MEAT: {
        market_segment: "Fine_Dining",
        pricing_tier: "Premium",
        processing_difficulty: "Very_Hard",
        expected_yield_percent: 20,
        storage_temperature: -18,
        shelf_life_days: 45,
      },
      CKD_LOBSTER_MEAT: {
        market_segment: "Fine_Dining",
        pricing_tier: "Premium",
        processing_difficulty: "Very_Hard",
        expected_yield_percent: 25,
        storage_temperature: -18,
        shelf_life_days: 45,
      },
      CKD_OCTOPUS_COOKED: {
        market_segment: "Fine_Dining",
        pricing_tier: "Premium",
        processing_difficulty: "Very_Hard",
        expected_yield_percent: 60,
        storage_temperature: -18,
        shelf_life_days: 60,
      },
      CKD_VALUE_ADDED: {
        market_segment: "Foodservice",
        pricing_tier: "Standard",
        processing_difficulty: "Hard",
        expected_yield_percent: 70,
        storage_temperature: -18,
        shelf_life_days: 90,
      },
      CKD_SURIMI: {
        market_segment: "Processing",
        pricing_tier: "Value",
        processing_difficulty: "Very_Hard",
        expected_yield_percent: 50,
        storage_temperature: -18,
        shelf_life_days: 180,
      },
    };

    // Build mappings
    const rows = [];
    let count = 0;

    for (const sp of species) {
      console.log(
        `\n🐟 Processing species: ${sp.species_code} (type: ${sp.species_type})`,
      );

      // Use species_type directly from the species_species_type_mapping join
      const speciesType = sp.species_type;
      if (!speciesType) {
        console.log(`  ⚠️  No species type found, skipping`);
        continue;
      }
      const allowedDerivIds = allowedDerivBySpeciesType[speciesType] || [];
      console.log(
        `  Found ${allowedDerivIds.length} allowed derivatives for type ${speciesType}`,
      );

      let derivCount = 0;
      for (const derivId of allowedDerivIds) {
        const deriv = derivativeById[derivId];
        if (!deriv) {
          console.log(`    ❌ Derivative not found for ID ${derivId}`);
          continue;
        }

        derivCount++;
      }
      if (derivCount === 0) {
        console.log(
          `    ⚠️  None of the ${allowedDerivIds.length} allowed derivatives were found in derivativeById`,
        );
      }

      // Reset for actual processing
      for (const derivId of allowedDerivIds) {
        const deriv = derivativeById[derivId];
        if (!deriv) continue;

        // Get compatible sizes for this derivative
        const compatibleSizes = getCompatibleSizes(
          deriv.derivative_code,
          sizes,
        );
        if (compatibleSizes.length === 0) {
          console.log(
            `    ⚠️  No compatible sizes for ${deriv.derivative_code}`,
          );
        }

        for (const sz of compatibleSizes) {
          // Get compatible grades based on derivative + size
          const compatibleGrades = getCompatibleGrades(
            deriv.derivative_code,
            sz.size,
            grades,
          );

          for (const gr of compatibleGrades) {
            const config = derivativeConfig[deriv.derivative_code] || {};

            rows.push({
              id: uuidv4(),
              species_master_id: sp.id,
              derivative_master_id: deriv.id,
              size_master_id: sz.id,
              grade_master_id: gr.id,
              is_viable: true,
              viability_reason: null,
              market_segment: config.market_segment || "Export",
              expected_yield_percent: config.expected_yield_percent || 85,
              processing_difficulty: config.processing_difficulty || "Medium",
              storage_temperature_celsius: config.storage_temperature || -18,
              shelf_life_days: config.shelf_life_days || 180,
              recommended_supplier_types: "{}",
              certification_requirements: "{HACCP,ISO_22000}",
              packaging_type_preferred: config.packaging_type || "IQF_Box",
              pricing_tier: config.pricing_tier || "Standard",
              weight_loss_percent_thaw: 3.0,
              is_active: true,
              created_by: systemUserId,
              updated_by: systemUserId,
              created_at: now,
              updated_at: now,
            });

            count++;
          }
        }
      }
    }

    console.log(
      `\n✅ Prepared ${rows.length} species-derivative-size-grade combinations\n`,
    );

    await queryInterface.bulkInsert(
      "species_derivative_size_grade_mapping",
      rows,
      {},
    );

    console.log(
      `✅ Successfully populated species_derivative_size_grade_mapping with ${rows.length} records\n`,
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete(
      "species_derivative_size_grade_mapping",
      null,
      {},
    );
  },
};

// Helper functions

function getSpeciesType(category) {
  const categoryMap = {
    Finfish: "FINFISH",
    Fish: "FINFISH",
    Shrimp: "CRUSTACEAN_SHRIMP",
    Prawn: "CRUSTACEAN_SHRIMP",
    Crab: "CRUSTACEAN_CRAB",
    Lobster: "CRUSTACEAN_LOBSTER",
    Cephalopod: "CEPHALOPOD",
    Squid: "CEPHALOPOD",
    Octopus: "CEPHALOPOD",
    Cuttlefish: "CEPHALOPOD",
    Bivalve: "BIVALVE",
    Oyster: "BIVALVE",
    Clam: "BIVALVE",
    Mussel: "BIVALVE",
    Scallop: "BIVALVE",
    Gastropod: "GASTROPOD",
    Conch: "GASTROPOD",
    Whelk: "GASTROPOD",
    Abalone: "GASTROPOD",
  };

  for (const [key, type] of Object.entries(categoryMap)) {
    if (category && category.toLowerCase().includes(key.toLowerCase())) {
      return type;
    }
  }

  return "FINFISH"; // Default
}

function getCompatibleSizes(derivativeCode, sizes) {
  // Map derivatives to size types based on the derivative-size applicability rules
  const sizeTypeMap = {
    // 🐟 FISH - Whole/Gutted/Dressed → kg sizes only
    UNP_WHOLE_ROUND: ["1_2KG", "2_3KG", "3UP_KG", "500_1KG"],
    PRC_GUTTED: ["1_2KG", "2_3KG", "3UP_KG", "500_1KG"],
    PRC_GG: ["1_2KG", "2_3KG", "3UP_KG", "500_1KG"],
    PRC_HEADED: ["1_2KG", "2_3KG", "3UP_KG", "500_1KG"],
    PRC_HG: ["1_2KG", "2_3KG", "3UP_KG", "500_1KG"],
    PRC_DRESSED: ["1_2KG", "2_3KG", "3UP_KG", "500_1KG"],

    // 🐟 FISH - Fillet/Steak pieces → g sizes
    PRC_FILLET_SKINON: ["200_300G", "300_500G", "500_1KG"],
    PRC_FILLET_SKINLESS: ["200_300G", "300_500G", "500_1KG"],
    PRC_LOIN: ["200_300G", "300_500G", "500_1KG"],
    PRC_PORTION: ["200_300G", "300_500G", "500_1KG"],
    PRC_STEAKS_SLICES: ["200_300G", "300_500G", "500_1KG"],

    // 🦐 SHRIMP - count/kg sizes ONLY (16_20_COUNT, 21_25_COUNT, 26_30_COUNT)
    UNP_HEADON_SHELLON: ["16_20_COUNT", "21_25_COUNT", "26_30_COUNT"],
    PRC_HEADLESS: ["16_20_COUNT", "21_25_COUNT", "26_30_COUNT"],
    PRC_PD: ["16_20_COUNT", "21_25_COUNT", "26_30_COUNT"],
    PRC_PUD: ["16_20_COUNT", "21_25_COUNT", "26_30_COUNT"],
    PRC_PTO: ["16_20_COUNT", "21_25_COUNT", "26_30_COUNT"],
    PRC_EZPEEL: ["16_20_COUNT", "21_25_COUNT", "26_30_COUNT"],

    // 🦀 CRAB - Whole/Dressed/Claws-Knuckles → g/kg sizes (200_300G → 3UP_KG)
    PRC_CLAWS_KNUCKLES: [
      "200_300G",
      "300_500G",
      "500_1KG",
      "1_2KG",
      "2_3KG",
      "3UP_KG",
    ],
    PRC_TAILS: ["200_300G", "300_500G", "500_1KG"],

    // 🦑 SQUID/CUTTLEFISH/OCTOPUS - cm sizes only (10_20CM, 20_30CM, 30UP_CM)
    PRC_TUBES: ["10_20CM", "20_30CM", "30UP_CM"],
    PRC_TENTACLES: ["10_20CM", "20_30CM", "30UP_CM"],
    PRC_RINGS: ["10_20CM", "20_30CM", "30UP_CM"],

    // 🦪 BIVALVES / GASTROPODS - UNSIZED (mixed/per kg) or g/kg whole shell
    PRC_SHUCKED_MEAT: ["UNSIZED"],
    PRC_WHOLE_SHELL: ["300_500G", "500_1KG"],
    PRC_MEAT_ONLY: ["UNSIZED"],
    UNP_INSHELL: ["300_500G", "500_1KG", "1_2KG"],

    // 🍲 COOKED PRODUCTS - UNSIZED only
    CKD_FISH_COOKED: ["UNSIZED"],
    CKD_BREADED_BATTERED: ["UNSIZED"],
    CKD_MARINATED_RTE: ["UNSIZED"],
    CKD_CANNED_RETORT: ["UNSIZED"],
    CKD_SHRIMP_COOKED: ["UNSIZED"],
    CKD_CRAB_MEAT: ["UNSIZED"],
    CKD_LOBSTER_MEAT: ["UNSIZED"],
    CKD_OCTOPUS_COOKED: ["UNSIZED"],
    CKD_VALUE_ADDED: ["UNSIZED"],
    CKD_SURIMI: ["UNSIZED"],
  };

  const sizeNames = sizeTypeMap[derivativeCode] || ["UNSIZED"];
  return sizes.filter((s) => sizeNames.includes(s.size));
}

function getCompatibleGrades(derivativeCode, sizeCode, grades) {
  // Use the global grade-size mapping rules based on the size itself
  // Grade A: 500_1KG, 1_2KG, 2_3KG, 3UP_KG, 30UP_CM, 16_20_COUNT, 300_500G, 200_300G
  // Grade B: 300_500G, 500_1KG, 1_2KG, 2_3KG, 20_30CM, 30UP_CM, 16_20_COUNT, 21_25_COUNT
  // Grade C: 200_300G, 300_500G, 500_1KG, 10_20CM, 20_30CM, 21_25_COUNT, 26_30_COUNT, UNSIZED
  // Grade D: UNSIZED only

  const gradesBySize = {
    "200_300G": ["A", "B", "C"],
    "300_500G": ["A", "B", "C"],
    "500_1KG": ["A", "B", "C"],
    "1_2KG": ["A", "B", "C"],
    "2_3KG": ["A", "B"],
    "3UP_KG": ["A"],
    "10_20CM": ["C"],
    "20_30CM": ["B", "C"],
    "30UP_CM": ["A", "B"],
    "16_20_COUNT": ["A", "B"],
    "21_25_COUNT": ["B", "C"],
    "26_30_COUNT": ["C"],
    UNSIZED: ["C", "D"],
  };

  // Get default grades for this size
  let gradeLetters = gradesBySize[sizeCode] || ["A", "B", "C"];

  // Special override: Cooked products can only be A or B (never C or D)
  if (isCooked(derivativeCode)) {
    gradeLetters = gradeLetters.filter((g) => ["A", "B"].includes(g));
  }

  return grades.filter((g) => gradeLetters.includes(g.grade_code));
}

function isShrimpDerivative(code) {
  return [
    "UNP_HEADON_SHELLON",
    "PRC_HEADLESS",
    "PRC_PD",
    "PRC_PUD",
    "PRC_PTO",
    "PRC_EZPEEL",
  ].includes(code);
}

function isCooked(code) {
  return code.startsWith("CKD_");
}
