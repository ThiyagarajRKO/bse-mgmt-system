const db = require("./models");
const PurchaseRequestService = require("./services/PurchaseRequestService");

async function testProcurementIntegration() {
  try {
    console.log("🧪 Testing Procurement Integration");
    console.log(
      "Testing that procurement creates raw material records when inventory is insufficient...",
    );

    // Find an existing order and product for testing
    const orderProduct = await db.OrderProducts.findOne({
      where: { is_active: true },
      include: [
        {
          model: db.Orders,
          as: "Order",
          where: {
            is_active: true,
            order_status: { [db.Sequelize.Op.ne]: "ALLOCATED" },
          },
          required: true,
        },
        {
          model: db.ProductMaster,
          as: "ProductMaster",
          where: { is_active: true },
          required: true,
        },
      ],
    });

    if (!orderProduct) {
      console.log("❌ No suitable order found for testing");
      return;
    }

    console.log(
      `Found order: ${orderProduct.Order.order_no}, product: ${orderProduct.ProductMaster.product_name}`,
    );

    // Mock session
    const mockSession = {
      pid: "test-user",
      user_id: "test-user",
    };

    // Mock fastify object
    const mockFastify = {
      sequelize: db.sequelize,
    };

    // Test the PurchaseRequestService directly
    console.log("Testing PurchaseRequestService.createPurchaseRequest...");
    console.log(
      `Product ID: ${orderProduct.product_master_id}, Quantity: ${orderProduct.quantity}`,
    );

    const procurementResult =
      await PurchaseRequestService.createPurchaseRequest(
        orderProduct.product_master_id, // productId
        orderProduct.quantity || 100, // requiredQuantity
        orderProduct.order_id, // orderId
        {
          // inventoryDetails
          available: 0,
          required: orderProduct.quantity || 100,
        },
      );

    console.log("📊 Procurement result:", procurementResult);

    if (procurementResult && procurementResult.length > 0) {
      console.log("✅ Procurement was triggered successfully!");
      console.log(
        `📋 Created ${procurementResult.length} procurement request(s)`,
      );

      // Check if procurement records were created
      const procurementRecords = await db.ProcurementProducts.findAll({
        where: {
          order_id: orderProduct.order_id,
          is_active: true,
        },
        include: [
          {
            model: db.ProductMaster,
            as: "ProductMaster",
            attributes: ["product_name", "product_id"],
          },
        ],
      });

      console.log(`Found ${procurementRecords.length} procurement records:`);
      procurementRecords.forEach((record) => {
        console.log(
          `- ${record.ProductMaster?.product_name} (${record.procurement_product_type}): ${record.procurement_quantity} units`,
        );
      });

      // Check if they are raw materials
      const unprocessedProcurements = procurementRecords.filter(
        (r) => r.procurement_product_type === "UNPROCESSED",
      );
      const processedProcurements = procurementRecords.filter(
        (r) => r.procurement_product_type !== "UNPROCESSED",
      );

      console.log(`\n📈 Summary:`);
      console.log(
        `- Unprocessed (Raw) material procurements: ${unprocessedProcurements.length}`,
      );
      console.log(
        `- Processed/Finished goods procurements: ${processedProcurements.length}`,
      );

      if (
        unprocessedProcurements.length > 0 &&
        processedProcurements.length === 0
      ) {
        console.log(
          "✅ SUCCESS: Only raw materials (UNPROCESSED) are being procured!",
        );
      } else if (processedProcurements.length > 0) {
        console.log(
          "❌ FAILURE: Processed goods are still being procured instead of raw materials",
        );
      } else {
        console.log("⚠️  No procurements created - check inventory levels");
      }
    } else {
      console.log("❌ Procurement was not triggered");
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    process.exit(0);
  }
}

testProcurementIntegration();
