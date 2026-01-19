#!/usr/bin/env node

/**
 * Seeder for Comprehensive Derivative Processing Types
 *
 * This script populates 40+ derivative types with proper processing type categorization:
 * - UNPROCESSED: Whole/As-received products
 * - PROCESSED_UNCOOKED: Market forms (fillets, steaks, shrimp variants, cephalopod cuts, bivalve forms)
 * - COOKED: Processed/cooked products
 */

const { Sequelize } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const derivativeMappings = [
  // UNPROCESSED - Whole/As-Received
  {
    derivative_code: "WR",
    derivative_name: "Whole (Round / As Received)",
    processing_type: "UNPROCESSED",
  },
  {
    derivative_code: "WIS",
    derivative_name: "Whole (In Shell) (bivalves/gastropods)",
    processing_type: "UNPROCESSED",
  },

  // PROCESSED_UNCOOKED - Market Forms (Cut/Prepared but Uncooked)
  // Fish - Basic Preparation
  {
    derivative_code: "G",
    derivative_name: "Gutted",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "GG",
    derivative_name: "Gilled & Gutted (GG)",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "HO",
    derivative_name: "Headed",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "HG",
    derivative_name: "Headed & Gutted (H&G)",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "DR",
    derivative_name: "Dressed",
    processing_type: "PROCESSED_UNCOOKED",
  },

  // Fish - Fillets & Cuts
  {
    derivative_code: "FIL_SK",
    derivative_name: "Fillet (Skin-on)",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "FIL_SF",
    derivative_name: "Fillet (Skinless)",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "LN",
    derivative_name: "Loin",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "POR",
    derivative_name: "Portions",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "STK",
    derivative_name: "Steaks / Slices",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "TL",
    derivative_name: "Tails",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "CK",
    derivative_name: "Claws / Knuckles",
    processing_type: "PROCESSED_UNCOOKED",
  },

  // Cephalopod (Squid/Cuttlefish/Octopus)
  {
    derivative_code: "TUB",
    derivative_name: "Tubes",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "TEN",
    derivative_name: "Tentacles",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "RNG",
    derivative_name: "Rings",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "WHOLE_CLEAN",
    derivative_name: "Whole Cleaned (Squid/Octopus/Crab)",
    processing_type: "PROCESSED_UNCOOKED",
  },

  // Bivalve (Clams/Mussels/Scallops/Oysters)
  {
    derivative_code: "HS",
    derivative_name: "Half-Shell",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "SM",
    derivative_name: "Shucked Meat",
    processing_type: "PROCESSED_UNCOOKED",
  },

  // Shrimp - Specialized Processing
  {
    derivative_code: "SHRIMP_PEELED",
    derivative_name: "Peeled (Shrimp)",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "SHRIMP_PEELED_DEV",
    derivative_name: "Peeled Deveined (Shrimp)",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "SHRIMP_PEELED_TALON",
    derivative_name: "Peeled Tail-on (Shrimp)",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "SHRIMP_EZ_PEEL",
    derivative_name: "EZ Peel (Shrimp)",
    processing_type: "PROCESSED_UNCOOKED",
  },

  // COOKED - Ready-to-Cook, Cooked, Processed
  // Shrimp - Cooked
  {
    derivative_code: "CKD_SHRIMP_BOILED",
    derivative_name: "Cooked Shrimp/Prawn (Boiled/Steamed)",
    processing_type: "COOKED",
  },

  // Crustaceans - Cooked
  {
    derivative_code: "CKD_CRAB_MEAT",
    derivative_name: "Cooked Crab Meat (Pasteurized)",
    processing_type: "COOKED",
  },
  {
    derivative_code: "CKD_LOBSTER_MEAT",
    derivative_name: "Cooked Lobster Meat",
    processing_type: "COOKED",
  },

  // Fish - Cooked
  {
    derivative_code: "CKD_FISH_COOKED",
    derivative_name: "Cooked Fish (Steamed/Grilled/Smoked)",
    processing_type: "COOKED",
  },

  // Cephalopod - Cooked
  {
    derivative_code: "CKD_SQUID_COOKED",
    derivative_name: "Cooked Squid / Cuttlefish (Boiled/Steamed)",
    processing_type: "COOKED",
  },
  {
    derivative_code: "CKD_OCTOPUS_COOKED",
    derivative_name: "Cooked Octopus (Boiled/Steamed)",
    processing_type: "COOKED",
  },

  // Bivalve - Cooked
  {
    derivative_code: "CKD_BIVALVE_MEAT",
    derivative_name: "Cooked Bivalve Meat (Mussel/Oyster/Clam)",
    processing_type: "COOKED",
  },

  // Value-added/RTC/RTE
  {
    derivative_code: "CKD_BREADED_BATTERED",
    derivative_name: "Breaded / Battered Seafood (Value-added)",
    processing_type: "COOKED",
  },
  {
    derivative_code: "CKD_MARINATED_RTE",
    derivative_name: "Marinated / Ready-to-Eat Seafood",
    processing_type: "COOKED",
  },

  // Shelf-stable
  {
    derivative_code: "CKD_CANNED_RETORT",
    derivative_name: "Canned / Retort Seafood (Shelf-stable)",
    processing_type: "COOKED",
  },

  // Legacy/Legacy Compatibility
  {
    derivative_code: "STEAMED",
    derivative_name: "Steamed",
    processing_type: "COOKED",
  },
  {
    derivative_code: "BOILED",
    derivative_name: "Boiled",
    processing_type: "COOKED",
  },
  {
    derivative_code: "SMOKED",
    derivative_name: "Smoked",
    processing_type: "COOKED",
  },
  {
    derivative_code: "BREADED",
    derivative_name: "Breaded",
    processing_type: "COOKED",
  },
  {
    derivative_code: "BATTERED",
    derivative_name: "Battered",
    processing_type: "COOKED",
  },
  {
    derivative_code: "MARINATED",
    derivative_name: "Marinated",
    processing_type: "COOKED",
  },
  {
    derivative_code: "CANNED",
    derivative_name: "Canned/Retort",
    processing_type: "COOKED",
  },
  {
    derivative_code: "MINCED",
    derivative_name: "Minced/Ground",
    processing_type: "COOKED",
  },
  {
    derivative_code: "SURIMI",
    derivative_name: "Surimi",
    processing_type: "COOKED",
  },
];

async function runDerivativeSeeder() {
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
    console.log("Starting comprehensive derivative seeder...");
    await sequelize.authenticate();
    console.log("Database connection established\n");

    let createdCount = 0;
    let updatedCount = 0;

    for (const mapping of derivativeMappings) {
      // Check if derivative with this code already exists
      const [existing] = await sequelize.query(
        `SELECT id FROM derivative_master WHERE derivative_code = :code`,
        {
          replacements: { code: mapping.derivative_code },
          type: sequelize.QueryTypes.SELECT,
        },
      );

      if (existing) {
        // Update existing derivative
        await sequelize.query(
          `UPDATE derivative_master 
           SET derivative_name = :name, 
               processing_type = :processing_type,
               updated_at = NOW()
           WHERE derivative_code = :code`,
          {
            replacements: {
              name: mapping.derivative_name,
              processing_type: mapping.processing_type,
              code: mapping.derivative_code,
            },
          },
        );
        console.log(
          `↻ Updated: ${mapping.derivative_code} - ${mapping.derivative_name}`,
        );
        updatedCount++;
      } else {
        // Insert new derivative with UUID
        const newId = uuidv4();
        await sequelize.query(
          `INSERT INTO derivative_master (
            id,
            derivative_code, 
            derivative_name, 
            processing_type,
            processing_level,
            created_at, 
            updated_at
          ) VALUES (
            :id,
            :code,
            :name,
            :processing_type,
            :processing_level,
            NOW(),
            NOW()
          )`,
          {
            replacements: {
              id: newId,
              code: mapping.derivative_code,
              name: mapping.derivative_name,
              processing_type: mapping.processing_type,
              processing_level: "Raw",
            },
          },
        );
        console.log(
          `✓ Created: ${mapping.derivative_code} - ${mapping.derivative_name}`,
        );
        createdCount++;
      }
    }

    console.log(`\n✅ Derivative seeding completed!`);
    console.log(`   Created: ${createdCount}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Total:   ${createdCount + updatedCount}`);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runDerivativeSeeder();
