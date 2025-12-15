"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get existing suppliers, units, and products
    const suppliers = await queryInterface.sequelize.query(
      "SELECT id, supplier_name FROM supplier_master WHERE is_active = true ORDER BY supplier_name LIMIT 4",
      { type: Sequelize.QueryTypes.SELECT }
    );

    const units = await queryInterface.sequelize.query(
      "SELECT id, unit_name, unit_code FROM unit_master WHERE is_active = true ORDER BY unit_name LIMIT 4",
      { type: Sequelize.QueryTypes.SELECT }
    );

    const products = await queryInterface.sequelize.query(
      "SELECT id, product_name FROM product_master WHERE is_active = true ORDER BY product_name LIMIT 20",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (suppliers.length === 0 || units.length === 0 || products.length === 0) {
      console.log(
        "Required master data not found. Skipping procurement seeder."
      );
      return;
    }

    // Get admin user profile
    const adminProfile = await queryInterface.sequelize.query(
      "SELECT id FROM user_profiles WHERE is_active = true LIMIT 1",
      { type: Sequelize.QueryTypes.SELECT }
    );

    const profileId = adminProfile.length > 0 ? adminProfile[0].id : null;

    // Create procurement lots
    const procurementLots = [];
    const startDate = new Date("2024-01-01");
    const endDate = new Date("2024-12-31");

    for (let i = 1; i <= 50; i++) {
      const randomDays = Math.floor(
        (Math.random() * (endDate - startDate)) / (1000 * 60 * 60 * 24)
      );
      const procurementDate = new Date(
        startDate.getTime() + randomDays * 24 * 60 * 60 * 1000
      );

      const unit = units[Math.floor(Math.random() * units.length)];

      procurementLots.push({
        id: Sequelize.literal("gen_random_uuid()"),
        procurement_date: procurementDate,
        procurement_lot: `PL-${procurementDate.getFullYear()}${(
          procurementDate.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}${procurementDate
          .getDate()
          .toString()
          .padStart(2, "0")}-${i.toString().padStart(3, "0")}`,
        unit_master_id: unit.id,
        is_active: true,
        created_by: profileId,
        created_at: procurementDate,
        updated_at: procurementDate,
      });
    }

    await queryInterface.bulkInsert("procurement_lots", procurementLots, {
      ignoreDuplicates: true,
    });

    // Get the inserted procurement lots
    const insertedLots = await queryInterface.sequelize.query(
      "SELECT id, procurement_lot FROM procurement_lots WHERE is_active = true ORDER BY created_at DESC LIMIT 50",
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Create procurement products
    const procurementProducts = [];

    for (const lot of insertedLots) {
      // Each lot will have 1-5 products
      const numProducts = Math.floor(Math.random() * 5) + 1;

      for (let j = 0; j < numProducts; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const supplier =
          suppliers[Math.floor(Math.random() * suppliers.length)];

        const quantity = Math.floor(Math.random() * 1000) + 100; // 100-1100 kg
        const price = Math.floor(Math.random() * 500) + 200; // 200-700 per kg
        const totalAmount = quantity * price;

        procurementProducts.push({
          id: Sequelize.literal("gen_random_uuid()"),
          procurement_lot_id: lot.id,
          product_master_id: product.id,
          supplier_master_id: supplier.id,
          procurement_product_type: "UNPROCESSED",
          procurement_quantity: quantity,
          adjusted_quantity: quantity, // No adjustments for now
          procurement_price: price,
          adjusted_price: price,
          procurement_totalamount: totalAmount,
          procurement_purchaser: "Auto Generated",
          is_active: true,
          created_by: profileId,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
    }

    await queryInterface.bulkInsert(
      "procurement_products",
      procurementProducts,
      { ignoreDuplicates: true }
    );

    console.log(
      `Seeded ${procurementLots.length} procurement lots and ${procurementProducts.length} procurement products`
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("procurement_products", null, {});
    await queryInterface.bulkDelete("procurement_lots", null, {});
  },
};
