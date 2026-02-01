const models = require('./models');

async function testAllocateStockHandler() {
  try {
    await models.sequelize.authenticate();
    console.log('Database connected successfully');

    // Find an order with products
    const orderWithProducts = await models.Orders.findOne({
      include: [{
        model: models.OrderProducts,
        where: { is_active: true },
        required: true,
        attributes: ['product_master_id', 'quantity']
      }],
      limit: 1
    });

    if (!orderWithProducts) {
      console.log('No orders with products found for testing');
      return;
    }

    const orderId = orderWithProducts.id;
    const productId = orderWithProducts.OrderProducts[0].product_master_id;
    const expectedQuantity = orderWithProducts.OrderProducts[0].quantity;

    console.log('Testing allocate-stock handler with:');
    console.log('Order ID:', orderId);
    console.log('Product ID:', productId);
    console.log('Expected quantity from order:', expectedQuantity);

    // Import the handler directly
    const { AllocateStock } = require('./dist/routes/orders/handlers/allocate_stock.js');

    // Mock session and fastify objects
    const mockSession = {};
    const mockFastify = {
      log: console
    };

    // Call the handler
    const result = await AllocateStock(
      { order_id: orderId, product_id: productId },
      mockSession,
      mockFastify
    );

    console.log('Handler result:', result);

  } catch (error) {
    console.error('Error testing allocate-stock handler:');
    console.error(error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

testAllocateStockHandler();