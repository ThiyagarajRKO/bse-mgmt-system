import models from "../../../../models";

export const CheckInventory = async (
  { product_master_id },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!product_master_id) {
        return reject({
          statusCode: 420,
          message: "Product ID must not be empty!",
        });
      }

      // Find the inventory record for the product
      const inventory = await models.SalesInventory.findOne({
        where: {
          product_master_id,
          is_active: true,
        },
        attributes: ["id", "quantity", "product_master_id"],
      });

      resolve({
        statusCode: 200,
        message: "Inventory checked successfully",
        data: {
          product_master_id,
          available_quantity: inventory?.quantity || 0,
          has_stock: (inventory?.quantity || 0) > 0,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject({
        statusCode: 500,
        message: "Error checking inventory",
        error: err.message,
      });
    }
  });
};
