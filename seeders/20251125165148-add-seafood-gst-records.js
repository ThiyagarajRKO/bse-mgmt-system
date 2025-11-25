"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get the first company ID for seeding
    const companies = await queryInterface.sequelize.query(
      "SELECT id FROM company_master LIMIT 1;",
      { type: Sequelize.QueryTypes.SELECT }
    );

    const companyId = companies.length > 0 ? companies[0].id : null;

    const gstRecords = [
      // ---- RAW SEAFOOD (HSN 0301-0308) ----
      {
        gst_rate_id: "0001-raw-seafood",
        gst_name: "Live fish – fresh, chilled",
        hsn_code: "0301",
        cgst_rate: 0.0,
        sgst_rate: 0.0,
        igst_rate: 0.0,
        export_gst: 0.0,
        effective_from: "2017-07-01",
        effective_to: null,
        is_active: true,
      },
      {
        gst_rate_id: "0002-fish-fresh",
        gst_name: "Fish – fresh or chilled (excluding fillets)",
        hsn_code: "0302",
        cgst_rate: 0.0,
        sgst_rate: 0.0,
        igst_rate: 0.0,
        export_gst: 0.0,
        effective_from: "2017-07-01",
        effective_to: null,
        is_active: true,
      },
      {
        gst_rate_id: "0003-fish-frozen",
        gst_name: "Fish – frozen (non fillet)",
        hsn_code: "0303",
        cgst_rate: 2.5,
        sgst_rate: 2.5,
        igst_rate: 5.0,
        export_gst: 0.0,
        effective_from: "2017-07-01",
        effective_to: null,
        is_active: true,
      },
      {
        gst_rate_id: "0004-fish-fillets-fresh",
        gst_name: "Fish fillets & fish meat – fresh or chilled",
        hsn_code: "0304",
        cgst_rate: 0.0,
        sgst_rate: 0.0,
        igst_rate: 0.0,
        export_gst: 0.0,
        effective_from: "2017-07-01",
        effective_to: null,
        is_active: true,
      },
      {
        gst_rate_id: "0005-fish-fillets-frozen",
        gst_name: "Fish fillets & fish meat – frozen / packaged",
        hsn_code: "0304",
        cgst_rate: 2.5,
        sgst_rate: 2.5,
        igst_rate: 5.0,
        export_gst: 0.0,
        effective_from: "2017-07-01",
        effective_to: null,
        is_active: true,
      },
      {
        gst_rate_id: "0006-crustaceans-fresh",
        gst_name: "Crustaceans (shrimp/prawns) – fresh or chilled",
        hsn_code: "0306",
        cgst_rate: 0.0,
        sgst_rate: 0.0,
        igst_rate: 0.0,
        export_gst: 0.0,
        effective_from: "2017-07-01",
        effective_to: null,
        is_active: true,
      },
      {
        gst_rate_id: "0007-crustaceans-frozen",
        gst_name: "Crustaceans (shrimp/prawns) – frozen",
        hsn_code: "0306",
        cgst_rate: 2.5,
        sgst_rate: 2.5,
        igst_rate: 5.0,
        export_gst: 0.0,
        effective_from: "2017-07-01",
        effective_to: null,
        is_active: true,
      },
      {
        gst_rate_id: "0008-molluscs-fresh",
        gst_name: "Molluscs – fresh or chilled",
        hsn_code: "0307",
        cgst_rate: 0.0,
        sgst_rate: 0.0,
        igst_rate: 0.0,
        export_gst: 0.0,
        effective_from: "2017-07-01",
        effective_to: null,
        is_active: true,
      },
      {
        gst_rate_id: "0009-molluscs-frozen",
        gst_name: "Molluscs – frozen",
        hsn_code: "0307",
        cgst_rate: 2.5,
        sgst_rate: 2.5,
        igst_rate: 5.0,
        export_gst: 0.0,
        effective_from: "2017-07-01",
        effective_to: null,
        is_active: true,
      },
      {
        gst_rate_id: "0010-aquatic-invertebrates",
        gst_name: "Aquatic invertebrates – fresh/chilled/frozen",
        hsn_code: "0308",
        cgst_rate: 2.5,
        sgst_rate: 2.5,
        igst_rate: 5.0,
        export_gst: 0.0,
        effective_from: "2017-07-01",
        effective_to: null,
        is_active: true,
      },

      // ---- PROCESSED SEAFOOD (HSN 1605) ----
      {
        gst_rate_id: "0011-processed-seafood-12",
        gst_name:
          "Prepared/preserved fish, crustaceans, molluscs (ready-to-eat)",
        hsn_code: "1605",
        cgst_rate: 6.0,
        sgst_rate: 6.0,
        igst_rate: 12.0,
        export_gst: 0.0,
        effective_from: "2017-07-01",
        effective_to: null,
        is_active: true,
      },

      // ---- SEAFOOD WASTE / MEAL (HSN 2301) ----
      {
        gst_rate_id: "0012-seafood-meal",
        gst_name: "Flours/meals/pellets of fish & crustaceans",
        hsn_code: "230120",
        cgst_rate: 2.5,
        sgst_rate: 2.5,
        igst_rate: 5.0,
        export_gst: 0.0,
        effective_from: "2017-07-01",
        effective_to: null,
        is_active: true,
      },

      // ---- PACKAGING MATERIAL (18%) ----
      {
        gst_rate_id: "0013-plastic-packaging",
        gst_name: "Plastic packaging material (bags, rolls, trays)",
        hsn_code: "3923",
        cgst_rate: 9.0,
        sgst_rate: 9.0,
        igst_rate: 18.0,
        export_gst: 0.0,
        effective_from: "2017-07-01",
        effective_to: null,
        is_active: true,
      },
      {
        gst_rate_id: "0014-paper-packaging",
        gst_name: "Paper corrugated packaging",
        hsn_code: "4819",
        cgst_rate: 9.0,
        sgst_rate: 9.0,
        igst_rate: 18.0,
        export_gst: 0.0,
        effective_from: "2017-07-01",
        effective_to: null,
        is_active: true,
      },
      {
        gst_rate_id: "0015-cartons",
        gst_name: "Cartons, boxes, cases",
        hsn_code: "4819",
        cgst_rate: 9.0,
        sgst_rate: 9.0,
        igst_rate: 18.0,
        export_gst: 0.0,
        effective_from: "2017-07-01",
        effective_to: null,
        is_active: true,
      },

      // ---- EXPORT GST (0%) ENTRY ----
      {
        gst_rate_id: "0016-export-zero",
        gst_name: "Export of seafood (all categories)",
        hsn_code: "999999",
        cgst_rate: 0.0,
        sgst_rate: 0.0,
        igst_rate: 0.0,
        export_gst: 0.0,
        effective_from: "2017-07-01",
        effective_to: null,
        is_active: true,
      },
    ];

    // Insert or update records
    for (const record of gstRecords) {
      // Check if record already exists
      const existing = await queryInterface.sequelize.query(
        `SELECT id FROM consolidated_gst_master WHERE company_id = $1 AND hsn_code = $2`,
        {
          bind: [companyId, record.hsn_code],
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (existing.length > 0) {
        // Update existing record
        await queryInterface.sequelize.query(
          `UPDATE consolidated_gst_master SET
            gst_rate_id = $1,
            gst_name = $2,
            cgst_rate = $3,
            sgst_rate = $4,
            igst_rate = $5,
            export_gst = $6,
            effective_from = $7,
            effective_to = $8,
            is_active = $9,
            updated_at = NOW()
          WHERE company_id = $10 AND hsn_code = $11`,
          {
            bind: [
              record.gst_rate_id,
              record.gst_name,
              record.cgst_rate,
              record.sgst_rate,
              record.igst_rate,
              record.export_gst,
              record.effective_from,
              record.effective_to,
              record.is_active,
              companyId,
              record.hsn_code,
            ],
            type: Sequelize.QueryTypes.UPDATE,
          }
        );
      } else {
        // Insert new record
        await queryInterface.sequelize.query(
          `INSERT INTO consolidated_gst_master (
            id, company_id, gst_rate_id, gst_name, hsn_code,
            cgst_rate, sgst_rate, igst_rate, export_gst,
            effective_from, effective_to, is_active, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
          )`,
          {
            bind: [
              companyId,
              record.gst_rate_id,
              record.gst_name,
              record.hsn_code,
              record.cgst_rate,
              record.sgst_rate,
              record.igst_rate,
              record.export_gst,
              record.effective_from,
              record.effective_to,
              record.is_active,
            ],
            type: Sequelize.QueryTypes.INSERT,
          }
        );
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove all seeded GST records by gst_rate_id
    await queryInterface.sequelize.query(
      `DELETE FROM consolidated_gst_master WHERE gst_rate_id IN (
        '0001-raw-seafood', '0002-fish-fresh', '0003-fish-frozen',
        '0004-fish-fillets-fresh', '0005-fish-fillets-frozen',
        '0006-crustaceans-fresh', '0007-crustaceans-frozen',
        '0008-molluscs-fresh', '0009-molluscs-frozen',
        '0010-aquatic-invertebrates', '0011-processed-seafood-12',
        '0012-seafood-meal', '0013-plastic-packaging',
        '0014-paper-packaging', '0015-cartons', '0016-export-zero'
      )`,
      { type: Sequelize.QueryTypes.DELETE }
    );
  },
};
