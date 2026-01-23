const models = require("./models");

async function checkOrders() {
  try {
    await models.sequelize.authenticate();

    const orders = await models.Orders.findAll({
      attributes: ["id", "order_number", "created_at"],
      limit: 5,
      order: [["created_at", "DESC"]],
    });

    console.log("Recent orders:", JSON.stringify(orders, null, 2));

    // Check if the order from the API test exists
    const testOrder = await models.Orders.findByPk(
      "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    );
    console.log("Test order exists:", !!testOrder);
    if (testOrder) {
      console.log("Test order:", JSON.stringify(testOrder, null, 2));
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

checkOrders();
