import { PeeledDispatches, PeelingProducts } from "../../../controllers";

export const Update = (
  { profile_id, peeled_dispatch_id, peeled_dispatch_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!peeled_dispatch_data?.peeled_dispatch_quantity) {
        if (!peeled_dispatch_data?.peeling_product_id) {
          return reject({
            statusCode: 420,
            message: "peeled and dispatched product id must not be empty",
          });
        }
        const { yield_quantity } = await PeelingProducts.GetQuantity({
          id: peeled_dispatch_data?.peeled_product_id,
        });

        if (!yield_quantity) {
          return reject({
            statusCode: 420,
            message: "Invalid product quantity",
          });
        } else if (
          yield_quantity < peeled_dispatch_data?.peeled_dispatch_quantity
        ) {
          return reject({
            statusCode: 420,
            message: "Dispatched quantity is grater than Procurement quantity",
          });
        }
      }

      const updated_data = await PeeledDispatches.Update(
        profile_id,
        peeled_dispatch_id,
        peeled_dispatch_data
      );

      if (updated_data?.[0] > 0) {
        return resolve({
          message: "Dispatch data has been updated successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Dispatch data didn't update",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
