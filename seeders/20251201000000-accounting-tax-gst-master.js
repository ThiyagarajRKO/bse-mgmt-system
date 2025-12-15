"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if consolidated_gst_master table exists and has data
    const tables = await queryInterface.showAllTables();
    if (!tables.includes("consolidated_gst_master")) {
      console.log(
        "consolidated_gst_master table does not exist, skipping seeder."
      );
      return;
    }

    // Check if GST data exists
    const gstCount = await queryInterface.sequelize.query(
      "SELECT COUNT(*) as count FROM consolidated_gst_master",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (gstCount[0].count === 0) {
      console.log("No GST master data found, skipping tax code seeder.");
      return;
    }

    // Insert Tax Code Master Records (comprehensive seafood tax codes)
    await queryInterface.bulkInsert(
      "tax_code_master",
      [
        /* 0303 - Frozen fish */
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_0303_DOM",
          tax_code_name: "Frozen fish – Domestic",
          description: "GST for frozen fish domestic sales",
          tax_type: "GST",
          gst_rate_id: null,
          hsn_code: "0303",
          supply_type: "OUTWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_0303_EXP",
          tax_code_name: "Frozen fish – Export",
          description: "Zero-rated GST for frozen fish exports",
          tax_type: "ZERO_RATED",
          gst_rate_id: null,
          hsn_code: "0303",
          supply_type: "OUTWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },

        /* 0304 - Fish fillets / minced meat */
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_0304_DOM",
          tax_code_name: "Fish fillets / minced meat – Domestic",
          description: "GST for fish fillets and minced meat domestic sales",
          tax_type: "GST",
          gst_rate_id: null,
          hsn_code: "0304",
          supply_type: "OUTWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_0304_EXP",
          tax_code_name: "Fish fillets / minced meat – Export",
          description:
            "Zero-rated GST for fish fillets and minced meat exports",
          tax_type: "ZERO_RATED",
          gst_rate_id: null,
          hsn_code: "0304",
          supply_type: "OUTWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },

        /* 0305 - Dried / salted / brined fish */
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_0305_DOM",
          tax_code_name: "Dried / salted / brined fish – Domestic",
          description: "GST for dried, salted or brined fish domestic sales",
          tax_type: "GST",
          gst_rate_id: null,
          hsn_code: "0305",
          supply_type: "OUTWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_0305_EXP",
          tax_code_name: "Dried / salted / brined fish – Export",
          description:
            "Zero-rated GST for dried, salted or brined fish exports",
          tax_type: "ZERO_RATED",
          gst_rate_id: null,
          hsn_code: "0305",
          supply_type: "OUTWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },

        /* 0306 - Crustaceans fresh/frozen */
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_0306_DOM",
          tax_code_name:
            "Crustaceans (shrimp, prawns, crab, lobster) – Domestic",
          description: "GST for crustaceans domestic sales",
          tax_type: "GST",
          gst_rate_id: null,
          hsn_code: "0306",
          supply_type: "OUTWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_0306_EXP",
          tax_code_name: "Crustaceans (shrimp, prawns, crab, lobster) – Export",
          description: "Zero-rated GST for crustaceans exports",
          tax_type: "ZERO_RATED",
          gst_rate_id: null,
          hsn_code: "0306",
          supply_type: "OUTWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },

        /* 0307 - Molluscs fresh/frozen */
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_0307_DOM",
          tax_code_name:
            "Molluscs (squid, cuttlefish, octopus, bivalves) – Domestic",
          description: "GST for molluscs domestic sales",
          tax_type: "GST",
          gst_rate_id: null,
          hsn_code: "0307",
          supply_type: "OUTWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_0307_EXP",
          tax_code_name:
            "Molluscs (squid, cuttlefish, octopus, bivalves) – Export",
          description: "Zero-rated GST for molluscs exports",
          tax_type: "ZERO_RATED",
          gst_rate_id: null,
          hsn_code: "0307",
          supply_type: "OUTWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },

        /* 16051000 - Cooked shrimp & prawns */
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_16051000_DOM",
          tax_code_name: "Cooked, steamed or boiled shrimp & prawns – Domestic",
          description: "GST for cooked shrimp and prawns domestic sales",
          tax_type: "GST",
          gst_rate_id: null,
          hsn_code: "16051000",
          supply_type: "OUTWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_16051000_EXP",
          tax_code_name: "Cooked, steamed or boiled shrimp & prawns – Export",
          description: "Zero-rated GST for cooked shrimp and prawns exports",
          tax_type: "ZERO_RATED",
          gst_rate_id: null,
          hsn_code: "16051000",
          supply_type: "OUTWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },

        /* 16052010 - Cooked crab meat */
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_16052010_DOM",
          tax_code_name: "Cooked, steamed crab meat – Domestic",
          description: "GST for cooked crab meat domestic sales",
          tax_type: "GST",
          gst_rate_id: null,
          hsn_code: "16052010",
          supply_type: "OUTWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_16052010_EXP",
          tax_code_name: "Cooked, steamed crab meat – Export",
          description: "Zero-rated GST for cooked crab meat exports",
          tax_type: "ZERO_RATED",
          gst_rate_id: null,
          hsn_code: "16052010",
          supply_type: "OUTWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },

        /* 16052900 - Prepared/preserved crustaceans (non-canned) */
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_16052900_DOM",
          tax_code_name:
            "Prepared or preserved crustaceans (non-canned) – Domestic",
          description:
            "GST for prepared or preserved crustaceans domestic sales",
          tax_type: "GST",
          gst_rate_id: null,
          hsn_code: "16052900",
          supply_type: "OUTWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_16052900_EXP",
          tax_code_name:
            "Prepared or preserved crustaceans (non-canned) – Export",
          description:
            "Zero-rated GST for prepared or preserved crustaceans exports",
          tax_type: "ZERO_RATED",
          gst_rate_id: null,
          hsn_code: "16052900",
          supply_type: "OUTWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },

        /* 16053000 - Cooked/prepared molluscs */
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_16053000_DOM",
          tax_code_name:
            "Cooked or prepared molluscs (squid, octopus, scallops) – Domestic",
          description: "GST for cooked or prepared molluscs domestic sales",
          tax_type: "GST",
          gst_rate_id: null,
          hsn_code: "16053000",
          supply_type: "OUTWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_16053000_EXP",
          tax_code_name:
            "Cooked or prepared molluscs (squid, octopus, scallops) – Export",
          description: "Zero-rated GST for cooked or prepared molluscs exports",
          tax_type: "ZERO_RATED",
          gst_rate_id: null,
          hsn_code: "16053000",
          supply_type: "OUTWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },

        /* 16054000 - Cooked/prepared fish */
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_16054000_DOM",
          tax_code_name: "Cooked or prepared fish – Domestic",
          description: "GST for cooked or prepared fish domestic sales",
          tax_type: "GST",
          gst_rate_id: null,
          hsn_code: "16054000",
          supply_type: "OUTWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_16054000_EXP",
          tax_code_name: "Cooked or prepared fish – Export",
          description: "Zero-rated GST for cooked or prepared fish exports",
          tax_type: "ZERO_RATED",
          gst_rate_id: null,
          hsn_code: "16054000",
          supply_type: "OUTWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },

        /* 16055100 - Breaded/battered seafood */
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_16055100_DOM",
          tax_code_name: "Breaded or battered seafood – Domestic",
          description: "GST for breaded or battered seafood domestic sales",
          tax_type: "GST",
          gst_rate_id: null,
          hsn_code: "16055100",
          supply_type: "OUTWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_16055100_EXP",
          tax_code_name: "Breaded or battered seafood – Export",
          description: "Zero-rated GST for breaded or battered seafood exports",
          tax_type: "ZERO_RATED",
          gst_rate_id: null,
          hsn_code: "16055100",
          supply_type: "OUTWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },

        /* 16055900 - Value-added seafood */
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_16055900_DOM",
          tax_code_name: "Value-added seafood preparations – Domestic",
          description:
            "GST for value-added seafood preparations domestic sales",
          tax_type: "GST",
          gst_rate_id: null,
          hsn_code: "16055900",
          supply_type: "OUTWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_16055900_EXP",
          tax_code_name: "Value-added seafood preparations – Export",
          description:
            "Zero-rated GST for value-added seafood preparations exports",
          tax_type: "ZERO_RATED",
          gst_rate_id: null,
          hsn_code: "16055900",
          supply_type: "OUTWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },

        /* 16059010 - Canned tuna, sardines, mackerel, salmon */
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_16059010_DOM",
          tax_code_name: "Canned tuna, sardines, mackerel, salmon – Domestic",
          description: "GST for canned fish domestic sales",
          tax_type: "GST",
          gst_rate_id: null,
          hsn_code: "16059010",
          supply_type: "OUTWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_16059010_EXP",
          tax_code_name: "Canned tuna, sardines, mackerel, salmon – Export",
          description: "Zero-rated GST for canned fish exports",
          tax_type: "ZERO_RATED",
          gst_rate_id: null,
          hsn_code: "16059010",
          supply_type: "OUTWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },

        /* 16059090 - Other prepared seafood */
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_16059090_DOM",
          tax_code_name: "Other prepared seafood (RTE/RTH) – Domestic",
          description: "GST for other prepared seafood domestic sales",
          tax_type: "GST",
          gst_rate_id: null,
          hsn_code: "16059090",
          supply_type: "OUTWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_16059090_EXP",
          tax_code_name: "Other prepared seafood (RTE/RTH) – Export",
          description: "Zero-rated GST for other prepared seafood exports",
          tax_type: "ZERO_RATED",
          gst_rate_id: null,
          hsn_code: "16059090",
          supply_type: "OUTWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },

        /* 39201099 - Plastic film */
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_39201099_DOM",
          tax_code_name:
            "Plastic film (vacuum pouches, shrink wrap) – Domestic",
          description: "GST for plastic film packaging materials",
          tax_type: "GST",
          gst_rate_id: null,
          hsn_code: "39201099",
          supply_type: "INWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_39201099_EXP",
          tax_code_name: "Plastic film (vacuum pouches, shrink wrap) – Export",
          description:
            "Zero-rated GST for plastic film packaging materials exports",
          tax_type: "ZERO_RATED",
          gst_rate_id: null,
          hsn_code: "39201099",
          supply_type: "OUTWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },

        /* 39232100 - Poly bags */
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_39232100_DOM",
          tax_code_name: "LDPE / HDPE poly bags – Domestic",
          description: "GST for poly bags packaging materials",
          tax_type: "GST",
          gst_rate_id: null,
          hsn_code: "39232100",
          supply_type: "INWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_39232100_EXP",
          tax_code_name: "LDPE / HDPE poly bags – Export",
          description:
            "Zero-rated GST for poly bags packaging materials exports",
          tax_type: "ZERO_RATED",
          gst_rate_id: null,
          hsn_code: "39232100",
          supply_type: "OUTWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },

        /* 48192090 - Corrugated cartons */
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_48192090_DOM",
          tax_code_name: "Corrugated cartons / master cartons – Domestic",
          description: "GST for corrugated cartons packaging materials",
          tax_type: "GST",
          gst_rate_id: null,
          hsn_code: "48192090",
          supply_type: "INWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_48192090_EXP",
          tax_code_name: "Corrugated cartons / master cartons – Export",
          description:
            "Zero-rated GST for corrugated cartons packaging materials exports",
          tax_type: "ZERO_RATED",
          gst_rate_id: null,
          hsn_code: "48192090",
          supply_type: "OUTWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },

        /* 48203000 - Computer / printing paper */
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_48203000_DOM",
          tax_code_name: "Computer paper / printing paper – Domestic",
          description: "GST for computer and printing paper",
          tax_type: "GST",
          gst_rate_id: null,
          hsn_code: "48203000",
          supply_type: "INWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_48203000_EXP",
          tax_code_name: "Computer paper / printing paper – Export",
          description: "Zero-rated GST for computer and printing paper exports",
          tax_type: "ZERO_RATED",
          gst_rate_id: null,
          hsn_code: "48203000",
          supply_type: "OUTWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },

        /* 48211010 - Labels */
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_48211010_DOM",
          tax_code_name:
            "Self-adhesive labels / printed barcode labels – Domestic",
          description: "GST for self-adhesive labels and barcode labels",
          tax_type: "GST",
          gst_rate_id: null,
          hsn_code: "48211010",
          supply_type: "INWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_48211010_EXP",
          tax_code_name:
            "Self-adhesive labels / printed barcode labels – Export",
          description:
            "Zero-rated GST for self-adhesive labels and barcode labels exports",
          tax_type: "ZERO_RATED",
          gst_rate_id: null,
          hsn_code: "48211010",
          supply_type: "OUTWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },

        /* 96081019 - Stationery (pens) – usually only domestic in ERP */
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_96081019_DOM",
          tax_code_name: "Ball pens / writing instruments – Domestic",
          description: "GST for ball pens and writing instruments",
          tax_type: "GST",
          gst_rate_id: null,
          hsn_code: "96081019",
          supply_type: "INWARD",
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      { ignoreDuplicates: true }
    );

    console.log("Tax codes seeded successfully");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("tax_code_master", null, {});
  },
};
