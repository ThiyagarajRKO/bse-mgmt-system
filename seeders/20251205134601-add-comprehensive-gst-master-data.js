"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const effectiveFrom = new Date();
    const effectiveTo = null;

    const gstData = [
      // RAW SEAFOOD (5% GST)
      {
        hsn_code: "0303",
        gst_name: "Frozen fish",
        cgst_rate: 2.5,
        sgst_rate: 2.5,
        igst_rate: 5,
        effective_from: effectiveFrom,
        effective_to: effectiveTo,
        created_at: now,
        updated_at: now,
      },
      {
        hsn_code: "0304",
        gst_name: "Fish fillets and minced meat (fresh or frozen)",
        cgst_rate: 2.5,
        sgst_rate: 2.5,
        igst_rate: 5,
        effective_from: effectiveFrom,
        effective_to: effectiveTo,
        created_at: now,
        updated_at: now,
      },
      {
        hsn_code: "0305",
        gst_name: "Dried, salted or brined fish",
        cgst_rate: 2.5,
        sgst_rate: 2.5,
        igst_rate: 5,
        effective_from: effectiveFrom,
        effective_to: effectiveTo,
        created_at: now,
        updated_at: now,
      },
      {
        hsn_code: "0306",
        gst_name: "Crustaceans (shrimp, prawns, lobster, crab) – fresh/frozen",
        cgst_rate: 2.5,
        sgst_rate: 2.5,
        igst_rate: 5,
        effective_from: effectiveFrom,
        effective_to: effectiveTo,
        created_at: now,
        updated_at: now,
      },
      {
        hsn_code: "0307",
        gst_name:
          "Molluscs (squid, cuttlefish, octopus, bivalves) – fresh/frozen",
        cgst_rate: 2.5,
        sgst_rate: 2.5,
        igst_rate: 5,
        effective_from: effectiveFrom,
        effective_to: effectiveTo,
        created_at: now,
        updated_at: now,
      },

      // COOKED / VALUE ADDED SEAFOOD (12% GST)
      {
        hsn_code: "16051000",
        gst_name: "Cooked, steamed or boiled shrimp & prawns",
        cgst_rate: 6,
        sgst_rate: 6,
        igst_rate: 12,
        effective_from: effectiveFrom,
        effective_to: effectiveTo,
        created_at: now,
        updated_at: now,
      },
      {
        hsn_code: "16052010",
        gst_name: "Cooked, steamed crab meat (pasteurized)",
        cgst_rate: 6,
        sgst_rate: 6,
        igst_rate: 12,
        effective_from: effectiveFrom,
        effective_to: effectiveTo,
        created_at: now,
        updated_at: now,
      },
      {
        hsn_code: "16052900",
        gst_name: "Prepared or preserved crustaceans (non-canned)",
        cgst_rate: 6,
        sgst_rate: 6,
        igst_rate: 12,
        effective_from: effectiveFrom,
        effective_to: effectiveTo,
        created_at: now,
        updated_at: now,
      },
      {
        hsn_code: "16053000",
        gst_name: "Cooked or prepared molluscs (squid, octopus, scallops)",
        cgst_rate: 6,
        sgst_rate: 6,
        igst_rate: 12,
        effective_from: effectiveFrom,
        effective_to: effectiveTo,
        created_at: now,
        updated_at: now,
      },
      {
        hsn_code: "16054000",
        gst_name:
          "Cooked or prepared fish (grilled, smoked, steamed, marinated)",
        cgst_rate: 6,
        sgst_rate: 6,
        igst_rate: 12,
        effective_from: effectiveFrom,
        effective_to: effectiveTo,
        created_at: now,
        updated_at: now,
      },
      {
        hsn_code: "16055100",
        gst_name: "Breaded or battered seafood (ready-to-cook coated products)",
        cgst_rate: 6,
        sgst_rate: 6,
        igst_rate: 12,
        effective_from: effectiveFrom,
        effective_to: effectiveTo,
        created_at: now,
        updated_at: now,
      },
      {
        hsn_code: "16055900",
        gst_name:
          "Value-added seafood preparations (marinated, ready-to-eat packs)",
        cgst_rate: 6,
        sgst_rate: 6,
        igst_rate: 12,
        effective_from: effectiveFrom,
        effective_to: effectiveTo,
        created_at: now,
        updated_at: now,
      },
      {
        hsn_code: "16059010",
        gst_name: "Canned tuna, sardines, mackerel, salmon",
        cgst_rate: 6,
        sgst_rate: 6,
        igst_rate: 12,
        effective_from: effectiveFrom,
        effective_to: effectiveTo,
        created_at: now,
        updated_at: now,
      },
      {
        hsn_code: "16059090",
        gst_name: "Other prepared seafood (RTE/RTH products)",
        cgst_rate: 6,
        sgst_rate: 6,
        igst_rate: 12,
        effective_from: effectiveFrom,
        effective_to: effectiveTo,
        created_at: now,
        updated_at: now,
      },

      // PACKAGING MATERIALS (18% GST)
      {
        hsn_code: "39232100",
        gst_name: "LDPE / HDPE poly bags for food packaging",
        cgst_rate: 9,
        sgst_rate: 9,
        igst_rate: 18,
        effective_from: effectiveFrom,
        effective_to: effectiveTo,
        created_at: now,
        updated_at: now,
      },
      {
        hsn_code: "39201099",
        gst_name: "Plastic film (vacuum pouches, shrink wrap)",
        cgst_rate: 9,
        sgst_rate: 9,
        igst_rate: 18,
        effective_from: effectiveFrom,
        effective_to: effectiveTo,
        created_at: now,
        updated_at: now,
      },
      {
        hsn_code: "48192090",
        gst_name: "Corrugated cartons / master cartons",
        cgst_rate: 9,
        sgst_rate: 9,
        igst_rate: 18,
        effective_from: effectiveFrom,
        effective_to: effectiveTo,
        created_at: now,
        updated_at: now,
      },
      {
        hsn_code: "48211010",
        gst_name: "Self-adhesive labels / printed barcode labels",
        cgst_rate: 9,
        sgst_rate: 9,
        igst_rate: 18,
        effective_from: effectiveFrom,
        effective_to: effectiveTo,
        created_at: now,
        updated_at: now,
      },

      // STATIONERY (12–18% GST)
      {
        hsn_code: "48203000",
        gst_name: "Computer paper / printing paper",
        cgst_rate: 6,
        sgst_rate: 6,
        igst_rate: 12,
        effective_from: effectiveFrom,
        effective_to: effectiveTo,
        created_at: now,
        updated_at: now,
      },
      {
        hsn_code: "96081019",
        gst_name: "Ball pens / writing instruments",
        cgst_rate: 9,
        sgst_rate: 9,
        igst_rate: 18,
        effective_from: effectiveFrom,
        effective_to: effectiveTo,
        created_at: now,
        updated_at: now,
      },
    ];

    // Delete existing records first to ensure fresh data
    await queryInterface.sequelize.query(
      "DELETE FROM consolidated_gst_master WHERE hsn_code IN ('0303', '0304', '0305', '0306', '0307', '16051000', '16052010', '16052900', '16053000', '16054000', '16055100', '16055900', '16059010', '16059090', '39232100', '39201099', '48192090', '48211010', '48203000', '96081019')"
    );

    const mappedData = gstData.map((record) => ({
      id: Sequelize.literal("gen_random_uuid()"),
      hsn_code: record.hsn_code,
      gst_name: record.gst_name,
      cgst_rate: record.cgst_rate,
      sgst_rate: record.sgst_rate,
      igst_rate: record.igst_rate,
      effective_from: record.effective_from,
      effective_to: record.effective_to,
      is_active: true,
      created_at: record.created_at,
      updated_at: record.updated_at,
    }));

    await queryInterface.bulkInsert("consolidated_gst_master", mappedData, {});
    console.log("✅ Inserted comprehensive GST master data successfully");
  },

  async down(queryInterface, Sequelize) {
    // Delete the records by HSN codes
    await queryInterface.sequelize.query(
      "DELETE FROM consolidated_gst_master WHERE hsn_code IN ('0303', '0304', '0305', '0306', '0307', '16051000', '16052010', '16052900', '16053000', '16054000', '16055100', '16055900', '16059010', '16059090', '39232100', '39201099', '48192090', '48211010', '48203000', '96081019')"
    );
  },
};
