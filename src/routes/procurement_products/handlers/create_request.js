import models from "../../../../models";

export const CreateRequest = (
  { profile_id, order_id, product_id, supplier_id, quantity, remarks },
  session,
  fastify,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { v4: uuidv4 } = require("uuid");

      // Start a transaction to ensure data consistency
      const transaction = await fastify.sequelize.transaction();

      try {
        // First, create a procurement lot
        const procurementLot = await models.ProcurementLots.create(
          {
            id: uuidv4(),
            order_id: order_id,
            unit_master_id: null, // Will be set based on product type
            is_active: true,
            created_by: profile_id,
          },
          { transaction, profile_id },
        );

        // Create the procurement product record
        const procurementProduct = await models.ProcurementProducts.create(
          {
            id: uuidv4(),
            procurement_lot_id: procurementLot.id,
            product_master_id: product_id,
            supplier_master_id: supplier_id,
            procurement_product_type: "RAW_MATERIAL", // Assuming raw material procurement
            procurement_quantity: quantity,
            procurement_price: 0, // Will be set during actual purchase
            order_id: order_id,
            is_active: true,
            created_by: profile_id,
          },
          { transaction, profile_id },
        );

        // Commit the transaction
        await transaction.commit();

        fastify.log.info(
          `Procurement request created: order_id=${order_id}, product_id=${product_id}, supplier_id=${supplier_id}, quantity=${quantity}, procurement_product_id=${procurementProduct.id}`,
        );

        resolve({
          message: "Procurement request created successfully",
          data: {
            request_id: procurementProduct.id,
            procurement_lot_id: procurementLot.id,
          },
        });
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    } catch (err) {
      fastify.log.error("Error creating procurement request:", err);
      reject(err);
    }
  });
};
