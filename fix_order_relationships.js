const models = require("./models");

async function fixOrderRelationships() {
  try {
    await models.sequelize.authenticate();

    // Find an existing order to link to
    const existingOrder = await models.Orders.findOne({
      order: [["created_at", "DESC"]],
    });

    if (!existingOrder) {
      console.log("No orders found, skipping migration");
      return;
    }

    const orderId = existingOrder.id;
    console.log("Using order:", existingOrder.order_number, "ID:", orderId);

    // Update PeeledDispatches that are not linked to any order
    const peeledDispatches = await models.PeeledDispatches.findAll({
      where: { order_id: null },
    });

    console.log(
      `Found ${peeledDispatches.length} peeled dispatches without order_id`,
    );

    for (const pd of peeledDispatches) {
      // Find the related PeelingProducts -> Peeling -> Dispatches chain
      const peelingProduct = await models.PeelingProducts.findByPk(
        pd.peeled_product_id,
      );
      if (peelingProduct) {
        const peeling = await models.Peeling.findByPk(
          peelingProduct.peeling_id,
        );
        if (peeling) {
          const dispatch = await models.Dispatches.findByPk(
            peeling.dispatch_id,
          );
          if (dispatch) {
            // Update the chain with the order_id
            await dispatch.update({ order_id: orderId });
            await peeling.update({ order_id: orderId });
            await pd.update({ order_id: orderId });

            console.log(
              `Updated peeled dispatch ${pd.id} and related records with order_id ${orderId}`,
            );
          }
        }
      }
    }

    console.log("Migration completed");
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    process.exit(0);
  }
}

fixOrderRelationships();
