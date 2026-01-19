#!/usr/bin/env node

/**
 * Add COOKED derivatives directly via SQL
 */

const { Sequelize } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const cookedDerivatives = [
  {
    derivative_code: "CKD_SHRIMP_BOILED",
    derivative_name: "Cooked Shrimp/Prawn (Boiled/Steamed)",
  },
  {
    derivative_code: "CKD_CRAB_MEAT",
    derivative_name: "Cooked Crab Meat (Pasteurized)",
  },
  {
    derivative_code: "CKD_LOBSTER_MEAT",
    derivative_name: "Cooked Lobster Meat",
  },
  {
    derivative_code: "CKD_FISH_COOKED",
    derivative_name: "Cooked Fish (Steamed/Grilled/Smoked)",
  },
  {
    derivative_code: "CKD_SQUID_COOKED",
    derivative_name: "Cooked Squid / Cuttlefish (Boiled/Steamed)",
  },
  {
    derivative_code: "CKD_OCTOPUS_COOKED",
    derivative_name: "Cooked Octopus (Boiled/Steamed)",
  },
  {
    derivative_code: "CKD_BIVALVE_MEAT",
    derivative_name: "Cooked Bivalve Meat (Mussel/Oyster/Clam)",
  },
  {
    derivative_code: "CKD_BREADED_BATTERED",
    derivative_name: "Breaded / Battered Seafood (Value-added)",
  },
  {
    derivative_code: "CKD_MARINATED_RTE",
    derivative_name: "Marinated / Ready-to-Eat Seafood",
  },
  {
    derivative_code: "CKD_CANNED_RETORT",
    derivative_name: "Canned / Retort Seafood (Shelf-stable)",
  },
];

async function addCookedDerivatives() {
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
    console.log("Adding COOKED derivatives...");
    await sequelize.authenticate();
    console.log("Database connection established\n");

    let createdCount = 0;

    for (const item of cookedDerivatives) {
      const [existing] = await sequelize.query(
        `SELECT id FROM derivative_master WHERE derivative_code = :code`,
        {
          replacements: { code: item.derivative_code },
          type: sequelize.QueryTypes.SELECT,
        },
      );

      if (!existing) {
        const newId = uuidv4();
        await sequelize.query(
          `INSERT INTO derivative_master (
            id,
            derivative_code, 
            derivative_name, 
            processing_type,
            created_at, 
            updated_at
          ) VALUES (
            :id,
            :code,
            :name,
            'COOKED',
            NOW(),
            NOW()
          )`,
          {
            replacements: {
              id: newId,
              code: item.derivative_code,
              name: item.derivative_name,
            },
          },
        );
        console.log(
          `✓ Created: ${item.derivative_code} - ${item.derivative_name}`,
        );
        createdCount++;
      } else {
        console.log(`↻ Exists: ${item.derivative_code}`);
      }
    }

    console.log(
      `\n✅ Completed! Created: ${createdCount} new COOKED derivatives`,
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

addCookedDerivatives();
