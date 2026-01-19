#!/usr/bin/env node

/**
 * Populate species_derivative_size_grade_mapping based on species type
 *
 * Maps each species to appropriate derivatives by:
 * - Species category (FISH, CRUSTACEAN with subtypes, CEPHALOPOD, BIVALVE)
 * - Processing type (UNPROCESSED, PROCESSED_UNCOOKED, COOKED)
 */

const { Sequelize } = require("sequelize");
require("dotenv").config();

// Mapping of your codes to our derivative codes
const derivativeCodeMap = {
  // UNPROCESSED
  UNP_WHOLE_ROUND: "WR",
  UNP_HEADON_SHELLON: "WHSO",
  UNP_INSHELL: "WIS",

  // PROCESSED_UNCOOKED - Fish
  PRC_GUTTED: "G",
  PRC_GG: "GG",
  PRC_HEADED: "HO",
  PRC_HG: "HG",
  PRC_DRESSED: "DR",
  PRC_FILLET_SKINON: "FIL_SK",
  PRC_FILLET_SKINLESS: "FIL_SF",
  PRC_LOIN: "LN",
  PRC_PORTION: "POR",
  PRC_STEAKS_SLICES: "STK",

  // PROCESSED_UNCOOKED - Shrimp
  PRC_TAILS: "TL",
  PRC_PUD: "SHRIMP_PEELED",
  PRC_PD: "SHRIMP_PEELED_DEV",
  PRC_PTO: "SHRIMP_PEELED_TALON",
  PRC_EZPEEL: "SHRIMP_EZ_PEEL",

  // PROCESSED_UNCOOKED - Crustacean
  PRC_CLAWS_KNUCKLES: "CK",

  // PROCESSED_UNCOOKED - Cephalopod
  PRC_TUBES: "TUB",
  PRC_TENTACLES: "TEN",
  PRC_RINGS: "RNG",

  // PROCESSED_UNCOOKED - Bivalve
  PRC_HALF_SHELL: "HS",
  PRC_SHUCKED_MEAT: "SM",

  // COOKED
  CKD_SHRIMP_BOILED: "CKD_SHRIMP_BOILED",
  CKD_CRAB_MEAT: "CKD_CRAB_MEAT",
  CKD_LOBSTER_MEAT: "CKD_LOBSTER_MEAT",
  CKD_FISH_COOKED: "CKD_FISH_COOKED",
  CKD_SQUID_COOKED: "CKD_SQUID_COOKED",
  CKD_OCTOPUS_COOKED: "CKD_OCTOPUS_COOKED",
  CKD_BIVALVE_MEAT: "CKD_BIVALVE_MEAT",
  CKD_BREADED_BATTERED: "CKD_BREADED_BATTERED",
  CKD_MARINATED_RTE: "CKD_MARINATED_RTE",
  CKD_CANNED_RETORT: "CKD_CANNED_RETORT",
};

async function populateSpeciesDerivativeMatrix() {
  const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USERNAME,
    process.env.DB_SECRET,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: "postgres",
      logging: false,
    },
  );

  try {
    console.log("Populating species-derivative mappings...");
    await sequelize.authenticate();
    console.log("Database connection established\n");

    // Get a valid user ID for created_by
    const [userResult] = await sequelize.query(
      `SELECT id FROM user_profiles LIMIT 1`,
    );
    const userId = userResult[0]?.id;

    if (!userId) {
      console.error("❌ No user profile found");
      process.exit(1);
    }

    // Get all active species
    const [species] = await sequelize.query(
      `SELECT id, parent_category_type FROM species_master WHERE is_active = true ORDER BY id`,
    );

    console.log(`Found ${species.length} active species\n`);

    // Get all derivatives by code
    const [derivatives] = await sequelize.query(
      `SELECT id, derivative_code FROM derivative_master WHERE derivative_code IN (${Object.values(
        derivativeCodeMap,
      )
        .map((c) => `'${c}'`)
        .join(",")})`,
    );

    const derivativeMap = {};
    derivatives.forEach((d) => {
      derivativeMap[d.derivative_code] = d.id;
    });

    console.log(`Loaded ${derivatives.length} derivative mappings\n`);

    // Get default size and grade (we'll use any available size/grade for now)
    const [defaultSize] = await sequelize.query(
      `SELECT id FROM size_master WHERE is_active = true LIMIT 1`,
    );
    const [defaultGrade] = await sequelize.query(
      `SELECT id FROM grade_master WHERE is_active = true LIMIT 1`,
    );

    if (!defaultSize || !defaultGrade) {
      console.error("❌ No active size or grade found in database");
      process.exit(1);
    }

    const sizeId = defaultSize[0]?.id;
    const gradeId = defaultGrade[0]?.id;
    console.log(`Using default size: ${sizeId}`);
    console.log(`Using default grade: ${gradeId}\n`);

    let insertedCount = 0;

    for (const s of species) {
      const derivativeCodes = [];
      const categoryType = s.parent_category_type?.toUpperCase() || "UNKNOWN";

      // Determine which derivatives to assign based on category
      if (categoryType === "CRUSTACEAN" || categoryType.includes("SHRIMP")) {
        // SHRIMP
        if (categoryType.includes("SHRIMP")) {
          derivativeCodes.push(
            "UNP_WHOLE_ROUND",
            "UNP_HEADON_SHELLON",
            "PRC_HEADED",
            "PRC_HEADLESS",
            "PRC_TAILS",
            "PRC_PUD",
            "PRC_PD",
            "PRC_PTO",
            "PRC_EZPEEL",
            "CKD_SHRIMP_BOILED",
            "CKD_BREADED_BATTERED",
            "CKD_MARINATED_RTE",
            "CKD_CANNED_RETORT",
          );
        }
        // CRAB
        else if (categoryType.includes("CRAB")) {
          derivativeCodes.push(
            "UNP_WHOLE_ROUND",
            "PRC_DRESSED",
            "PRC_CLAWS_KNUCKLES",
            "CKD_CRAB_MEAT",
            "CKD_BREADED_BATTERED",
            "CKD_MARINATED_RTE",
            "CKD_CANNED_RETORT",
          );
        }
        // LOBSTER
        else if (categoryType.includes("LOBSTER")) {
          derivativeCodes.push(
            "UNP_WHOLE_ROUND",
            "PRC_TAILS",
            "PRC_CLAWS_KNUCKLES",
            "CKD_LOBSTER_MEAT",
            "CKD_BREADED_BATTERED",
            "CKD_MARINATED_RTE",
            "CKD_CANNED_RETORT",
          );
        }
        // Generic crustacean
        else {
          derivativeCodes.push(
            "UNP_WHOLE_ROUND",
            "PRC_DRESSED",
            "PRC_CLAWS_KNUCKLES",
            "CKD_CRAB_MEAT",
          );
        }
      }
      // FISH
      else if (categoryType === "FISH") {
        derivativeCodes.push(
          "UNP_WHOLE_ROUND",
          "PRC_GUTTED",
          "PRC_GG",
          "PRC_HEADED",
          "PRC_HG",
          "PRC_DRESSED",
          "PRC_FILLET_SKINON",
          "PRC_FILLET_SKINLESS",
          "PRC_LOIN",
          "PRC_PORTION",
          "PRC_STEAKS_SLICES",
          "CKD_FISH_COOKED",
          "CKD_BREADED_BATTERED",
          "CKD_MARINATED_RTE",
          "CKD_CANNED_RETORT",
        );
      }
      // CEPHALOPOD
      else if (categoryType === "CEPHALOPOD") {
        derivativeCodes.push(
          "UNP_WHOLE_ROUND",
          "PRC_TUBES",
          "PRC_TENTACLES",
          "PRC_RINGS",
          "CKD_SQUID_COOKED",
          "CKD_OCTOPUS_COOKED",
          "CKD_BREADED_BATTERED",
          "CKD_MARINATED_RTE",
          "CKD_CANNED_RETORT",
        );
      }
      // BIVALVE
      else if (categoryType === "BIVALVE") {
        derivativeCodes.push(
          "UNP_INSHELL",
          "PRC_HALF_SHELL",
          "PRC_SHUCKED_MEAT",
          "CKD_BIVALVE_MEAT",
          "CKD_CANNED_RETORT",
        );
      }
      // DEFAULT
      else {
        derivativeCodes.push("UNP_WHOLE_ROUND");
      }

      // Insert mappings for each derivative
      for (const code of derivativeCodes) {
        const actualCode = derivativeCodeMap[code];
        const derivativeId = derivativeMap[actualCode];

        if (derivativeId) {
          // Check if mapping already exists
          const [existing] = await sequelize.query(
            `SELECT id FROM species_derivative_size_grade_mapping 
             WHERE species_master_id = :speciesId 
             AND derivative_master_id = :derivativeId`,
            {
              replacements: {
                speciesId: s.id,
                derivativeId: derivativeId,
              },
              type: sequelize.QueryTypes.SELECT,
            },
          );

          if (!existing) {
            await sequelize.query(
              `INSERT INTO species_derivative_size_grade_mapping (
                id,
                species_master_id,
                derivative_master_id,
                size_master_id,
                grade_master_id,
                created_at,
                updated_at,
                created_by
              ) VALUES (
                gen_random_uuid(),
                :speciesId,
                :derivativeId,
                :sizeId,
                :gradeId,
                NOW(),
                NOW(),
                :userId
              )`,
              {
                replacements: {
                  speciesId: s.id,
                  derivativeId: derivativeId,
                  sizeId: sizeId,
                  gradeId: gradeId,
                  userId: userId,
                },
              },
            );
            insertedCount++;
          }
        }
      }
    }

    console.log(
      `\n✅ Completed! Inserted/Updated ${insertedCount} species-derivative mappings`,
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

populateSpeciesDerivativeMatrix();
