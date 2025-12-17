"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ==========================================
    // CONFIGURE THIS: Set the product ID below
    // ==========================================
    const PRODUCT_ID = "YOUR_PRODUCT_ID_HERE"; // Replace with actual product UUID

    console.log(`Starting GST mapping for specific product: ${PRODUCT_ID}`);

    // Get the product details
    const product = await queryInterface.sequelize.query(
      `
      SELECT id, product_name, hsn_code
      FROM product_master
      WHERE id = :productId AND is_active = true AND hsn_code IS NOT NULL
    `,
      {
        replacements: { productId: PRODUCT_ID },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    if (!product || product.length === 0) {
      console.log(`Product not found or is inactive: ${PRODUCT_ID}`);
      return Promise.resolve();
    }

    console.log(
      `Found product: ${product[0].product_name} (HSN: ${product[0].hsn_code})`
    );

    // Create mapping for this specific product
    const result = await queryInterface.sequelize.query(
      `
      INSERT INTO product_gst_mapping (
        id, product_id, tax_code_id, gst_master_id,
        cgst_rate, sgst_rate, igst_rate, effective_from, effective_to, note,
        is_active, created_at, updated_at
      )
      SELECT
        gen_random_uuid(),
        pb.id,
        NULL,
        gst.id,
        gst.cgst_rate,
        gst.sgst_rate,
        gst.igst_rate,
        NOW()::date,
        NULL,
        'Auto-generated mapping based on HSN code',
        true,
        NOW(),
        NOW()
      FROM (
        SELECT id, product_name, hsn_code
        FROM product_master
        WHERE id = :productId
      ) pb
      INNER JOIN consolidated_gst_master gst ON pb.hsn_code LIKE gst.hsn_code || '%'
      WHERE NOT EXISTS (
        SELECT 1 FROM product_gst_mapping pgm
        WHERE pgm.product_id = pb.id
        AND pgm.gst_master_id = gst.id
        AND pgm.tax_code_id IS NULL
      )
    `,
      {
        replacements: {
          productId: PRODUCT_ID,
        },
        type: Sequelize.QueryTypes.INSERT,
      }
    );

    const mappingsCreated = Array.isArray(result) ? result[0] : result;
    console.log(`Completed! Total mappings created: ${mappingsCreated || 0}`);
    return Promise.resolve();
  },

  async down(queryInterface, Sequelize) {
    // ==========================================
    // CONFIGURE THIS: Set the product ID below
    // ==========================================
    const PRODUCT_ID = "YOUR_PRODUCT_ID_HERE"; // Replace with actual product UUID

    return queryInterface.sequelize.query(
      `
      DELETE FROM product_gst_mapping
      WHERE product_id = :productId
    `,
      {
        replacements: { productId: PRODUCT_ID },
      }
    );
  },
};
