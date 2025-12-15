"use strict";

const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get existing master data
    const suppliers = await queryInterface.sequelize.query(
      "SELECT id as supplier_id, supplier_name FROM supplier_master WHERE is_active = true",
      { type: Sequelize.QueryTypes.SELECT }
    );

    const units = await queryInterface.sequelize.query(
      "SELECT id as unit_id, unit_name FROM unit_master WHERE is_active = true",
      { type: Sequelize.QueryTypes.SELECT }
    );

    const products = await queryInterface.sequelize.query(
      `SELECT plpm.product_master_id as product_id, pm.product_name
       FROM price_list_product_master plpm
       JOIN product_master pm ON plpm.product_master_id = pm.id
       WHERE plpm.is_active = true AND pm.is_active = true`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const adminProfile = await queryInterface.sequelize.query(
      "SELECT id as profile_id FROM user_profiles WHERE is_admin = true LIMIT 1",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (
      suppliers.length === 0 ||
      units.length === 0 ||
      products.length === 0 ||
      adminProfile.length === 0
    ) {
      console.log(
        "Required master data not found. Please ensure suppliers, units, products, and admin profile exist."
      );
      return;
    }

    const adminProfileId = adminProfile[0].profile_id;

    // Generate procurement lots data
    const procurementLots = [];
    const procurementProducts = [];
    const purchaseInventory = [];

    const procurementProductTypes = [
      "UNPROCESSED",
      "CLEANED",
      "PEELED",
      "SOAKED",
      "RE-GLAZED",
      "GRADED",
      "COOKED",
      "SORTED",
      "VALUE ADDED",
    ];

    // Create 50 procurement lots
    for (let i = 1; i <= 50; i++) {
      const lotId = uuidv4();
      const unit = units[Math.floor(Math.random() * units.length)];
      const procurementDate = new Date();
      procurementDate.setDate(
        procurementDate.getDate() - Math.floor(Math.random() * 30)
      ); // Random date within last 30 days

      procurementLots.push({
        id: lotId,
        procurement_date: procurementDate,
        procurement_lot: `LOT-${i.toString().padStart(3, "0")}`,
        unit_master_id: unit.unit_id,
        is_active: true,
        created_by: adminProfileId,
        updated_by: adminProfileId,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Create 1-5 procurement products per lot
      const numProducts = Math.floor(Math.random() * 5) + 1;
      let lotTotalQuantity = 0;
      let lotTotalAmount = 0;

      for (let j = 0; j < numProducts; j++) {
        const supplier =
          suppliers[Math.floor(Math.random() * suppliers.length)];
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 1000) + 100; // 100-1100 kg
        const unitPrice = Math.floor(Math.random() * 500) + 200; // 200-700 per kg
        const totalAmount = quantity * unitPrice;
        const productType =
          procurementProductTypes[
            Math.floor(Math.random() * procurementProductTypes.length)
          ];

        procurementProducts.push({
          id: uuidv4(),
          procurement_lot_id: lotId,
          supplier_master_id: supplier.supplier_id,
          product_master_id: product.product_id,
          procurement_product_type: productType,
          procurement_quantity: quantity,
          procurement_price: unitPrice,
          procurement_totalamount: totalAmount,
          procurement_purchaser: "System Admin",
          is_active: true,
          created_by: adminProfileId,
          updated_by: adminProfileId,
          created_at: new Date(),
          updated_at: new Date(),
        });

        lotTotalQuantity += quantity;
        lotTotalAmount += totalAmount;

        // Create purchase inventory entry
        purchaseInventory.push({
          id: uuidv4(),
          procurement_product_id:
            procurementProducts[procurementProducts.length - 1].id,
          product_master_id: product.product_id,
          procurement_product_type: productType,
          quantity: quantity,
          is_active: true,
          created_by: adminProfileId,
          updated_by: adminProfileId,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
    }

    // Insert procurement lots
    await queryInterface.bulkInsert("procurement_lots", procurementLots, {});

    // Insert procurement products
    await queryInterface.bulkInsert(
      "procurement_products",
      procurementProducts,
      {}
    );

    // Insert purchase inventory
    await queryInterface.bulkInsert(
      "purchase_inventory",
      purchaseInventory,
      {}
    );

    console.log(
      `Seeded ${procurementLots.length} procurement lots, ${procurementProducts.length} procurement products, and ${purchaseInventory.length} purchase inventory entries`
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("purchase_inventory", null, {});
    await queryInterface.bulkDelete("procurement_products", null, {});
    await queryInterface.bulkDelete("procurement_lots", null, {});
  },
};
