"use strict";

const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const rows = [
      // ======================================================
      // UNPROCESSED (RAW in your ERP)
      // ======================================================
      {
        id: uuidv4(),
        derivative_code: "UNP_WHOLE_ROUND",
        derivative_name: "Whole (Round / As Received)",
        processing_type: "UNPROCESSED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        derivative_code: "UNP_INSHELL",
        derivative_name: "Whole (In Shell)",
        processing_type: "UNPROCESSED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        derivative_code: "UNP_HEADON_SHELLON",
        derivative_name: "Whole (Head-on Shell-on)",
        processing_type: "UNPROCESSED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },

      // ======================================================
      // PROCESSED_UNCOOKED (Primary Processing)
      // ======================================================
      // ---- Finfish common ----
      {
        id: uuidv4(),
        derivative_code: "PRC_GUTTED",
        derivative_name: "Gutted",
        processing_type: "PROCESSED_UNCOOKED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        derivative_code: "PRC_GG",
        derivative_name: "Gilled & Gutted (GG)",
        processing_type: "PROCESSED_UNCOOKED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        derivative_code: "PRC_HEADED",
        derivative_name: "Headed",
        processing_type: "PROCESSED_UNCOOKED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        derivative_code: "PRC_HG",
        derivative_name: "Headed & Gutted (H&G)",
        processing_type: "PROCESSED_UNCOOKED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        derivative_code: "PRC_DRESSED",
        derivative_name: "Dressed",
        processing_type: "PROCESSED_UNCOOKED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },

      // ---- Fillet / cuts ----
      {
        id: uuidv4(),
        derivative_code: "PRC_FILLET_SKINON",
        derivative_name: "Fillet (Skin-on)",
        processing_type: "PROCESSED_UNCOOKED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        derivative_code: "PRC_FILLET_SKINLESS",
        derivative_name: "Fillet (Skinless)",
        processing_type: "PROCESSED_UNCOOKED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        derivative_code: "PRC_LOIN",
        derivative_name: "Loin",
        processing_type: "PROCESSED_UNCOOKED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        derivative_code: "PRC_PORTION",
        derivative_name: "Portion",
        processing_type: "PROCESSED_UNCOOKED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        derivative_code: "PRC_STEAKS_SLICES",
        derivative_name: "Steaks / Slices",
        processing_type: "PROCESSED_UNCOOKED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },

      // ---- Shrimp / prawn processing ----
      {
        id: uuidv4(),
        derivative_code: "PRC_HEADLESS",
        derivative_name: "Headless",
        processing_type: "PROCESSED_UNCOOKED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        derivative_code: "PRC_TAILS",
        derivative_name: "Tails (Shrimp/Lobster)",
        processing_type: "PROCESSED_UNCOOKED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        derivative_code: "PRC_PUD",
        derivative_name: "Peeled Undeveined (PUD)",
        processing_type: "PROCESSED_UNCOOKED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        derivative_code: "PRC_PD",
        derivative_name: "Peeled Deveined (PD)",
        processing_type: "PROCESSED_UNCOOKED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        derivative_code: "PRC_PTO",
        derivative_name: "Peeled Tail-on (PTO / PDTO)",
        processing_type: "PROCESSED_UNCOOKED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        derivative_code: "PRC_EZPEEL",
        derivative_name: "EZ Peel",
        processing_type: "PROCESSED_UNCOOKED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },

      // ---- Crab / lobster processing ----
      {
        id: uuidv4(),
        derivative_code: "PRC_CLAWS_KNUCKLES",
        derivative_name: "Claws / Knuckles (Crab/Lobster)",
        processing_type: "PROCESSED_UNCOOKED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },

      // ---- Cephalopods processing ----
      {
        id: uuidv4(),
        derivative_code: "PRC_TUBES",
        derivative_name: "Tubes (Squid/Cuttlefish)",
        processing_type: "PROCESSED_UNCOOKED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        derivative_code: "PRC_TENTACLES",
        derivative_name: "Tentacles (Squid/Octopus)",
        processing_type: "PROCESSED_UNCOOKED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        derivative_code: "PRC_RINGS",
        derivative_name: "Rings (Squid/Cuttlefish)",
        processing_type: "PROCESSED_UNCOOKED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },

      // ---- Bivalves / Shellfish processing ----
      {
        id: uuidv4(),
        derivative_code: "PRC_HALF_SHELL",
        derivative_name: "Half-Shell (Bivalves)",
        processing_type: "PROCESSED_UNCOOKED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        derivative_code: "PRC_SHUCKED_MEAT",
        derivative_name: "Shucked Meat (Bivalves)",
        processing_type: "PROCESSED_UNCOOKED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },

      // ======================================================
      // COOKED / VALUE-ADDED
      // ======================================================
      {
        id: uuidv4(),
        derivative_code: "CKD_FISH_COOKED",
        derivative_name: "Cooked Fish (Steamed/Grilled/Smoked)",
        processing_type: "COOKED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        derivative_code: "CKD_SHRIMP_BOILED",
        derivative_name: "Cooked Shrimp/Prawn (Boiled/Steamed)",
        processing_type: "COOKED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        derivative_code: "CKD_CRAB_MEAT",
        derivative_name: "Cooked Crab Meat (Pasteurized)",
        processing_type: "COOKED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        derivative_code: "CKD_LOBSTER_MEAT",
        derivative_name: "Cooked Lobster Meat",
        processing_type: "COOKED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        derivative_code: "CKD_SQUID_COOKED",
        derivative_name: "Cooked Squid / Cuttlefish (Boiled/Steamed)",
        processing_type: "COOKED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        derivative_code: "CKD_OCTOPUS_COOKED",
        derivative_name: "Cooked Octopus (Boiled/Steamed)",
        processing_type: "COOKED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        derivative_code: "CKD_BIVALVE_MEAT",
        derivative_name: "Cooked Bivalve Meat (Mussel/Oyster/Clam)",
        processing_type: "COOKED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        derivative_code: "CKD_BREADED_BATTERED",
        derivative_name: "Breaded / Battered Seafood (Value-added)",
        processing_type: "COOKED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        derivative_code: "CKD_MARINATED_RTE",
        derivative_name: "Marinated / Ready-to-Eat Seafood",
        processing_type: "COOKED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        derivative_code: "CKD_CANNED_RETORT",
        derivative_name: "Canned / Retort Seafood (Shelf-stable)",
        processing_type: "COOKED",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert("derivative_master", rows, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("derivative_master", null, {});
  },
};
