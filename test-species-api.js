#!/usr/bin/env node

/**
 * Test Script: Verify species_id is included in order products API response
 * Tests the fix for issue where species_id was showing as null
 */

const models = require("./models");

(async () => {
  try {
    const order_id = "64e39a97-d9f6-455e-a419-97c63e25ae51";

    console.log("\n🔍 Testing Order Products with Species ID...\n");
    console.log(`Order ID: ${order_id}`);

    // Simulate the GetAll controller logic with species_id enrichment
    const suppliers = await models.OrderProducts.findAndCountAll({
      subQuery: false,
      attributes: [
        "id",
        "order_id",
        "product_master_id",
        "packing_id",
        "unit",
        "price",
        "total_price",
        "discount",
        "description",
        "delivery_status",
      ],
      include: [
        {
          attributes: ["id", "product_name", "product_category_master_id"],
          model: models.ProductMaster,
          required: false,
        },
      ],
      where: { order_id, is_active: true },
      offset: 0,
      limit: 10,
      order: [["created_at", "desc"]],
    });

    console.log(`\nFound ${suppliers.count} order products`);
    console.log(`Showing ${suppliers.rows.length} rows\n`);

    // Add species_id to each order product
    if (suppliers.rows && suppliers.rows.length > 0) {
      for (let row of suppliers.rows) {
        if (row.ProductMaster && row.ProductMaster.product_category_master_id) {
          const category = await models.ProductCategoryMaster.findOne({
            attributes: ["species_master_id"],
            where: { id: row.ProductMaster.product_category_master_id },
          });
          if (category) {
            row.species_id = category.species_master_id;
          }
        }
      }
    }

    // Display results
    console.log("Sample Product (First Row):");
    console.log("─".repeat(80));
    if (suppliers.rows.length > 0) {
      const row = suppliers.rows[0];
      console.log(`ID:            ${row.id}`);
      console.log(`Order ID:      ${row.order_id}`);
      console.log(`Product Name:  ${row.ProductMaster?.product_name || "N/A"}`);
      console.log(
        `Category ID:   ${
          row.ProductMaster?.product_category_master_id || "N/A"
        }`
      );
      console.log(`Species ID:    ${row.species_id || "NULL"}`);
      console.log(`Unit:          ${row.unit}`);
      console.log(`Price:         ${row.price}`);
      console.log("─".repeat(80));

      if (row.species_id) {
        console.log(
          "\n✅ SUCCESS: species_id is now included in the response!"
        );
      } else {
        console.log("\n❌ FAILED: species_id is still NULL");
      }
    } else {
      console.log("❌ No order products found for this order");
    }

    process.exit(0);
  } catch (err) {
    console.error("\n❌ Error:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
