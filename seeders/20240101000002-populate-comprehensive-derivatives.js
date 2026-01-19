"use strict";

const derivativeMappings = [
  // UNPROCESSED - Whole/As-Received
  {
    derivative_code: "WR",
    derivative_name: "Whole (Round)",
    processing_type: "UNPROCESSED",
  },
  {
    derivative_code: "WIS",
    derivative_name: "Whole (In Shell)",
    processing_type: "UNPROCESSED",
  },
  {
    derivative_code: "WHSO",
    derivative_name: "Whole (Head-on Shell-on)",
    processing_type: "UNPROCESSED",
  },
  {
    derivative_code: "WHST",
    derivative_name: "Whole (Head-on Shell-off)",
    processing_type: "UNPROCESSED",
  },

  // PROCESSED_UNCOOKED - Market Forms (Cut/Prepared but Uncooked)
  // Fish
  {
    derivative_code: "G",
    derivative_name: "Gutted",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "GG",
    derivative_name: "GG (Gutted & Gilled)",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "HG",
    derivative_name: "H&G (Headed & Gutted)",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "HO",
    derivative_name: "Headed",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "FIL",
    derivative_name: "Fillets",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "FIL_SK",
    derivative_name: "Fillets (Skin-on)",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "FIL_SF",
    derivative_name: "Fillets (Skin-off)",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "FL",
    derivative_name: "Flaps",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "LN",
    derivative_name: "Loins",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "POR",
    derivative_name: "Portions",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "STK",
    derivative_name: "Steaks",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "JAW",
    derivative_name: "Jawbones",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "COL",
    derivative_name: "Collars",
    processing_type: "PROCESSED_UNCOOKED",
  },

  // Shrimp
  {
    derivative_code: "SHRIMP_HDO",
    derivative_name: "Shrimp (Head-on)",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "SHRIMP_HDO_SHELL",
    derivative_name: "Shrimp (Head-on Shell-on)",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "SHRIMP_HDO_NO_SHELL",
    derivative_name: "Shrimp (Head-on Shell-off)",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "SHRIMP_HDOF",
    derivative_name: "Shrimp (Head-off)",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "SHRIMP_HDOF_SHELL",
    derivative_name: "Shrimp (Head-off Shell-on)",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "SHRIMP_HDOF_NO_SHELL",
    derivative_name: "Shrimp (Head-off Shell-off / Peeled)",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "SHRIMP_TAILLESS",
    derivative_name: "Shrimp (Tailless)",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "SHRIMP_SPLIT",
    derivative_name: "Shrimp (Split)",
    processing_type: "PROCESSED_UNCOOKED",
  },

  // Cephalopod (Squid/Cuttlefish/Octopus)
  {
    derivative_code: "ML",
    derivative_name: "Mantles (Squid/Cuttlefish)",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "ARM",
    derivative_name: "Arms (Squid/Cuttlefish/Octopus)",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "TEN",
    derivative_name: "Tentacles (Squid/Octopus)",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "TUB",
    derivative_name: "Tubes (Squid/Cuttlefish)",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "TEN_W_ARM",
    derivative_name: "Tentacles with Arms",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "WHOLE_CLEAN",
    derivative_name: "Whole Cleaned (Squid/Cuttlefish)",
    processing_type: "PROCESSED_UNCOOKED",
  },

  // Bivalve (Clams/Mussels/Scallops/Oysters)
  {
    derivative_code: "HS",
    derivative_name: "Half-Shell (Bivalves)",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "SM",
    derivative_name: "Shucked Meat (Bivalves)",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "MEAT_ONLY",
    derivative_name: "Meat Only",
    processing_type: "PROCESSED_UNCOOKED",
  },
  {
    derivative_code: "MEAT_IQF",
    derivative_name: "Meat (IQF - Individually Quick Frozen)",
    processing_type: "PROCESSED_UNCOOKED",
  },

  // COOKED - Ready-to-Cook, Cooked, Processed
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

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Get all species from database for relationship
      const species = await queryInterface.sequelize.query(
        `SELECT id, name FROM species_masters LIMIT 1`,
        { type: queryInterface.sequelize.QueryTypes.SELECT },
      );

      const defaultSpeciesId =
        species && species.length > 0 ? species[0].id : 1;

      for (const mapping of derivativeMappings) {
        // Check if derivative with this code already exists
        const [existing] = await queryInterface.sequelize.query(
          `SELECT id FROM derivative_masters WHERE derivative_code = :code`,
          {
            replacements: { code: mapping.derivative_code },
            type: queryInterface.sequelize.QueryTypes.SELECT,
          },
        );

        if (existing) {
          // Update existing derivative
          await queryInterface.sequelize.query(
            `UPDATE derivative_masters 
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
          console.log(`Updated derivative: ${mapping.derivative_code}`);
        } else {
          // Insert new derivative
          await queryInterface.sequelize.query(
            `INSERT INTO derivative_masters (
              derivative_code, 
              derivative_name, 
              processing_type,
              processing_level,
              created_at, 
              updated_at
            ) VALUES (
              :code,
              :name,
              :processing_type,
              :processing_level,
              NOW(),
              NOW()
            )`,
            {
              replacements: {
                code: mapping.derivative_code,
                name: mapping.derivative_name,
                processing_type: mapping.processing_type,
                processing_level: "Raw", // Keep legacy field populated
              },
            },
          );
          console.log(`Created derivative: ${mapping.derivative_code}`);
        }
      }

      console.log("Derivative seeding completed successfully");
    } catch (error) {
      console.error("Error during derivative seeding:", error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      const codes = derivativeMappings.map((m) => m.derivative_code);
      await queryInterface.sequelize.query(
        `DELETE FROM derivative_masters WHERE derivative_code IN (:codes)`,
        {
          replacements: { codes },
          type: queryInterface.sequelize.QueryTypes.DELETE,
        },
      );
      console.log("Reverted derivative seeding");
    } catch (error) {
      console.error("Error reverting seeding:", error);
      throw error;
    }
  },
};
